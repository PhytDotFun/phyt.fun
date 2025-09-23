terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = {
    Name        = "${var.environment}-vpc-${var.deployment_id}"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw-${var.deployment_id}"
    Environment = var.environment
  }
}

# Subnets
# Public subnet for staging instance and NAT
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone_id    = var.availability_zones[0]
  map_public_ip_on_launch = var.map_public_ip_on_launch

  tags = {
    Name        = "${var.environment}-public-subnet-${var.deployment_id}"
    Environment = var.environment
    Type        = "public"
  }
}

# Private subnet for database
resource "aws_subnet" "private" {
  vpc_id               = aws_vpc.main.id
  cidr_block           = var.private_subnet_cidr
  availability_zone_id = var.availability_zones[1]

  tags = {
    Name        = "${var.environment}-private-subnet-${var.deployment_id}"
    Environment = var.environment
    Type        = "private"
  }
}

# Route Tables
# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-rt-${var.deployment_id}"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Private route table (routes through NAT)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # Only add NAT route if NAT interface is provided
  dynamic "route" {
    for_each = var.nat_network_interface_id != null ? [1] : []
    content {
      cidr_block           = "0.0.0.0/0"
      network_interface_id = var.nat_network_interface_id
    }
  }

  tags = {
    Name        = "${var.environment}-private-rt-${var.deployment_id}"
    Environment = var.environment
    Type        = "private"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# Network ACLs
# Private subnet NACL
# This provides subnet-level firewall rules as defense-in-depth
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = [aws_subnet.private.id]

  # Allow PostgreSQL from public subnet only
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.public_subnet_cidr
    from_port  = 5432
    to_port    = 5432
  }

  # Allow return traffic from established connections (ephemeral ports)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow DNS responses
  ingress {
    protocol   = "udp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 53
    to_port    = 53
  }

  # Allow NTP responses
  ingress {
    protocol   = "udp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 123
    to_port    = 123
  }

  # Allow HTTP for package updates (via NAT)
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow HTTPS for package updates (via NAT)
  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow DNS queries
  egress {
    protocol   = "udp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 53
    to_port    = 53
  }

  # Allow NTP queries
  egress {
    protocol   = "udp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 123
    to_port    = 123
  }

  # Allow communication back to staging instance
  egress {
    protocol   = "-1"
    rule_no    = 140
    action     = "allow"
    cidr_block = var.public_subnet_cidr
    from_port  = 0
    to_port    = 0
  }

  # Allow ephemeral ports for return traffic
  egress {
    protocol   = "tcp"
    rule_no    = 150
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name        = "${var.environment}-private-nacl-${var.deployment_id}"
    Environment = var.environment
    Purpose     = "Database protection - subnet-level firewall"
    Security    = "defense-in-depth"
  }
}

