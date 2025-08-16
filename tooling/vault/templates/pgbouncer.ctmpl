{{ with secret "secret/data/staging/DEPLOYMENT_ID/pgbouncer" }}
{{ range $k, $v := .Data.data }}
{{ $k }}={{ $v }}
{{ end }}
{{ end }}