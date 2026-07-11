from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
url_to_use = "postgres://postgres.zqvzzgrqfeixcuveghme:VuHx491yu8Tcee8c@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
url_to_use = url_to_use.replace("postgres://", "postgresql://")
parsed = urlparse(url_to_use)
qs = parse_qsl(parsed.query)
filtered_qs = [(k, v) for k, v in qs if k not in ("supa", "pooler")]
new_query = urlencode(filtered_qs)
new_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
print(new_url)

from sqlalchemy import create_engine
engine = create_engine(new_url)
print("Engine created ok")
