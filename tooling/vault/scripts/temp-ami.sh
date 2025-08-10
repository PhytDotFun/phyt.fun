#!/bin/bash

# TEMPORARY - sourcing to the vault folder

set -e 

INSTANCE_ID="i-09b04969ed0079fb8"
AWS_PROFILE="vault-infra-client"
REGION="us-east-1"
VAULT_HOST="https://vault.tailea8363.ts.net"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Vault AMI Backup Script ===${NC}"
echo "Using AWS Profile: $AWS_PROFILE"
echo "Region: $REGION"
echo ""

# Verify AWS CLI and profile
echo -e "${YELLOW}Checking AWS configuration...${NC}"
if ! aws sts get-caller-identity --profile $AWS_PROFILE > /dev/null 2>&1; then
    echo -e "${RED}Error: AWS profile '$AWS_PROFILE' not configured properly${NC}"
    echo "Available profiles:"
    aws configure list-profiles
    echo ""
    echo "Configure the vault-infra profile:"
    echo "  aws configure --profile vault-infra"
    exit 1
fi

AWS_USER=$(aws sts get-caller-identity --profile $AWS_PROFILE --query 'Arn' --output text)
echo -e "${GREEN}✓ AWS CLI configured${NC}"
echo "Identity: $AWS_USER"
echo ""

# Auto-detect instance if not set
if [ -z "$INSTANCE_ID" ]; then
    echo -e "${YELLOW}Finding vault instance...${NC}"
    
    # Try to find by common vault-related tags or names
    INSTANCE_ID=$(aws ec2 describe-instances \
        --profile $AWS_PROFILE \
        --region $REGION \
        --filters "Name=instance-state-name,Values=running" \
        --query 'Reservations[*].Instances[?contains(to_string(Tags[?Key==`Name`].Value), `vault`) || contains(to_string(Tags), `vault`)].InstanceId' \
        --output text | head -1)
    
    # If still not found, show all running instances for manual selection
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${YELLOW}Could not auto-detect vault instance. Here are your running instances:${NC}"
        aws ec2 describe-instances \
            --profile $AWS_PROFILE \
            --region $REGION \
            --filters "Name=instance-state-name,Values=running" \
            --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],InstanceType,PrivateIpAddress]' \
            --output table
        echo ""
        read -p "Enter the Instance ID for your vault server: " INSTANCE_ID
        
        if [ -z "$INSTANCE_ID" ]; then
            echo -e "${RED}No instance ID provided. Exiting.${NC}"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}Target Instance: $INSTANCE_ID${NC}"

# Verify the instance exists and get details
echo -e "${YELLOW}Verifying instance...${NC}"
INSTANCE_INFO=$(aws ec2 describe-instances \
    --profile $AWS_PROFILE \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].[State.Name,Tags[?Key==`Name`].Value|[0],InstanceType,PrivateIpAddress]' \
    --output text 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$INSTANCE_INFO" ]; then
    echo -e "${RED}Error: Instance $INSTANCE_ID not found or not accessible${NC}"
    exit 1
fi

IFS=$'\t' read -r INSTANCE_STATE INSTANCE_NAME INSTANCE_TYPE PRIVATE_IP <<< "$INSTANCE_INFO"

echo -e "${GREEN}✓ Instance verified${NC}"
echo "  Name: ${INSTANCE_NAME:-"(no name tag)"}"
echo "  Type: $INSTANCE_TYPE"
echo "  State: $INSTANCE_STATE"
echo "  Private IP: $PRIVATE_IP"
echo ""

echo -e "${YELLOW}Checking Vault service status...${NC}"
if command -v curl > /dev/null 2>&1; then
    if curl -s -m 5 "$VAULT_HOST/v1/sys/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Vault is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Cannot reach Vault (this is okay for backup, continuing...)${NC}"
    fi
else
    echo -e "${YELLOW}curl not available, skipping Vault health check${NC}"
fi
echo ""

# Create AMI name with timestamp
AMI_NAME="vault-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}=== Creating AMI Backup ===${NC}"
echo "AMI Name: $AMI_NAME"
echo "Instance: $INSTANCE_ID"
echo "Method: No-reboot (safer for production)"
echo ""

# Confirm before proceeding
read -p "Proceed with AMI creation? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Backup cancelled."
    exit 0
fi

# Create the AMI
echo -e "${YELLOW}Creating AMI (this may take 5-15 minutes)...${NC}"
AMI_ID=$(aws ec2 create-image \
    --profile $AWS_PROFILE \
    --region $REGION \
    --instance-id $INSTANCE_ID \
    --name "$AMI_NAME" \
    --description "Vault server backup created on $(date) before maintenance" \
    --no-reboot \
    --query 'ImageId' \
    --output text)

if [ $? -ne 0 ] || [ -z "$AMI_ID" ]; then
    echo -e "${RED}✗ Failed to create AMI${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AMI creation initiated${NC}"
echo "AMI ID: $AMI_ID"

# Tag the AMI
echo -e "${YELLOW}Tagging AMI...${NC}"
aws ec2 create-tags \
    --profile $AWS_PROFILE \
    --region $REGION \
    --resources $AMI_ID \
    --tags Key=Name,Value="$AMI_NAME" \
           Key=Purpose,Value="Vault-Backup" \
           Key=Source-Instance,Value="$INSTANCE_ID" \
           Key=Created-By,Value="$(whoami)" \
           Key=Created-Date,Value="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           Key=Pre-Maintenance,Value="true"

# Wait for completion with progress updates
echo ""
echo -e "${YELLOW}Waiting for AMI to become available...${NC}"
echo "Progress: "

START_TIME=$(date +%s)
DOTS=""

while true; do
    AMI_STATE=$(aws ec2 describe-images \
        --profile $AWS_PROFILE \
        --region $REGION \
        --image-ids $AMI_ID \
        --query 'Images[0].State' \
        --output text 2>/dev/null)
    
    case $AMI_STATE in
        "available")
            echo ""
            echo -e "${GREEN}✓ AMI creation completed successfully!${NC}"
            break
            ;;
        "pending")
            DOTS="${DOTS}."
            echo -ne "\rProgress: ${DOTS} ($(( $(date +%s) - START_TIME )) seconds)"
            sleep 10
            ;;
        "failed")
            echo ""
            echo -e "${RED}✗ AMI creation failed${NC}"
            aws ec2 describe-images \
                --profile $AWS_PROFILE \
                --region $REGION \
                --image-ids $AMI_ID \
                --query 'Images[0].StateReason' \
                --output text
            exit 1
            ;;
        *)
            echo -ne "\rAMI State: $AMI_STATE ($(( $(date +%s) - START_TIME )) seconds)"
            sleep 10
            ;;
    esac
done

# Get final AMI details
AMI_SIZE=$(aws ec2 describe-images \
    --profile $AWS_PROFILE \
    --region $REGION \
    --image-ids $AMI_ID \
    --query 'Images[0].BlockDeviceMappings[0].Ebs.VolumeSize' \
    --output text)

TOTAL_TIME=$(( $(date +%s) - START_TIME ))

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "✓ AMI ID: $AMI_ID"
echo "✓ AMI Name: $AMI_NAME"
echo "✓ Region: $REGION"
echo "✓ Size: ${AMI_SIZE}GB"
echo "✓ Total time: ${TOTAL_TIME} seconds"
echo ""
echo -e "${YELLOW}=== Rollback Instructions (if needed) ===${NC}"
echo "1. Go to AWS Console → EC2 → AMIs"
echo "2. Find AMI: $AMI_ID"
echo "3. Right-click → Launch Instance from AMI"
echo "4. Use same security groups and networking as current instance"
echo "5. Update DNS/load balancer to point to new instance"
echo ""
echo -e "${GREEN}Backup script completed successfully!${NC}"