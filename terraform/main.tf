terraform {
  backend "s3" {
    key    = "aws/terraform/terraform.tfstate"
    region = var.region
  }
}


# Provider configuration: plugin that Terraform uses to 
# translate the API interactions with the AWS service.
provider "aws" {
  region = var.aws_region
}

resource "aws_ecr_repository" "ecr_repo" {
  name                 = "tindoori-app"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

}
resource "aws_instance" "servernode" {
  ami                    = "ami-053b0d53c279acc90"
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.main_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2-profile.name
  connection {
    type        = "ssh"
    host        = self.public_ip
    user        = "ubuntu"
    private_key = var.private_key
    timeout     = "4m"
  }
  user_data = templatefile("deploy_prisma_schema.sh", {
    db_connection_url = "postgresql://postgres:testpassword@${aws_instance.dbnode.*.public_ip}:5432/postgres"
  })
  tags = {
    "name" = "DeployVM"
  }

}

resource "aws_iam_instance_profile" "ec2-profile" {
  name = "ec2-profile"
  role = "ECR-LOGIN-AUTO"
}

# VPC: The resource block defines a piece of infrastructure.
resource "aws_vpc" "main" {
  cidr_block = var.cidr_block
  tags = {
    Name = "tindoori-vpc"
  }
}

# Internet gateway: allow the VPC to connect to the internet
resource "aws_internet_gateway" "main_gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "main_gw"
  }
}

# VPC route table: this route table is used by all 
# subnets not associated with a different route table
resource "aws_default_route_table" "route_table" {
  default_route_table_id = aws_vpc.main.default_route_table_id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_gw.id
  }
  tags = {
    Name = "default route table"
  }
}

# Subnet that can be accessed from the internet (SSH)
resource "aws_subnet" "my_public_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet
  availability_zone       = var.aws_availability_zone
  map_public_ip_on_launch = true # This line makes the subnet public
  tags = {
    Name = "tindoori-public-subnet"
  }
}

# AWS Security Group
resource "aws_security_group" "main_security_group" {
  name        = "PostgreSQL"
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
      description      = "POSTGRES"
      from_port        = 5432
      to_port          = 5432
      protocol         = "tcp"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      security_groups  = []
      self             = false
    },
    {
      description      = "HTTP"
      from_port        = 80
      to_port          = 80
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
    Name = "allow_tls"
  }
}



# PostgreSQL DB Instance
resource "aws_instance" "dbnode" {
  ami           = "ami-053b0d53c279acc90" # Amazon Linux 2 ARM 
  instance_type = var.instance_type
  key_name      = var.key_name
  user_data = templatefile("install_postgres.sh", {
    pg_hba_file = templatefile("pg_hba.conf", { allowed_ip = "0.0.0.0/0" }),
  })
  subnet_id                   = aws_subnet.my_public_subnet.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.main_security_group.id]
  tags = {
    Name = "PostgreSQL"
  }
}

# Show the public IP of the newly created instance
output "db_instance_ip_addr" {
  value = aws_instance.dbnode.*.public_ip
}

output "app_instance_ip_addr" {
  value = aws_instance.servernode.public_ip
}