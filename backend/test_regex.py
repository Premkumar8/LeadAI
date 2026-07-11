import re
url = "postgres://postgres.zqvzzgrqfeixcuveghme:VuHx491yu8Tcee8c@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
url = url.replace("postgres://", "postgresql://")
url = re.sub(r'([?&])supa=[^&]*', r'\1', url)
url = url.rstrip('?&')
print(url)
