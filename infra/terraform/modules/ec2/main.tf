resource "aws_spot_instance_request" "staging" {
    ami = var.ami_id
    instance_type = var.instance_type
    spot_price = var.spot_price
    wait_for_fulfillment = true
    spot_type = "one-time"
    instance_interruption_behavior = "terminate"
    subnet_id = var.subnet_id
    vpc_security_group_ids = [var.security_group_id]
    iam_instance_profile = var.iam_instance_profile

    user_data = templatefile("${path.module}/user-data.sh", {
    deployment_id           = var.deployment_id
    vault_role_id           = var.vault_role_id
    vault_secret_id         = var.vault_secret_id
    cloudflare_tunnel_token = var.cloudflare_tunnel_token
    cloudflare_account_id   = var.cloudflare_account_id
    cloudflare_tunnel_id    = var.cloudflare_tunnel_id
    tailscale_auth_key      = var.tailscale_auth_key
  })

  root_block_device {
    volume_type = "gp3"
    volume_size = var.volume_size
    encrypted   = true
    iops        = 3000
    throughput  = 125

    tags = {
      Name = "staging-volume-${var.deployment_id}"
    }
  }

  tags = {
    Name         = "staging-spot-${var.deployment_id}"
    Type         = "ephemeral-staging"
    SpotInstance = "true"
  }
}

resource "aws_ec2_tag" "staging_instance" {
  for_each = {
    Name         = "staging-${var.deployment_id}"
    Environment  = "staging"
    DeploymentId = var.deployment_id
    SpotInstance = "true"
  }

  resource_id = aws_spot_instance_request.staging.spot_instance_id
  key         = each.key
  value       = each.value
}

resource "aws_eip" "staging" {
    domain = "vpc"

    tags = {
        Name = "staging-eip-${var.deployment_id}"
    }
}

resource "aws_eip_association" "staging" {
    instance_id = aws_spot_instance_request.staging.spot_instance_id
    allocation_id = aws_eip.staging.id
}

# CloudWatch alarm for spot instance termination
resource "aws_cloudwatch_metric_alarm" "spot_termination" {
  alarm_name          = "staging-spot-termination-${var.deployment_id}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "SpotInstanceTerminationNotice"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "Spot instance termination warning"

  dimensions = {
    InstanceId = aws_spot_instance_request.staging.spot_instance_id
  }
}
