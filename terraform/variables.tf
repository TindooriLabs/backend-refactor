variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "cidr_block" {
  default = "10.0.0.0/16"
}
variable "instance_type" {
  type    = string
  default = "t3.large"
}
variable "aws_public_availability_zone" {
  type    = string
  default = "us-east-1c"
}
variable "aws_private_availability_zone_1" {
  type    = string
  default = "us-east-1b"
}
variable "aws_private_availability_zone_2" {
  type    = string
  default = "us-east-1c"
}
variable "key_name" {

}
variable "public_key" {

}
variable "private_key" {

}
variable "db_password" {

}
variable "db_username" {

}
variable "db_name" {

}
