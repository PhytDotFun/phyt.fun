ui = true
disable_mlock = true

seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "arn:aws:kms:us-east-1:615299727778:key/ec907686-591a-4f7d-ba8f-fec07134673b"
}

storage "raft" {
  path    = "/opt/vault/data"
  node_id = "vault-node-1"
}

listener "tcp" {
  address       = "127.0.0.1:8200"
  tls_disable   = true
}

api_addr     = "https://vault.tailea8363.ts.net"
cluster_addr = "http://127.0.0.1:8201"