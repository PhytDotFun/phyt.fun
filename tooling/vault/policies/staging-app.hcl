# Read access to all staging secrets, including per-PR subtrees
path "secret/data/staging/*" {
    capabilities = ["read"]
}

path "secret/data/staging/*/*" {
    capabilities = ["read"]
}
