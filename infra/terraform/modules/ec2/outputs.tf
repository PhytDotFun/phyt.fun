output "instance_id" {
    value = aws_spot_instance_request.staging.spot_instance_id
    description = "EC2 instance ID"
}

output "spot_request_id" {
    value = aws_spot_instance.request.staging.id
    description = "Spot instance request ID"
}

output "public_ip" {
    value = aws_eip.staging.public_ip
    description = "Public IP address"
}

output "private_ip" {
    value = aws_spot_instance_request.staging.private_ip
    description = "Private IP address"
}