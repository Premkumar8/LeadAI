import urllib.request
import urllib.error

url = "http://localhost:8000/api/v1/analytics/dashboard"
try:
    req = urllib.request.Request(url, headers={"Authorization": "Bearer TEST"})
    response = urllib.request.urlopen(req)
    print("Status code:", response.getcode())
    print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Status code:", e.code)
    print("Body:", e.read().decode())
except Exception as e:
    print("Error:", str(e))
