terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.8.4"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment  = var.environment
      ManagedBy    = "terraform"
      DeploymentId = var.deployment_id
      Project      = "phyt"
    }
  }
}

provider "vault" {}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "random" {}
