output "role_name" {
  description = "IAM role name for the EC2 instance"
  value       = aws_iam_role.instance.name
}

output "role_arn" {
  description = "IAM role ARN for the EC2 instance"
  value       = aws_iam_role.instance.arn
}

output "instance_profile_name" {
  description = "Instance profile name to attach to EC2"
  value       = aws_iam_instance_profile.instance.name
}

output "instance_profile_arn" {
  description = "Instance profile ARN"
  value       = aws_iam_instance_profile.instance.arn
}
