import requests
import json

url = "http://localhost:8002/api/generate/character"
headers = {"Content-Type": "application/json"}
data = {
    "description": "一个勇敢的骑士",
    "language": "zh"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", str(e))