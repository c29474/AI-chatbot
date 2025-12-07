# test_image_api.py - 独立测试星火图像生成API
import os
import uuid
import json
import requests
import hashlib
import hmac
import base64
from datetime import datetime
from time import mktime
from wsgiref.handlers import format_date_time
from urllib.parse import urlparse, urlencode
from typing import Optional

# 星火图像生成API配置 - 根据用户提供的正确配置
TTI_API_URL = "https://maas-api.cn-huabei-1.xf-yun.com/v2.1/tti"
TTI_APP_ID = "40061a4f"
TTI_API_SECRET = "NDBhMGRlYjFmODg1MDE1NzAxYWQwMmFk"
TTI_API_KEY = "21aca9874cfd4465704c1a1498e2f931"
# 图像服务的modelId - 根据用户提供的配置
IMAGE_MODEL_ID = "xopzimageturbo"
TEMP_FILE_DIR = "./temp_files"
os.makedirs(TEMP_FILE_DIR, exist_ok=True)

def generate_tti_auth_header() -> dict:
    """生成星火图像API的HTTP请求鉴权头 - 根据官方文档修正"""
    api_key = TTI_API_KEY
    api_secret = TTI_API_SECRET
    url_parts = urlparse(TTI_API_URL)
    host = url_parts.hostname
    path = url_parts.path
    
    # 生成RFC1123格式时间戳（UTC+0时区）
    cur_time = datetime.now()
    date_str = format_date_time(mktime(cur_time.timetuple()))
    
    # 调试：打印时间戳和签名信息
    print(f"[图像API测试鉴权] 时间戳: {date_str}")
    print(f"[图像API测试鉴权] 主机: {host}")
    print(f"[图像API测试鉴权] 路径: {path}")
    
    # 根据官方文档构造签名字符串
    # 格式：host: {host}\ndate: {date}\nPOST {path} HTTP/1.1
    signature_origin = f"host: {host}\ndate: {date_str}\nPOST {path} HTTP/1.1"
    print(f"[图像API测试鉴权] 签名字符串: {signature_origin}")
    
    # HMAC-SHA256加密
    signature_sha = hmac.new(
        api_secret.encode('utf-8'),
        signature_origin.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    signature_base64 = base64.b64encode(signature_sha).decode('utf-8')
    
    # 构造Authorization头 - 严格按照官方格式
    authorization_origin = f'api_key="{api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_base64}"'
    
    print(f"[图像API测试鉴权] 授权参数: {authorization_origin}")
    print(f"[图像API测试鉴权] 签名base64: {signature_base64}")
    
    # 返回正确的请求头 - 使用小写date头
    return {
        "Authorization": authorization_origin,  # 直接使用原始字符串，不进行base64编码
        "date": date_str,  # 使用小写date头
        "Content-Type": "application/json"
    }

def test_tti_api(prompt: str) -> Optional[str]:
    """测试星火图像生成API"""
    try:
        headers = generate_tti_auth_header()
        
        print(f"[图像API测试] 鉴权头生成成功")
        print(f"[图像API测试] 发送请求，提示词: {prompt}")
        
        # 根据星火图像API官方文档构造正确的请求体
        request_data = {
            "header": {
                "app_id": TTI_APP_ID,
                "uid": str(uuid.uuid4())[:32],
                "patch_id": ["123456"]  # 必需的字段
            },
            "parameter": {
                "chat": {
                    "domain": IMAGE_MODEL_ID,
                    "width": 768,  # 根据API文档使用768x768分辨率
                    "height": 768,
                    "seed": 42,  # 根据API文档添加参数
                    "num_inference_steps": 20,
                    "guidance_scale": 5.0,
                    "scheduler": "Euler"
                }
            },
            "payload": {
                "message": {
                    "text": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                },
                "negative_prompts": {  # 根据API文档添加负面提示词
                    "text": ""
                }
            }
        }
        
        print(f"[图像API测试] 完整请求数据:\n{json.dumps(request_data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            TTI_API_URL,
            headers=headers,
            json=request_data,
            timeout=30
        )
        
        print(f"[图像API测试] 响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"[图像API测试] 业务代码: {result.get('header', {}).get('code')}")
            print(f"[图像API测试] 响应消息: {result.get('header', {}).get('message', '无消息')}")
            
            if result.get("header", {}).get("code") != 0:
                print(f"[图像API测试] 业务错误: {result.get('header', {}).get('message', '未知错误')}")
                return None
            
            # 尝试不同的响应结构
            image_data_base64 = None
            
            # 尝试路径1: payload.choices.text[0].content
            choices = result.get("payload", {}).get("choices", {})
            if isinstance(choices, dict):
                text_items = choices.get("text", [])
                if text_items and isinstance(text_items, list) and len(text_items) > 0:
                    image_data_base64 = text_items[0].get("content")
            
            # 尝试路径2: payload.message.text[0].content
            if not image_data_base64:
                message = result.get("payload", {}).get("message", {})
                text_items = message.get("text", [])
                if text_items and isinstance(text_items, list) and len(text_items) > 0:
                    image_data_base64 = text_items[0].get("content")
            
            if image_data_base64:
                # 移除可能的数据URI前缀
                if "base64," in image_data_base64:
                    image_data_base64 = image_data_base64.split("base64,")[1]
                
                try:
                    image_data = base64.b64decode(image_data_base64)
                    filename = f"{TEMP_FILE_DIR}/test_image_{uuid.uuid4()}.png"
                    with open(filename, 'wb') as f:
                        f.write(image_data)
                    print(f"[图像API测试] 图片已保存: {filename}")
                    return filename
                except Exception as e:
                    print(f"[图像API测试] 解码保存图片失败: {e}")
                    return None
            else:
                print("[图像API测试] 响应中未找到图像数据")
                print(f"[图像API测试] 完整响应:\n{json.dumps(result, indent=2, ensure_ascii=False)}")
                return None
        else:
            print(f"[图像API测试 HTTP错误] {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"[图像API测试异常] {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("=" * 50)
    print("星火图像生成API测试")
    print("=" * 50)
    
    # 测试提示词
    test_prompt = "一个美丽的风景，有山有水，阳光明媚"
    
    print(f"开始测试图像生成API...")
    result = test_tti_api(test_prompt)
    
    if result:
        print(f"[测试成功] 图像已生成并保存到: {result}")
    else:
        print("[测试失败] 图像生成失败，请检查配置和错误信息")
    
    print("=" * 50)
