{{ with secret "secret/data/staging/DEPLOYMENT_ID/hono-api" }}
{{ range $k, $v := .Data.data }}
{{ $k }}={{ $v }}
{{ end }}
{{ end }}