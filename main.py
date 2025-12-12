# main.py - 后端核心服务 (完整修正版)
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
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Union
import websocket
import threading
import asyncio
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Image
from reportlab.lib.units import inch

# ==================== 配置区域 ====================
# 1. 星火文本API配置 (WebSocket) - 根据用户提供的背单词服务配置
SPARK_TEXT_APP_ID = "40061a4f"
SPARK_TEXT_API_SECRET = "NDBhMGRlYjFmODg1MDE1NzAxYWQwMmFk"
SPARK_TEXT_API_KEY = "21aca9874cfd4465704c1a1498e2f931"
SPARK_TEXT_WS_URL = "wss://maas-api.cn-huabei-1.xf-yun.com/v1.1/chat"
# 文本服务的modelId - 根据用户提供的背单词服务配置
TEXT_MODEL_ID = "xop3qwen1b7"

# 2. 星火图像生成API配置 (HTTP) - 根据用户提供的实际配置
TTI_API_URL = "https://maas-api.cn-huabei-1.xf-yun.com/v2.1/tti"
TTI_APP_ID = "40061a4f"
TTI_API_SECRET = "NDBhMGRlYjFmODg1MDE1NzAxYWQwMmFk"
TTI_API_KEY = "21aca9874cfd4465704c1a1498e2f931"
# 图像服务的modelId - 根据用户提供的配置
IMAGE_MODEL_ID = "xopzimageturbo"

# 3. 其他
TEMP_FILE_DIR = "./temp_files"
os.makedirs(TEMP_FILE_DIR, exist_ok=True)
# ==================== 配置结束 ====================

app = FastAPI(title="创意写作助手API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================
class ChatRequest(BaseModel):
    message: str
    language: str = "zh"
    session_id: Optional[str] = None

class CharacterGenRequest(BaseModel):
    gender: str
    age: str
    height: str
    weight: str
    hair_color: str
    eye_color: str
    profession: str
    personality: str
    nationality: str
    fantasy_race: Optional[str] = None
    language: str = "zh"

class BookTitleGenRequest(BaseModel):
    description: Optional[str] = None
    title: Optional[str] = None
    genre: Optional[str] = None
    language: str = "zh"

class SimpleCharacterRequest(BaseModel):
    description: str
    language: str = "zh"

# ==================== 核心工具函数 ====================
def detect_mixed_language(text: str) -> dict:
    """检测文本中的混合语言情况"""
    import re
    
    # 检测俄语字符
    russian_chars = re.findall(r'[а-яА-ЯёЁ]', text)
    # 检测中文字符
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    # 检测英语字符
    english_chars = re.findall(r'[a-zA-Z]', text)
    
    return {
        'has_russian': len(russian_chars) > 0,
        'has_chinese': len(chinese_chars) > 0,
        'has_english': len(english_chars) > 0,
        'russian_count': len(russian_chars),
        'chinese_count': len(chinese_chars),
        'english_count': len(english_chars)
    }

def translate_mixed_language_prompt(user_request: str, target_language: str) -> str:
    """翻译混合语言提示词为目标语言"""
    import re
    
    # 如果目标语言是俄语，且检测到中文词汇，需要翻译
    if target_language == "ru":
        # 常见的中文-俄语词汇映射
        chinese_russian_map = {
            '印度': 'Индия',
            '德国': 'Германия',
            '矮人': 'гном',
            '医生': 'врач',
            '水手': 'моряк',
            '男': 'мужчина',
            '女': 'женщина',
            '岁': 'лет',
            '红色': 'красный',
            '绿色': 'зеленый',
            '蓝色': 'синий',
            '黑色': 'черный',
            '白色': 'белый',
            '黄色': 'желтый',
            '棕色': 'коричневый',
            '金色': 'золотой',
            '银色': 'серебряный',
            '热情': 'страстный',
            '优雅': 'элегантный',
            '温和': 'мягкий',
            '勇敢': 'храбрый',
            '聪明': 'умный',
            '善良': 'добрый',
            '幽默': 'юмористический',
            '严肃': 'серьезный',
            '温柔': 'нежный',
            '强壮': 'сильный',
            '敏捷': 'проворный',
            '神秘': 'таинственный',
            '人类': 'человек',
            '精灵': 'эльф',
            '兽人': 'орк',
            '矮人': 'гном',
            '半人马': 'кентавр',
            '龙族': 'дракон',
            '天使': 'ангел',
            '恶魔': 'демон',
            '法国': 'Франция',
            '英国': 'Великобритания',
            '美国': 'США',
            '中国': 'Китай',
            '日本': 'Япония',
            '俄罗斯': 'Россия',
            '战士': 'воин',
            '法师': 'маг',
            '弓箭手': 'лучник',
            '牧师': 'жрец',
            '盗贼': 'вор',
            '骑士': 'рыцарь',
            '商人': 'торговец',
            '农民': 'крестьянин',
            '学者': 'ученый',
            '艺术家': 'художник'
        }
        
        # 替换中文词汇为俄语
        translated_request = user_request
        for chinese, russian in chinese_russian_map.items():
            translated_request = translated_request.replace(chinese, russian)
        
        return translated_request
    
    return user_request

def build_spark_text_prompt(user_request: str, system_role: str, language: str) -> list:
    # 检测混合语言情况
    lang_detection = detect_mixed_language(user_request)
    print(f"[语言检测] 俄语字符: {lang_detection['russian_count']}, 中文字符: {lang_detection['chinese_count']}, 英语字符: {lang_detection['english_count']}")
    
    # 如果是混合语言输入，进行翻译处理
    if lang_detection['has_russian'] and lang_detection['has_chinese']:
        print(f"[语言处理] 检测到俄语+中文混合输入，进行翻译处理")
        user_request = translate_mixed_language_prompt(user_request, language)
        print(f"[语言处理] 翻译后提示词: {user_request}")
    
    lang_instruction = "请用俄语回答。" if language == "ru" else "请用中文回答。"
    full_prompt = f"{system_role} {lang_instruction} 用户要求：{user_request}"
    return [{"role": "user", "content": full_prompt}]

def generate_spark_ws_url() -> str:
    api_key = SPARK_TEXT_API_KEY
    api_secret = SPARK_TEXT_API_SECRET
    host = urlparse(SPARK_TEXT_WS_URL).hostname
    path = urlparse(SPARK_TEXT_WS_URL).path
    
    now = datetime.now()
    date = format_date_time(mktime(now.timetuple()))
    signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
    
    signature_sha = hmac.new(
        api_secret.encode('utf-8'),
        signature_origin.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    signature_sha_base64 = base64.b64encode(signature_sha).decode('utf-8')
    
    authorization_origin = f'api_key="{api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
    authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
    
    v = {"authorization": authorization, "date": date, "host": host}
    return f"wss://{host}{path}?{urlencode(v)}"

def get_spark_text_response(messages: list) -> str:
    full_response = ""
    response_received = threading.Event()
    
    def on_message(ws, message):
        nonlocal full_response
        try:
            data = json.loads(message)
            code = data.get("header", {}).get("code")
            if code != 0:
                print(f"[文本API业务错误] 代码: {code}, 消息: {data.get('header', {}).get('message', '未知')}")
                response_received.set()
                return
            for choice in data.get("payload", {}).get("choices", {}).get("text", []):
                full_response += choice.get("content", "")
            if data.get("header", {}).get("status") == 2:
                response_received.set()
                ws.close()
        except Exception as e:
            print(f"[消息解析错误] {e}")
    
    def on_error(ws, error):
        print(f"[WebSocket错误] {error}")
    
    def on_close(ws, close_status_code, close_msg):
        print("[WebSocket连接关闭]")
    
    def on_open(ws):
        print("[WebSocket连接已建立，发送请求...]")
        request_data = {
            "header": {"app_id": SPARK_TEXT_APP_ID},
            "parameter": {
                "chat": {
                    "domain": TEXT_MODEL_ID,
                }
            },
            "payload": {"message": {"text": messages}}
        }
        ws.send(json.dumps(request_data))
    
    try:
        auth_url = generate_spark_ws_url()
        
        ws = websocket.WebSocketApp(auth_url,
                                    on_open=on_open,
                                    on_message=on_message,
                                    on_error=on_error,
                                    on_close=on_close)
        
        wst = threading.Thread(target=ws.run_forever)
        wst.daemon = True
        wst.start()
        
        # 增加超时时间，因为生成角色描述可能需要更长时间
        if not response_received.wait(timeout=60):
            print("[超时] 未在60秒内收到完整响应")
            return "抱歉，AI响应超时，请稍后重试或尝试简化您的请求。"
        
        return full_response.strip()
        
    except Exception as e:
        print(f"[WebSocket异常] {e}")
        return ""

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
    print(f"[图像API鉴权] 时间戳: {date_str}")
    print(f"[图像API鉴权] 主机: {host}")
    print(f"[图像API鉴权] 路径: {path}")
    
    # 根据官方文档构造签名字符串
    # 格式：host: {host}\ndate: {date}\nPOST {path} HTTP/1.1
    signature_origin = f"host: {host}\ndate: {date_str}\nPOST {path} HTTP/1.1"
    print(f"[图像API鉴权] 签名字符串: {signature_origin}")
    
    # HMAC-SHA256加密
    signature_sha = hmac.new(
        api_secret.encode('utf-8'),
        signature_origin.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    signature_base64 = base64.b64encode(signature_sha).decode('utf-8')
    
    # 构造Authorization头 - 严格按照官方格式
    authorization_origin = f'api_key="{api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_base64}"'
    
    print(f"[图像API鉴权] 授权参数: {authorization_origin}")
    print(f"[图像API鉴权] 签名base64: {signature_base64}")
    
    # 返回正确的请求头 - 使用小写date头
    return {
        "Authorization": authorization_origin,  # 直接使用原始字符串，不进行base64编码
        "date": date_str,  # 使用小写date头
        "Content-Type": "application/json"
    }

def call_tti_api(prompt: str) -> Optional[str]:
    """调用星火图像生成API"""
    try:
        headers = generate_tti_auth_header()
        
        # 调试：打印鉴权头
        print(f"[图像API] 鉴权头: Authorization: {headers.get('Authorization', '')[:50]}...")
        print(f"[图像API] 鉴权头: date: {headers.get('date', '')}")
        
        # 根据星火图像API官方文档构造请求体
        request_data = {
            "header": {
                "app_id": TTI_APP_ID,
                "uid": str(uuid.uuid4())[:32],  # 可选字段，最大长度32
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
        
        print(f"[图像API] 发送请求，提示词: {prompt[:50]}...")
        
        # 调试：打印完整的请求数据
        print(f"[图像API] 完整请求数据:\n{json.dumps(request_data, indent=2, ensure_ascii=False)}")
        
        # 增加图像生成超时时间，图像生成通常需要更长时间
        response = requests.post(
            TTI_API_URL,
            headers=headers,
            json=request_data,
            timeout=120  # 增加到120秒
        )
        
        print(f"[图像API] 响应状态码: {response.status_code}")
        print(f"[图像API] 响应头:\n{json.dumps(dict(response.headers), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"[图像API] 业务代码: {result.get('header', {}).get('code')}")
            print(f"[图像API] 响应消息: {result.get('header', {}).get('message', '无消息')}")
            
            # 调试：打印完整响应
            print(f"[图像API] 完整响应:\n{json.dumps(result, indent=2, ensure_ascii=False)}")
            
            if result.get("header", {}).get("code") != 0:
                print(f"[图像API业务错误] {result.get('header', {}).get('message', '未知错误')}")
                return None
            
            # 尝试不同的响应结构
            image_data_base64 = None
            
            # 尝试路径1: payload.choices.text[0].content (文本API格式)
            choices = result.get("payload", {}).get("choices", {})
            if isinstance(choices, dict):
                text_items = choices.get("text", [])
                if text_items and isinstance(text_items, list) and len(text_items) > 0:
                    image_data_base64 = text_items[0].get("content")
            
            # 尝试路径2: payload.message.text[0].content (文本API格式)
            if not image_data_base64:
                message = result.get("payload", {}).get("message", {})
                text_items = message.get("text", [])
                if text_items and isinstance(text_items, list) and len(text_items) > 0:
                    image_data_base64 = text_items[0].get("content")
            
            # 尝试路径3: payload.tti (图像API格式)
            if not image_data_base64:
                tti_data = result.get("payload", {}).get("tti", {})
                if isinstance(tti_data, dict):
                    image_data_base64 = tti_data.get("image")
            
            # 尝试路径4: 直接查找base64数据
            if not image_data_base64:
                # 在payload中查找包含base64数据的字段
                payload = result.get("payload", {})
                for key, value in payload.items():
                    if isinstance(value, str) and "base64" in value:
                        image_data_base64 = value
                        break
            
            # 尝试路径5: 深度搜索整个响应结构
            if not image_data_base64:
                def deep_search_for_base64(obj, path=""):
                    if isinstance(obj, dict):
                        for k, v in obj.items():
                            result = deep_search_for_base64(v, f"{path}.{k}")
                            if result:
                                return result
                    elif isinstance(obj, list):
                        for i, item in enumerate(obj):
                            result = deep_search_for_base64(item, f"{path}[{i}]")
                            if result:
                                return result
                    elif isinstance(obj, str) and "base64" in obj:
                        print(f"[图像API] 在路径 {path} 找到base64数据")
                        return obj
                    return None
                
                image_data_base64 = deep_search_for_base64(result, "root")
            
            if image_data_base64:
                # 移除可能的数据URI前缀
                if "base64," in image_data_base64:
                    image_data_base64 = image_data_base64.split("base64,")[1]
                
                try:
                    image_data = base64.b64decode(image_data_base64)
                    filename = f"{TEMP_FILE_DIR}/{uuid.uuid4()}.png"
                    with open(filename, 'wb') as f:
                        f.write(image_data)
                    print(f"[图像API] 图片已保存: {filename}")
                    return filename
                except Exception as e:
                    print(f"[图像API] 解码保存图片失败: {e}")
                    return None
            else:
                print("[图像API] 响应中未找到图像数据")
                print(f"[图像API] 调试信息: 完整响应结构 - {json.dumps(result, indent=2, ensure_ascii=False)}")
                
                # 尝试打印响应中的关键字段以帮助调试
                print(f"[图像API] 调试 - header.code: {result.get('header', {}).get('code')}")
                print(f"[图像API] 调试 - header.message: {result.get('header', {}).get('message')}")
                print(f"[图像API] 调试 - payload keys: {list(result.get('payload', {}).keys())}")
                
                return None
        else:
            print(f"[图像API HTTP错误] {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"[调用图像API异常] {e}")
        import traceback
        traceback.print_exc()
        return None

def generate_character_pdf(character_data: dict, image_path: Optional[str], language: str = "zh") -> str:
    pdf_filename = f"{TEMP_FILE_DIR}/{uuid.uuid4()}.pdf"
    
    # 双语文本配置
    pdf_translations = {
        "zh": {
            "title": "角色档案",
            "description": "角色描述",
            "name_info": "角色信息",
            "appearance": "外貌描写",
            "personality": "性格特点",
            "race": "种族设定",
            "background": "背景故事",
            "introduction": "角色介绍",
            "gender": "性别",
            "age": "年龄",
            "height_weight": "身高/体重",
            "hair_eyes": "发色/瞳色",
            "profession": "职业",
            "nationality": "国籍/地区",
            "fantasy_race": "奇幻种族",
            "generated_time": "生成时间"
        },
        "ru": {
            "title": "Профиль персонажа",
            "description": "Описание персонажа",
            "name_info": "Информация о персонаже",
            "appearance": "Внешность",
            "personality": "Характер",
            "race": "Раса",
            "background": "Предыстория",
            "introduction": "Введение персонажа",
            "gender": "Пол",
            "age": "Возраст",
            "height_weight": "Рост/Вес",
            "hair_eyes": "Цвет волос/Цвет глаз",
            "profession": "Профессия",
            "nationality": "Национальность/Регион",
            "fantasy_race": "Фэнтези раса",
            "generated_time": "Время создания"
        }
    }
    
    t = pdf_translations.get(language, pdf_translations["zh"])
    
    # 改进的字体注册和选择逻辑
    def setup_pdf_fonts(language):
        """设置支持多语言的PDF字体"""
        available_fonts = []
        selected_font = 'Helvetica'
        
        try:
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            
            # 扩展字体路径，包含更多Unicode字体选项
            font_paths = {
                # 中文支持字体
                'SimSun': 'C:\\Windows\\Fonts\\simsun.ttc',  # 宋体
                'SimHei': 'C:\\Windows\\Fonts\\simhei.ttf',  # 黑体
                'Microsoft YaHei': 'C:\\Windows\\Fonts\\msyh.ttc',  # 微软雅黑
                'FangSong': 'C:\\Windows\\Fonts\\simfang.ttf',  # 仿宋
                'KaiTi': 'C:\\Windows\\Fonts\\simkai.ttf',  # 楷体
                
                # 俄语支持字体
                'Times New Roman': 'C:\\Windows\\Fonts\\times.ttf',
                'Arial': 'C:\\Windows\\Fonts\\arial.ttf',
                'Arial Unicode MS': 'C:\\Windows\\Fonts\\arialuni.ttf',
                'Calibri': 'C:\\Windows\\Fonts\\calibri.ttf',
                'Cambria': 'C:\\Windows\\Fonts\\cambria.ttc',
                'Tahoma': 'C:\\Windows\\Fonts\\tahoma.ttf',
                
                # 通用Unicode字体
                'DejaVu Sans': 'C:\\Windows\\Fonts\\DejaVuSans.ttf',
            }
            
            # 尝试注册所有可用字体
            for font_name, font_path in font_paths.items():
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont(font_name, font_path))
                        available_fonts.append(font_name)
                        print(f"[PDF生成] 成功注册字体: {font_name}")
                    except Exception as e:
                        print(f"[PDF生成] 注册字体 {font_name} 失败: {e}")
                        continue
            
            # 简化字体选择：强制使用支持中文的字体
            # 无论输入什么语言，都优先选择支持中文的字体，避免中文乱码
            chinese_fonts = [
                'Microsoft YaHei',   # 微软雅黑，支持中文和西文
                'SimHei',            # 黑体，支持中文
                'SimSun',            # 宋体，支持中文
                'Arial Unicode MS',  # 支持最广泛的Unicode字体
                'DejaVu Sans'        # 开源Unicode字体
            ]
            
            # 优先选择支持中文的字体
            for font in chinese_fonts:
                if font in available_fonts:
                    selected_font = font
                    break
            
            # 如果找不到中文字体，使用默认字体
            if selected_font == 'Helvetica':
                # 尝试使用其他可用字体
                for font in available_fonts:
                    if font != 'Helvetica':
                        selected_font = font
                        break
            
            print(f"[PDF生成] 最终选择字体: {selected_font} (语言: {language})")
            
        except ImportError:
            print("[PDF生成] 无法导入字体模块，使用默认字体")
        except Exception as e:
            print(f"[PDF生成] 字体设置错误: {e}")
        
        return selected_font, available_fonts
    
    # 设置字体
    selected_font, available_fonts = setup_pdf_fonts(language)
    
    # 创建支持多语言的样式 - 改进编码设置
    styles = getSampleStyleSheet()
    
    # 确保文本编码正确
    def safe_text(text):
        """确保文本编码正确，处理可能的编码问题"""
        if text is None:
            return ""
        try:
            # 如果是字节字符串，解码为Unicode
            if isinstance(text, bytes):
                return text.decode('utf-8', errors='ignore')
            # 确保是字符串类型
            return str(text)
        except Exception as e:
            print(f"[PDF生成] 文本编码处理错误: {e}")
            return str(text) if text else ""
    
    # 创建样式
    title_style = ParagraphStyle(
        'CustomTitle',
        fontName=selected_font,
        fontSize=16,
        spaceAfter=30,
        encoding='utf-8'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        fontName=selected_font,
        fontSize=10,
        leading=14,
        encoding='utf-8'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        fontName=selected_font,
        fontSize=12,
        spaceAfter=12,
        encoding='utf-8'
    )

    # 使用safe_text处理所有文本内容
    def safe_paragraph(text, style):
        """安全创建段落，处理编码问题"""
        try:
            return Paragraph(safe_text(text), style)
        except Exception as e:
            print(f"[PDF生成] 创建段落失败: {e}")
            # 如果失败，尝试使用纯文本
            return Paragraph(safe_text(str(text)), style)
    
    # 创建文档模板和故事流
    doc = SimpleDocTemplate(pdf_filename, pagesize=A4)
    story = []
    
    # 根据语言生成标题
    title_text = f"{safe_text(t['title'])}: {safe_text(character_data.get('name', '未知角色'))}"
    story.append(safe_paragraph(title_text, title_style))
    story.append(Spacer(1, 12))
    
    if image_path and os.path.exists(image_path):
        try:
            # 读取图片原始尺寸并保持比例
            from PIL import Image as PILImage
            
            # 使用PIL获取图片原始尺寸
            pil_img = PILImage.open(image_path)
            original_width, original_height = pil_img.size
            pil_img.close()
            
            # 计算合适的显示尺寸，保持原始比例
            max_width = 4 * inch  # 最大宽度
            max_height = 5 * inch  # 最大高度
            
            # 计算缩放比例
            width_ratio = max_width / original_width
            height_ratio = max_height / original_height
            scale_ratio = min(width_ratio, height_ratio)
            
            # 计算缩放后的尺寸
            display_width = original_width * scale_ratio
            display_height = original_height * scale_ratio
            
            print(f"[PDF生成] 图片原始尺寸: {original_width}x{original_height}")
            print(f"[PDF生成] 图片显示尺寸: {display_width:.1f}x{display_height:.1f}")
            
            # 创建图片对象，保持原始比例
            img = Image(image_path, width=display_width, height=display_height)
            story.append(img)
            story.append(Spacer(1, 20))
        except ImportError:
            # 如果没有PIL库，使用默认尺寸但保持3:4比例
            try:
                img = Image(image_path, width=3*inch, height=4*inch)
                story.append(img)
                story.append(Spacer(1, 20))
                print("[PDF生成] 使用默认尺寸，建议安装PIL库以获得更好的图片比例控制")
            except Exception as e:
                print(f"[PDF生成] 无法加载图片: {e}")
        except Exception as e:
            print(f"[PDF生成] 处理图片时出错: {e}")

    # 生成多语言详情 - 使用safe_text处理所有文本
    details = [
        f"{safe_text(t['gender'])}: {safe_text(character_data.get('gender', ''))}",
        f"{safe_text(t['age'])}: {safe_text(character_data.get('age', ''))}",
        f"{safe_text(t['height_weight'])}: {safe_text(character_data.get('height', ''))} / {safe_text(character_data.get('weight', ''))}",
        f"{safe_text(t['hair_eyes'])}: {safe_text(character_data.get('hair_color', ''))} / {safe_text(character_data.get('eye_color', ''))}",
        f"{safe_text(t['profession'])}: {safe_text(character_data.get('profession', ''))}",
        f"{safe_text(t['personality'])}: {safe_text(character_data.get('personality', ''))}",
        f"{safe_text(t['nationality'])}: {safe_text(character_data.get('nationality', ''))}",
        f"{safe_text(t['fantasy_race'])}: {safe_text(character_data.get('fantasy_race', '')) if character_data.get('fantasy_race') else ''}",
        f"{safe_text(t['generated_time'])}: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    ]
    
    for detail in details:
        story.append(safe_paragraph(detail, body_style))
        story.append(Spacer(1, 6))

    if character_data.get('description'):
        story.append(Spacer(1, 12))
        story.append(safe_paragraph(f"{safe_text(t['description'])}:", heading_style))
        story.append(Spacer(1, 6))
        
        # 改进的描述样式 - 更好的可读性
        desc_style = ParagraphStyle(
            'DescriptionStyle',
            fontName=selected_font,
            fontSize=10,  # 稍微增大字体
            leading=14,   # 增加行间距
            encoding='utf-8',
            spaceBefore=6,
            spaceAfter=6,
            firstLineIndent=20,  # 首行缩进
            alignment=4,  # 两端对齐
            wordWrap=True  # 自动换行
        )
        
        # 对描述文本进行格式化处理
        description = safe_text(character_data['description'])
        
        # 清理Markdown格式标记
        import re
        description = re.sub(r'\*\*(.*?)\*\*', r'\1', description)  # 移除 **粗体**
        description = re.sub(r'###\s*(.*?)\s*', r'\1', description)  # 移除 ### 标题
        description = re.sub(r'---+\s*', '', description)  # 移除 --- 分隔线
        description = re.sub(r'\*{3,}', '', description)  # 移除 *** 分隔线
        
        # 简化描述处理逻辑，避免复杂的分类导致内容重复
        # 直接使用智能分段，确保内容不重复且连贯
        
        # 根据语言选择合适的句子分割符
        if language == "ru":
            # 俄语标点符号：句号、感叹号、问号、分号等
            sentence_delimiters = r'[.!?;…]'
            sentence_connector = '. '
        else:
            # 中文标点符号
            sentence_delimiters = r'[。！？.!?]'
            sentence_connector = '。'
        
        # 将描述文本按句子分割
        sentences = re.split(sentence_delimiters, description)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # 将句子分组为段落，保持内容的连贯性
        paragraphs = []
        current_para = []
        
        for sentence in sentences:
            current_para.append(sentence)
            # 当段落达到一定长度或句子数量时，开始新段落
            # 对于俄语，可能需要更长的段落长度
            if len(current_para) >= 3 or len(''.join(current_para)) > (200 if language == "ru" else 150):
                paragraphs.append(sentence_connector.join(current_para) + sentence_connector.strip())
                current_para = []
        
        if current_para:
            paragraphs.append(sentence_connector.join(current_para) + sentence_connector.strip())
        
        # 添加描述标题
        story.append(safe_paragraph(f"▪️ {safe_text(t['description'])}", heading_style))
        story.append(Spacer(1, 4))
        
        # 添加格式化后的段落
        for para in paragraphs:
            story.append(safe_paragraph(para, desc_style))
            story.append(Spacer(1, 8))


    # 构建PDF文档
    try:
        doc.build(story)
        print(f"[PDF生成] PDF文件已生成: {pdf_filename}")
        return pdf_filename
    except Exception as e:
        print(f"[PDF生成] 构建PDF失败: {e}")
        # 如果失败，尝试使用改进的备用方案
        try:
            print("[PDF生成] 尝试使用改进的备用方案...")
            return create_fallback_pdf(pdf_filename, character_data, t, selected_font)
        except Exception as fallback_error:
            print(f"[PDF生成] 备用方案也失败: {fallback_error}")
            # 创建最简单的文本文件作为最后的手段
            try:
                txt_filename = pdf_filename.replace('.pdf', '.txt')
                with open(txt_filename, 'w', encoding='utf-8') as f:
                    f.write(f"{t['title']}: {character_data.get('name', '未知角色')}\n")
                    f.write(f"{t['gender']}: {character_data.get('gender', '')}\n")
                    f.write(f"{t['age']}: {character_data.get('age', '')}\n")
                    f.write(f"{t['description']}:\n{character_data.get('description', '')}\n")
                print(f"[PDF生成] 创建文本文件: {txt_filename}")
                return txt_filename
            except Exception as txt_error:
                print(f"[PDF生成] 创建文本文件也失败: {txt_error}")
                raise fallback_error

def create_fallback_pdf(filename, character_data, translations, font_name):
    """创建备用PDF方案，使用更简单的canvas方法"""
    from reportlab.pdfgen import canvas
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    c = canvas.Canvas(filename, pagesize=A4)
    
    # 尝试设置字体
    try:
        # 注册字体
        font_paths = {
            'Helvetica': None,  # 使用默认字体
            'Times New Roman': 'C:\\Windows\\Fonts\\times.ttf',
            'Arial': 'C:\\Windows\\Fonts\\arial.ttf',
        }
        
        if font_name in font_paths and font_paths[font_name] and os.path.exists(font_paths[font_name]):
            pdfmetrics.registerFont(TTFont(font_name, font_paths[font_name]))
            c.setFont(font_name, 12)
        else:
            c.setFont("Helvetica", 12)
    except:
        c.setFont("Helvetica", 12)
    
    # 设置起始位置
    y_position = 750
    
    # 添加标题
    c.drawString(50, y_position, f"{translations['title']}: {character_data.get('name', '未知角色')}")
    y_position -= 20
    
    # 添加基本信息
    details = [
        f"{translations['gender']}: {character_data.get('gender', '')}",
        f"{translations['age']}: {character_data.get('age', '')}",
        f"{translations['height_weight']}: {character_data.get('height', '')} / {character_data.get('weight', '')}",
        f"{translations['hair_eyes']}: {character_data.get('hair_color', '')} / {character_data.get('eye_color', '')}",
        f"{translations['profession']}: {character_data.get('profession', '')}",
        f"{translations['nationality']}: {character_data.get('nationality', '')}",
    ]
    
    for detail in details:
        if y_position < 50:  # 如果页面空间不足，创建新页面
            c.showPage()
            y_position = 750
            c.setFont("Helvetica", 12)
        
        c.drawString(50, y_position, detail)
        y_position -= 15
    
    # 添加描述
    if character_data.get('description'):
        if y_position < 100:  # 确保有足够空间
            c.showPage()
            y_position = 750
            c.setFont("Helvetica", 12)
        
        c.drawString(50, y_position, f"{translations['description']}:")
        y_position -= 20
        
        # 处理长描述，自动换行
        description = character_data['description']
        words = description.split()
        line = ""
        for word in words:
            test_line = line + word + " "
            if len(test_line) > 80:  # 大约80字符换行
                c.drawString(50, y_position, line)
                y_position -= 15
                line = word + " "
                if y_position < 50:
                    c.showPage()
                    y_position = 750
                    c.setFont("Helvetica", 12)
            else:
                line = test_line
        
        if line:
            c.drawString(50, y_position, line)
            y_position -= 15
    
    c.save()
    return filename

# ==================== API端点 ====================
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "创意写作助手API",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "chat": "/api/chat",
            "generate_character": "/api/generate/character",
            "generate_booktitle": "/api/generate/booktitle",
            "generate_name": "/api/generate/name",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "text_model": TEXT_MODEL_ID,
        "image_model": IMAGE_MODEL_ID
    }

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"[聊天] 收到聊天请求: {request.message[:50]}... (语言: {request.language})")
        system_prompt = "你是一个专业的创意写作助手，专门帮助作家和编剧。请根据用户请求提供有帮助、有创意的回答。"
        messages = build_spark_text_prompt(request.message, system_prompt, request.language)
        print(f"[聊天] 构建的提示词: {messages}")
        
        response = get_spark_text_response(messages)
        print(f"[聊天] AI响应: {response[:100]}...")
        
        if not response:
            print("[聊天] 警告: 收到空响应")
            response = "抱歉，我暂时无法回答这个问题。请尝试重新提问或检查网络连接。"
        
        return {"response": response, "session_id": request.session_id or str(uuid.uuid4())}
    except Exception as e:
        print(f"[聊天] 错误: {e}")
        import traceback
        traceback.print_exc()
        return {"response": f"抱歉，聊天功能暂时不可用。错误: {str(e)}", "session_id": request.session_id or str(uuid.uuid4())}

class SimpleCharacterRequest(BaseModel):
    description: str
    language: str = "zh"

async def check_request_disconnected(fastapi_request: Request) -> bool:
    """检查FastAPI请求是否已被中止"""
    try:
        # 检查连接状态
        if await fastapi_request.is_disconnected():
            print("[请求中止] 检测到客户端已断开连接")
            return True
        return False
    except Exception as e:
        print(f"[请求中止检查错误] {e}")
        return False

@app.post("/api/generate/character")
async def generate_character(fastapi_request: Request, request: Union[CharacterGenRequest, SimpleCharacterRequest]):
    print(f"[角色生成] ========== 开始处理角色生成请求 ==========")
    print(f"[角色生成] 请求时间: {datetime.now().isoformat()}")
    try:
        # 支持两种请求格式：完整的角色属性或简单的描述文本
        if hasattr(request, 'description') and not hasattr(request, 'gender'):
            # 处理简单描述格式
            simple_request = request
            print(f"[角色生成] 处理简单描述请求: {simple_request.description[:50]}...")
            
            # 在关键步骤前检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            # 使用AI从描述中提取角色属性
            extract_prompt = f"""
            请从以下角色描述中提取关键属性，并以JSON格式返回：
            {simple_request.description}
            
            需要提取的属性：
            - gender: 性别（男/女）
            - age: 年龄（如：25岁）
            - height: 身高（如：175cm）
            - weight: 体重（如：65kg）
            - hair_color: 发色
            - eye_color: 瞳色
            - profession: 职业
            - personality: 性格特点
            - nationality: 国籍/地区
            - fantasy_race: 奇幻种族（如：人类、精灵、矮人等，如果没有则留空）
            
            只返回JSON格式，不要其他内容。
            """
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            extract_messages = build_spark_text_prompt(extract_prompt, "你是一个角色属性提取器。", simple_request.language)
            extracted_data = get_spark_text_response(extract_messages)
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            # 如果API请求失败，返回错误
            if not extracted_data or extracted_data == "抱歉，AI响应超时，请稍后重试或尝试简化您的请求。":
                return {"error": "AI服务暂时不可用，请稍后重试"}
            
            # 尝试解析提取的数据
            try:
                import re
                # 尝试从响应中提取JSON
                json_match = re.search(r'\{.*\}', extracted_data, re.DOTALL)
                if json_match:
                    extracted_json = json.loads(json_match.group())
                    # 使用提取的属性创建角色数据
                    character_data = {
                        "name": "未知角色",
                        "description": simple_request.description,
                        "gender": extracted_json.get('gender', '未知'),
                        "age": extracted_json.get('age', '未知'),
                        "height": extracted_json.get('height', '未知'),
                        "weight": extracted_json.get('weight', '未知'),
                        "hair_color": extracted_json.get('hair_color', '未知'),
                        "eye_color": extracted_json.get('eye_color', '未知'),
                        "profession": extracted_json.get('profession', '未知'),
                        "personality": extracted_json.get('personality', '未知'),
                        "nationality": extracted_json.get('nationality', '未知'),
                        "fantasy_race": extracted_json.get('fantasy_race', ''),
                        "generated_at": datetime.now().isoformat()
                    }
                else:
                    # 如果无法解析JSON，使用默认值
                    character_data = {
                        "name": "未知角色",
                        "description": simple_request.description,
                        "gender": "未知",
                        "age": "未知",
                        "height": "未知",
                        "weight": "未知",
                        "hair_color": "未知",
                        "eye_color": "未知",
                        "profession": "未知",
                        "personality": "未知",
                        "nationality": "未知",
                        "fantasy_race": "",
                        "generated_at": datetime.now().isoformat()
                    }
            except:
                # 如果解析失败，使用默认值
                character_data = {
                    "name": "未知角色",
                    "description": simple_request.description,
                    "gender": "未知",
                    "age": "未知",
                    "height": "未知",
                    "weight": "未知",
                    "hair_color": "未知",
                    "eye_color": "未知",
                    "profession": "未知",
                    "personality": "未知",
                    "nationality": "未知",
                    "fantasy_race": "",
                    "generated_at": datetime.now().isoformat()
                }
            
            # 1. 生成详细的角色描述文本（像完整格式那样）
            if simple_request.language == "ru":
                # 俄语提示词，使用俄语标点符号和表达方式
                description_prompt = f"""
                Создайте подробное описание персонажа, включающее следующую информацию:
                - Имя и фамилию, соответствующие культуре {character_data.get('nationality', 'неизвестно')}
                - Живое описание внешности и характера
                - Фрагмент предыстории, соответствующий профессии и характеру
                
                Конкретные параметры:
                Пол: {character_data.get('gender', 'неизвестно')}, Возраст: {character_data.get('age', 'неизвестно')}, Рост: {character_data.get('height', 'неизвестно')}, Вес: {character_data.get('weight', 'неизвестно')},
                Цвет волос: {character_data.get('hair_color', 'неизвестно')}, Цвет глаз: {character_data.get('eye_color', 'неизвестно')}, Профессия: {character_data.get('profession', 'неизвестно')},
                Характер: {character_data.get('personality', 'неизвестно')}, Фэнтези раса: {character_data.get('fantasy_race', 'человек')}.
                """
                system_role = "Ты дизайнер персонажей."
            else:
                # 中文提示词
                description_prompt = f"""
                请创建一个详细角色描述，包含以下信息：
                - 一个符合{character_data.get('nationality', '未知')}文化的姓名（姓和名）
                - 一段生动的外貌和性格描写
                - 符合其职业和性格的背景故事片段
                具体参数：
                性别：{character_data.get('gender', '未知')}， 年龄：{character_data.get('age', '未知')}， 身高：{character_data.get('height', '未知')}， 体重：{character_data.get('weight', '未知')}，
                发色：{character_data.get('hair_color', '未知')}， 瞳色：{character_data.get('eye_color', '未知')}， 职业：{character_data.get('profession', '未知')}，
                性格：{character_data.get('personality', '未知')}， 奇幻种族：{character_data.get('fantasy_race', '人类')}。
                """
                system_role = "你是一个角色设计师。"
            
            description_messages = build_spark_text_prompt(description_prompt, system_role, simple_request.language)
            character_description = get_spark_text_response(description_messages)
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            # 如果API请求失败，返回错误
            if not character_description or character_description == "抱歉，AI响应超时，请稍后重试或尝试简化您的请求。":
                return {"error": "AI服务暂时不可用，请稍后重试"}
            
            if not character_description:
                character_description = simple_request.description  # 如果生成失败，使用原始描述
            
            # 2. 提取姓名
            name_prompt = f"从以下描述中提取角色的完整姓名（姓和名），只返回姓名，不要其他内容：{character_description[:200]}"
            name_messages = build_spark_text_prompt(name_prompt, "", simple_request.language)
            character_name = get_spark_text_response(name_messages).strip()
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            # 如果API请求失败，返回错误
            if not character_name or character_name == "抱歉，AI响应超时，请稍后重试或尝试简化您的请求。":
                return {"error": "AI服务暂时不可用，请稍后重试"}
            
            if not character_name:
                character_name = "未知角色"
            
            # 更新角色数据
            character_data["name"] = character_name
            character_data["description"] = character_description
            
            # 3. 生成角色图片
            print(f"[角色生成] 尝试为简单描述生成图片...")
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            # 图像生成提示词强制使用中文，避免俄语文本导致API错误
            # 如果角色名称包含非中文字符，使用默认名称
            safe_character_name = character_name
            # 检查名称是否包含俄语或其他非中文字符
            import re
            if re.search(r'[а-яА-Я]', character_name):  # 检测俄语字符
                safe_character_name = "角色"
                print(f"[角色生成] 检测到俄语名称，使用默认名称: {safe_character_name}")
            
            # 简化提示词，提高生成成功率
            image_gen_prompt = f"""
            全身肖像，{safe_character_name}，{character_data.get('gender', '未知')}，{character_data.get('age', '未知')}，
            发色：{character_data.get('hair_color', '未知')}，瞳色：{character_data.get('eye_color', '未知')}，
            职业：{character_data.get('profession', '未知')}，{character_data.get('nationality', '未知')}风格
            """
            image_path = call_tti_api(image_gen_prompt)
            
            # 如果图像生成失败，尝试使用更简单的提示词
            if not image_path:
                print("[角色生成] 第一次图像生成失败，尝试简化提示词...")
                simple_prompt = f"角色肖像，{safe_character_name}，{character_data.get('gender', '未知')}，{character_data.get('profession', '未知')}"
                image_path = call_tti_api(simple_prompt)
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            if image_path:
                print(f"[角色生成] 图片生成成功: {image_path}")
            else:
                print(f"[角色生成] 图片生成失败，将继续生成PDF")
            
            # 4. 生成PDF
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            pdf_path = generate_character_pdf(character_data, image_path, simple_request.language)
            
            return {
                "character": character_data,
                "image_url": f"/api/file/{os.path.basename(image_path)}" if image_path else None,
                "pdf_url": f"/api/file/{os.path.basename(pdf_path)}"
            }
        
        else:
            # 处理完整的角色属性格式（原有逻辑）
            print(f"[角色生成] 开始处理请求: {request.nationality} {request.profession}")
            
            # 1. 生成角色描述文本
            if request.language == "ru":
                # 俄语提示词，使用俄语标点符号和表达方式
                prompt = f"""
                Создайте подробное описание персонажа, включающее следующую информацию:
                - Имя и фамилию, соответствующие культуре {request.nationality}
                - Живое описание внешности и характера
                - Фрагмент предыстории, соответствующий профессии и характеру
                
                Конкретные параметры:
                Пол: {request.gender}, Возраст: {request.age}, Рост: {request.height}, Вес: {request.weight},
                Цвет волос: {request.hair_color}, Цвет глаз: {request.eye_color}, Профессия: {request.profession},
                Характер: {request.personality}, Фэнтези раса: {request.fantasy_race if request.fantasy_race else 'человек'}.
                """
                system_role = "Ты дизайнер персонажей."
            else:
                # 中文提示词
                prompt = f"""
                请创建一个详细角色描述，包含以下信息：
                - 一个符合{request.nationality}文化的姓名（姓和名）
                - 一段生动的外貌和性格描写
                - 符合其职业和性格的背景故事片段
                具体参数：
                性别：{request.gender}， 年龄：{request.age}， 身高：{request.height}， 体重：{request.weight}，
                发色：{request.hair_color}， 瞳色：{request.eye_color}， 职业：{request.profession}，
                性格：{request.personality}， 奇幻种族：{request.fantasy_race if request.fantasy_race else '人类'}。
                """
                system_role = "你是一个角色设计师。"
            
            messages = build_spark_text_prompt(prompt, system_role, request.language)
            character_description = get_spark_text_response(messages)
            
            # 检查请求是否中止
            if await check_request_disconnected(fastapi_request):
                return {"error": "请求已被中止"}
            
            # 如果API请求失败，返回错误
            if not character_description or character_description == "抱歉，AI响应超时，请稍后重试或尝试简化您的请求。":
                return {"error": "AI服务暂时不可用，请稍后重试"}
            
            if not character_description:
                raise HTTPException(status_code=500, detail="生成角色描述失败")

        # 2. 提取姓名
        name_prompt = f"从以下描述中提取角色的完整姓名（姓和名），只返回姓名，不要其他内容：{character_description[:200]}"
        name_messages = build_spark_text_prompt(name_prompt, "", request.language)
        character_name = get_spark_text_response(name_messages).strip()
        
        # 检查请求是否中止
        if await check_request_disconnected(fastapi_request):
            return {"error": "请求已被中止"}
        
        # 如果API请求失败，返回错误
        if not character_name or character_name == "抱歉，AI响应超时，请稍后重试或尝试简化您的请求。":
            return {"error": "AI服务暂时不可用，请稍后重试"}
        
        if not character_name:
            character_name = "未知角色"

        # 3. 生成角色图片
        # 优化提示词，使其更适合图像生成
        # 图像生成提示词强制使用中文，避免俄语文本导致API错误
        # 如果角色名称包含非中文字符，使用默认名称
        safe_character_name = character_name
        # 检查名称是否包含俄语或其他非中文字符
        import re
        if re.search(r'[а-яА-Я]', character_name):  # 检测俄语字符
            safe_character_name = "角色"
            print(f"[角色生成] 检测到俄语名称，使用默认名称: {safe_character_name}")
        
        image_gen_prompt = f"""
        全身肖像，{safe_character_name}，{request.gender}，{request.age}，
        发色：{request.hair_color}，瞳色：{request.eye_color}，
        职业：{request.profession}，性格：{request.personality}，
        {request.nationality}风格，高清，艺术插画，背景虚化
        """
        print(f"[角色生成] 开始生成图片...")
        
        # 检查请求是否中止
        if await check_request_disconnected(fastapi_request):
            return {"error": "请求已被中止"}
        
        image_path = call_tti_api(image_gen_prompt)
        
        # 如果图像生成失败，尝试使用更简单的提示词
        if not image_path:
            print("[角色生成] 第一次图像生成失败，尝试简化提示词...")
            simple_prompt = f"角色肖像，{safe_character_name}，{request.gender}，{request.profession}"
            image_path = call_tti_api(simple_prompt)
        
        # 检查请求是否中止
        if await check_request_disconnected(fastapi_request):
            return {"error": "请求已被中止"}
        
        if image_path:
            print(f"[角色生成] 图片生成成功: {image_path}")
        else:
            print(f"[角色生成] 图片生成失败，将继续生成PDF")

        # 4. 组装角色数据
        character_data = {
            "name": character_name,
            "description": character_description,
            "gender": request.gender,
            "age": request.age,
            "height": request.height,
            "weight": request.weight,
            "hair_color": request.hair_color,
            "eye_color": request.eye_color,
            "profession": request.profession,
            "personality": request.personality,
            "nationality": request.nationality,
            "fantasy_race": request.fantasy_race,
            "generated_at": datetime.now().isoformat()
        }

        # 5. 生成PDF
        print(f"[角色生成] 开始生成PDF...")
        
        # 检查请求是否中止
        if await check_request_disconnected(fastapi_request):
            return {"error": "请求已被中止"}
        
        pdf_path = generate_character_pdf(character_data, image_path, request.language)
        
        print(f"[角色生成] ========== 角色生成完成 ==========")
        print(f"[角色生成] 完成时间: {datetime.now().isoformat()}")
        print(f"[角色生成] 返回数据: character={character_data.get('name')}, image={image_path is not None}, pdf={pdf_path}")
        
        return {
            "character": character_data,
            "image_url": f"/api/file/{os.path.basename(image_path)}" if image_path else None,
            "pdf_url": f"/api/file/{os.path.basename(pdf_path)}"
        }
    
    except Exception as e:
        print(f"[角色生成] 全局异常: {e}")
        import traceback
        traceback.print_exc()
        error_message = str(e)
        # 如果是超时错误，提供更友好的提示
        if "timeout" in error_message.lower() or "timed out" in error_message.lower():
            return {"error": "请求处理超时，生成图片和PDF需要较长时间，请稍后重试或简化请求"}
        # 如果是网络错误
        if "connection" in error_message.lower() or "network" in error_message.lower():
            return {"error": "网络连接错误，请检查网络连接后重试"}
        return {"error": f"角色生成失败: {error_message}"}

@app.post("/api/generate/booktitle")
async def generate_book_title(request: BookTitleGenRequest):
    if request.description and not request.title:
        prompt = f"根据以下描述生成一个吸引人的书名（只返回书名本身）：{request.description}"
        task = "生成书名"
    elif request.title and not request.description:
        prompt = f"根据书名《{request.title}》生成一个简短的剧情梗概或书籍描述（约100字）"
        task = "生成描述"
    else:
        raise HTTPException(status_code=400, detail="请提供描述（用于生成书名）或书名（用于生成描述），但不能同时提供两者。")

    messages = build_spark_text_prompt(prompt, f"你是一个{request.genre if request.genre else '全能'}题材的图书编辑。", request.language)
    result = get_spark_text_response(messages)

    return {
        "task": task,
        "input": request.description or request.title,
        "result": result.strip()
    }

@app.get("/api/generate/name")
async def generate_name(nationality: str, fantasy_type: Optional[str] = None, language: str = "zh"):
    prompt = f"生成一个符合{nationality}文化背景"
    if fantasy_type:
        prompt += f"且是{fantasy_type}种族"
    prompt += "的姓名（包含姓和名），并推荐一个该角色可能居住的城市。格式：姓名 | 城市"

    messages = build_spark_text_prompt(prompt, "你是一个命名专家。", language)
    result = get_spark_text_response(messages)

    parts = result.split('|')
    name = parts[0].strip() if len(parts) > 0 else result.strip()
    city = parts[1].strip() if len(parts) > 1 else "未知城市"

    return {
        "nationality": nationality,
        "fantasy_type": fantasy_type,
        "name": name,
        "city": city,
        "full_response": result
    }

@app.get("/api/file/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(TEMP_FILE_DIR, filename)
    if os.path.exists(file_path):
        # 根据文件扩展名设置正确的媒体类型
        media_type = None
        if filename.lower().endswith('.pdf'):
            media_type = 'application/pdf'
        elif filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            # 图片类型，让浏览器自动检测
            if filename.lower().endswith('.png'):
                media_type = 'image/png'
            elif filename.lower().endswith(('.jpg', '.jpeg')):
                media_type = 'image/jpeg'
            elif filename.lower().endswith('.gif'):
                media_type = 'image/gif'
            elif filename.lower().endswith('.webp'):
                media_type = 'image/webp'
        
        # 添加更多安全头部信息以提高浏览器兼容性
        response_headers = {
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN"
        }
        
        # 对于PDF文件，添加特定的头部信息
        if filename.lower().endswith('.pdf'):
            response_headers.update({
                "Content-Security-Policy": "frame-ancestors 'self' http://localhost:* https://localhost:*",
                "X-Robots-Tag": "noindex, nofollow"
            })
        
        return FileResponse(
            file_path,
            media_type=media_type,
            headers=response_headers
        )
    raise HTTPException(status_code=404, detail="文件未找到")

if __name__ == "__main__":
    print("=" * 50)
    print("创意写作助手API服务器启动中...")
    print(f"文本API-ModelID: {TEXT_MODEL_ID}")
    print(f"图像API-ModelID: {IMAGE_MODEL_ID}")
    print(f"临时文件目录: {TEMP_FILE_DIR}")
    print("=" * 50)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
