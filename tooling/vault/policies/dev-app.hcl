# Dev runtime can read dev secrets for all three services
path "secret/data/dev/*" { 
    capabilities = ["read"]
}
