import requests
import json

url = "http://localhost:8002/api/generate/character"
data = {
    "description": "Create a fantasy character named Elara",
    "language": "en"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Generated character: {result}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {str(e)}")