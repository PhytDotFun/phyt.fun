terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
  }
}

# Get latest fck-nat AMI
data "aws_ami" "fck_nat" {
  most_recent = true
  owners      = ["568608671756"] # fck-nat project

  filter {
    name   = "name"
    values = ["fck-nat-al2023-*"]
  }
  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# Security group for fck-nat instance
resource "aws_security_group" "fck_nat" {
  name_prefix = "${var.deployment_id}-fck-nat-sg-"
  vpc_id      = var.vpc_id

  # Allow all traffic from private subnet
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.private_subnet_cidr]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.deployment_id}-fck-nat-sg"
  }
}

# fck-nat EC2 instance
resource "aws_instance" "fck_nat" {
  ami                    = data.aws_ami.fck_nat.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.fck_nat.id]
  iam_instance_profile   = var.iam_instance_profile
  source_dest_check      = false

  tags = {
    Name = "${var.deployment_id}-fck-nat"
  }
}
