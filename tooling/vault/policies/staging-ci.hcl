# CI can mint SecretIDs for staging-app
path "auth/approle/role/staging-app/secret-id" { 
    capabilities = ["update"] 
}
