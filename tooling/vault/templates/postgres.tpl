{{ with secret "secret/data/staging/DEPLOYMENT_ID/postgres" }}
{{ range $k, $v := .Data.data }}
{{ $k }}={{ $v }}
{{ end }}
{{ end }}