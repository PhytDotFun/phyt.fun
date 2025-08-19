terraform {
    backend "s3" {
        bucket = "phyt-terraform-staging-state"
        key = "terraform.tfstate"
        region = "us-east-1"
        dynamodb_table = "phyt-terraform-staging-lock"
        encrypt = true
    }
}
