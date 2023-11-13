terraform {
  backend "s3" {
    key    = "aws/terraform/terraform.tfstate"
    region = "us-east-1"
  }
}


provider "aws" {
  region = var.aws_region # Set to your desired AWS region
}

locals {
  migration_folder = pathexpand("${path.module}/../prisma/migrations")
  migration_folders = fileset(local.migration_folder, "*_init")
}

resource "null_resource" "ssh_tunnel" {
  provisioner "local-exec" {
    command = "scp tunnel.sh ec2-user@${aws_eip.server_eip.public_ip}:tunnel.sh"
  }

  triggers = {
    always_run = "${timestamp()}"
  }
}

resource "aws_s3_bucket" "migration_bucket" {
  bucket = "tindoori-prisma-migration"
}

resource "null_resource" "upload_migration_files" {
  for_each = toset(local.migration_folders)

  provisioner "local-exec" {
    command = "aws s3 cp ${each.value}/migration.sql s3://tindoori-prisma-migration/"
  }
}

resource "aws_vpc" "main" {
  cidr_block = var.cidr_block
  tags = {
    Name = "tindoori-vpc"
  }
}

resource "aws_ecr_repository" "ecr_repo" {
  name                 = "tindoori-app"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

}

resource "aws_iam_role" "ec2_role" {
  name = "ECRReadOnlyAndEC2LogsRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "ecr_readonly_attachment" {
  name       = "ECRReadOnlyAttachment"
  roles      = [aws_iam_role.ec2_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}


resource "aws_iam_policy" "ec2_logs_policy" {
  name        = "EC2LogsPolicy"
  description = "Allows writing logs to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_logs_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_logs_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2_profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_iam_role" "rds_monitoring_role" {
  name = "RDSMonitoringRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_attachment" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_eip" "server_eip" {
  instance = aws_instance.servernode.id
  domain   = "vpc"
}

# Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.0.0/24"
  availability_zone       = var.aws_public_availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "tindoori-public-subnet"
  }
}

# Private Subnet 1
resource "aws_subnet" "private_subnet_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.aws_private_availability_zone_1
  map_public_ip_on_launch = false

  tags = {
    Name = "tindoori-private-subnet-1"
  }
}

# Private Subnet 2
resource "aws_subnet" "private_subnet_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = var.aws_private_availability_zone_2
  map_public_ip_on_launch = false

  tags = {
    Name = "tindoori-private-subnet-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main_gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "tindoori-internet-gateway"
  }
}

# Public Route Table
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "tindoori-public-route-table"
  }
}

# Public Route
resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.public_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main_gw.id
}

# Public Subnet Association with Public Route Table
resource "aws_route_table_association" "public_subnet_association" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_route_table.id
}

# Private Subnet Association with Default Route Table
resource "aws_route_table_association" "private_subnet_association_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_vpc.main.default_route_table_id
}

resource "aws_route_table_association" "private_subnet_association_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_vpc.main.default_route_table_id
}

# user_data = templatefile("install_postgres.sh", {
#     pg_hba_file = templatefile("pg_hba.conf", { allowed_ip = aws_eip.server_eip.public_ip }),
#     allowed_ip  = aws_eip.server_eip.public_ip,
#     db_password = var.db_password
#   })
resource "aws_instance" "servernode" {
  ami                         = "ami-053b0d53c279acc90"
  instance_type               = var.instance_type
  key_name                    = var.key_name
  vpc_security_group_ids      = [aws_security_group.main_security_group.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  subnet_id                   = aws_subnet.public_subnet.id
  associate_public_ip_address = true
  user_data = templatefile("tunnel.sh", {
    server_ip = aws_eip.server_eip.public_ip,
    rds_endpoint = split(":", aws_db_instance.rds_instance.endpoint)[0]
  })
  tags = {
    Name = "tindoori-server"
  }

}

resource "aws_security_group" "main_security_group" {
  name        = "Backend"
  description = "Allow SSH and PostgreSQL inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress = [{
    description      = "SSH"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = []
    prefix_list_ids  = []
    security_groups  = []
    self             = false
    },
    {
      description      = "HTTP"
      from_port        = 3000
      to_port          = 3000
      protocol         = "tcp"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      security_groups  = []
      self             = false
    }
  ]



  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tindoori-server-security-group"
  }
}

resource "aws_security_group" "database_security_group" {
  name        = "PostgreSQL"
  description = "Allow SSH and PostgreSQL inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress = [
    {
      description      = "POSTGRES"
      from_port        = 5432
      to_port          = 5432
      protocol         = "tcp"
      cidr_blocks      = []
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      security_groups  = [aws_security_group.main_security_group.id]
      self             = false
    },
  ]



  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tindoori-database-security-group"
  }
}


# RDS Parameter Group
resource "aws_db_parameter_group" "rds_parameter_group" {
  name        = "custom-rds-parameters"
  family      = "postgres15"
  description = "Custom DB parameter group for PostgreSQL 15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_checkpoints"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }



  # Add other parameters as needed for your specific use case.
}

# RDS Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name        = "rds-subnet-group"
  description = "RDS Subnet Group for private subnet"
  subnet_ids  = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

# RDS Instance in Private Subnet
resource "aws_db_instance" "rds_instance" {
  identifier                   = "tindoori-db-instance"
  allocated_storage            = 20
  max_allocated_storage        = 100
  storage_type                 = "gp2"
  engine                       = "postgres"
  engine_version               = "15.4"
  instance_class               = "db.m7g.large"
  username                     = var.db_username
  db_name                      = var.db_name
  password                     = var.db_password
  parameter_group_name         = aws_db_parameter_group.rds_parameter_group.name
  db_subnet_group_name         = aws_db_subnet_group.rds_subnet_group.name
  multi_az                     = true
  backup_retention_period      = 7
  vpc_security_group_ids       = [aws_security_group.database_security_group.id]
  skip_final_snapshot          = true
  performance_insights_enabled = true
  monitoring_role_arn          = aws_iam_role.rds_monitoring_role.arn
  monitoring_interval          = 60

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]


  tags = {
    Name = "tindoori-rds-instance"
  }
}

# Show the public IP of the newly created instance
output "db_instance_endpoint" {
  value = split(":", aws_db_instance.rds_instance.endpoint)[0]
}

output "app_instance_ip_addr" {
  value = aws_eip.server_eip.public_ip
}