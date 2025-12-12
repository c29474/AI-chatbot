import requests

url = "http://localhost:8002/api/file/59411cc6-c99e-4bf5-880e-80944c7de98c.png"

try:
    response = requests.get(url)
    print("Status Code:", response.status_code)
    print("Content-Type:", response.headers.get('Content-Type'))
    print("Content-Length:", response.headers.get('Content-Length'))
    print("Response Size:", len(response.content))
except Exception as e:
    print("Error:", str(e))