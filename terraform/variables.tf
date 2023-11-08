variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "cidr_block" {
  default = "10.0.0.0/16"
}
variable "subnet" {
  default = "10.0.0.0/24"
}
variable "instance_type" {
  type    = string
  default = "t3.micro"
}
variable "aws_availability_zone" {
  type    = string
  default = "us-east-1a"
}
variable "key_name" {

}
variable "public_key" {

}
variable "private_key" {

}
variable "db_password" {

}
