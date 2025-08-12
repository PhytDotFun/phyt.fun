# Devs can mint secret-ids for dev-app role
path "auth/approle/role/dev-app/role-id" {    
    capabilities = ["read"] 
}
path "auth/approle/role/dev-app/secret-id" { 
    capabilities = ["update"]
}
