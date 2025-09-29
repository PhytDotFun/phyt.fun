terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
  }
}

locals {
  tags = merge({
    Environment  = var.environment
    DeploymentId = var.deployment_id
    ManagedBy    = "terraform"
  }, var.tags)

  # Human-friendly base name per env
  base_name = "${var.environment}-${var.name_prefix}"
}

# Role trusted by EC2
resource "aws_iam_role" "instance" {
  name = "${local.base_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "ec2.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

# Minimal inline policy: allow publishing custom CloudWatch metrics
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name = "${local.base_name}-cw-metrics"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["cloudwatch:PutMetricData"],
      Resource = "*"
      # Optional namespace guard if you plan to use one namespace per env:
      # ,Condition = { StringEquals = { "cloudwatch:namespace" : var.environment } }
    }]
  })
}

# Optional: SSM core (for Session Manager) and CloudWatch Agent
resource "aws_iam_role_policy_attachment" "ssm_core" {
  count      = var.enable_ssm ? 1 : 0
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cw_agent" {
  count      = var.enable_ssm ? 1 : 0
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Any extra managed policies
resource "aws_iam_role_policy_attachment" "extra" {
  for_each   = toset(var.extra_managed_policy_arns)
  role       = aws_iam_role.instance.name
  policy_arn = each.value
}

# Any extra inline policies
resource "aws_iam_role_policy" "extra_inline" {
  for_each = var.extra_inline_policies
  name     = "${local.base_name}-${each.key}"
  role     = aws_iam_role.instance.id
  policy   = each.value
}

# Instance profile
resource "aws_iam_instance_profile" "instance" {
  name = "${local.base_name}-profile"
  role = aws_iam_role.instance.name

  tags = local.tags
}
