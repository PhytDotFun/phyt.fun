# Temporary file - version control userpass before implementing IaC

## dev-tier-one - can only mint credentials for docker

vault write auth/userpass/users/dev-i \
 password='REPLACE_ME' \
 policies=dev-issuer

## dev-tier-two - can mint credentials and read secrets

vault write auth/userpass/users/dev-ir \
 password='REPLACE_ME' \
 policies=dev-issuer,dev-app

### admin access

vault write auth/userpass/users/admin \
 password='REPLACE_ME' \
 policies=admin
