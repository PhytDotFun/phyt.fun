########################
# VPC Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

########################
# Subnet Outputs
########################

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "public_subnet_cidr" {
  description = "CIDR block of the public subnet"
  value       = aws_subnet.public.cidr_block
}

output "public_subnet_availability_zone" {
  description = "Availability zone of the public subnet"
  value       = aws_subnet.public.availability_zone
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

output "private_subnet_cidr" {
  description = "CIDR block of the private subnet"
  value       = aws_subnet.private.cidr_block
}

output "private_subnet_availability_zone" {
  description = "Availability zone of the private subnet"
  value       = aws_subnet.private.availability_zone
}

########################
# Route Table Outputs
########################

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

########################
# Network ACL Outputs
########################

output "private_network_acl_id" {
  description = "ID of the private subnet network ACL"
  value       = aws_network_acl.private.id
}

########################
# Security Helper Outputs
########################

# Security group rule templates for consistent configuration
output "staging_instance_security_rules" {
  description = "Security group rules for staging instance (Cloudflare Tunnel architecture)"
  value = {
    ingress_rules = [
      # NO INGRESS RULES - Traffic comes through Cloudflare Tunnel only
      # nginx binds to 127.0.0.1:8080 and is accessed via tunnel
    ]
    egress_rules = [
      {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
        description = "All outbound traffic for staging instance"
      }
    ]
  }
}

output "database_security_rules" {
  description = "Security group rules for database instance (NAT protected)"
  value = {
    ingress_rules = [
      {
        from_port   = 5432
        to_port     = 5432
        protocol    = "tcp"
        description = "PostgreSQL access from staging instance only"
        # Use: security_groups = [aws_security_group.staging.id]
      }
    ]
    egress_rules = [
      {
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTP for package updates via NAT"
      },
      {
        from_port   = 443
        to_port     = 443
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTPS for package updates via NAT"
      },
      {
        from_port   = 53
        to_port     = 53
        protocol    = "udp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "DNS resolution"
      },
      {
        from_port   = 123
        to_port     = 123
        protocol    = "udp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "NTP time synchronization"
      }
    ]
  }
}

output "nat_gateway_security_rules" {
  description = "Security group rules for NAT gateway instance"
  value = {
    ingress_rules = [
      {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = [var.private_subnet_cidr]
        description = "Allow all traffic from private subnet"
      }
    ]
    egress_rules = [
      {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
        description = "Allow all outbound traffic for NAT functionality"
      }
    ]
  }
}

########################
# Security Architecture Summary
########################

output "security_architecture_summary" {
  description = "Summary of the complete security architecture"
  value = {
    public_ingress_protection = {
      method                   = "Cloudflare Tunnel + nginx reverse proxy"
      staging_instance_ingress = "NONE - Cloudflare Tunnel only"
      nginx_binding            = "127.0.0.1:8080 (localhost only)"
      rate_limiting            = "nginx (10r/s API, 5r/m auth)"
      security_headers         = "X-Frame-Options, X-Content-Type-Options, etc."
    }
    database_protection = {
      method                 = "Private subnet + NAT gateway"
      direct_internet_access = "NONE"
      ingress_sources        = "staging instance only (port 5432)"
      egress_control         = "essential services via NAT (HTTP/HTTPS/DNS/NTP)"
      subnet_protection      = "Network ACLs + Security Groups"
    }
    defense_layers = [
      "Cloudflare Edge Protection",
      "Cloudflare Tunnel (no exposed ports)",
      "nginx reverse proxy (rate limiting)",
      "Security Groups (instance-level firewall)",
      "Network ACLs (subnet-level firewall)",
      "Private subnet isolation",
      "NAT gateway controlled egress"
    ]
  }
}
