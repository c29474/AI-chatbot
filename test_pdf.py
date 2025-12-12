import requests

# 测试PDF文件服务
url = "http://localhost:8002/api/file/66fdc0b1-b55b-4513-bbd3-e8d899419914.pdf"

try:
    response = requests.get(url, stream=True)
    print("Status Code:", response.status_code)
    print("Content-Type:", response.headers.get('Content-Type'))
    print("Content-Length:", response.headers.get('Content-Length'))
    
    # 检查响应内容的前几个字节
    content = response.raw.read(100)
    print("First 100 bytes:", content)
    
except Exception as e:
    print("Error:", str(e))