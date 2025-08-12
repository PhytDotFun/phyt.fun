# CI can mint secret-ids for ci-app role
path "auth/approle/role/ci-app/role-id" {
     capabilities = ["read"]
}

path "auth/approle/role/ci-app/secret-id" {
     capabilities = ["update"] 
}
