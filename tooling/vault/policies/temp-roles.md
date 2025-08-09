# Temporary file - version control app roles before implementing IaC

vault write auth/approle/role/dev-app \
 policies=dev-app \
 secret_id_ttl=1h \
 secret_id_num_uses=1 \
 token_ttl=1h \
 token_max_ttl=4h

vault write auth/approle/role/ci-app \
 policies=ci-app \
 secret_id_ttl=30m \
 secret_id_num_uses=1 \
 token_ttl=30m \
 token_max_ttl=2h
