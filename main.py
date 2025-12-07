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
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Union
import websocket
import threading
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

# 2. 星火图像生成API配置 (HTTP) - 根据用户提供的正确配置
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
def build_spark_text_prompt(user_request: str, system_role: str, language: str) -> list:
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
        
        if not response_received.wait(timeout=10):
            print("[超时] 未在10秒内收到完整响应")
        
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
        
        # 根据API文档构造完整的请求体
        request_data = {
            "header": {
                "app_id": TTI_APP_ID,
                "uid": str(uuid.uuid4())[:32],
                "patch_id": ["123456"]  # 必需的字段
            },
            "parameter": {
                "chat": {
                    "domain": IMAGE_MODEL_ID,
                    "width": 512,
                    "height": 512
                }
            },
            "payload": {
                "message": {
                    "text": [{"role": "user", "content": prompt}]
                }
            }
        }
        
        print(f"[图像API] 发送请求，提示词: {prompt[:50]}...")
        
        # 调试：打印完整的请求数据
        print(f"[图像API] 完整请求数据:\n{json.dumps(request_data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            TTI_API_URL,
            headers=headers,
            json=request_data,
            timeout=30
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
                return None
        else:
            print(f"[图像API HTTP错误] {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"[调用图像API异常] {e}")
        import traceback
        traceback.print_exc()
        return None

def generate_character_pdf(character_data: dict, image_path: Optional[str]) -> str:
    pdf_filename = f"{TEMP_FILE_DIR}/{uuid.uuid4()}.pdf"
    doc = SimpleDocTemplate(pdf_filename, pagesize=A4)
    story = []
    
    # 创建支持多语言的样式
    styles = getSampleStyleSheet()
    
    # 使用更可靠的多语言字体方案
    # 尝试使用支持Unicode的字体，优先使用系统字体
    unicode_fonts = [
        'Arial Unicode MS',  # 支持中文、英文、俄语
        'DejaVu Sans',       # 开源Unicode字体
        'SimSun',            # 宋体
        'SimHei',            # 黑体
        'Microsoft YaHei',   # 微软雅黑
        'Helvetica'          # 默认字体
    ]
    
    # 检查并注册可用的字体
    available_fonts = []
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        
        # 常见字体路径
        font_paths = {
            'Arial Unicode MS': 'C:\\Windows\\Fonts\\arialuni.ttf',
            'SimSun': 'C:\\Windows\\Fonts\\simsun.ttc',
            'SimHei': 'C:\\Windows\\Fonts\\simhei.ttf',
            'Microsoft YaHei': 'C:\\Windows\\Fonts\\msyh.ttc',
            'DejaVu Sans': 'C:\\Windows\\Fonts\\DejaVuSans.ttf'  # 可能需要安装
        }
        
        for font_name, font_path in font_paths.items():
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont(font_name, font_path))
                    available_fonts.append(font_name)
                    print(f"[PDF生成] 成功注册字体: {font_name}")
                except Exception as e:
                    print(f"[PDF生成] 注册字体 {font_name} 失败: {e}")
                    continue
    except ImportError:
        print("[PDF生成] 无法导入字体模块")
    
    # 选择最佳字体
    selected_font = 'Helvetica'  # 默认字体
    for font in unicode_fonts:
        if font in available_fonts:
            selected_font = font
            print(f"[PDF生成] 使用字体: {selected_font}")
            break
    
    # 创建支持多语言的样式
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

    # 根据语言生成标题
    title_text = f"角色档案: {character_data.get('name', '未知角色')}"
    story.append(Paragraph(title_text, title_style))
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

    # 生成多语言详情
    details = [
        f"性别: {character_data.get('gender', '')}",
        f"年龄: {character_data.get('age', '')}",
        f"身高/体重: {character_data.get('height', '')} / {character_data.get('weight', '')}",
        f"发色/瞳色: {character_data.get('hair_color', '')} / {character_data.get('eye_color', '')}",
        f"职业: {character_data.get('profession', '')}",
        f"性格: {character_data.get('personality', '')}",
        f"国籍/地区: {character_data.get('nationality', '')}",
        f"奇幻种族: {character_data.get('fantasy_race', '') if character_data.get('fantasy_race') else ''}",
        f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    ]
    
    for detail in details:
        story.append(Paragraph(detail, body_style))
        story.append(Spacer(1, 6))

    if character_data.get('description'):
        story.append(Spacer(1, 12))
        story.append(Paragraph("角色描述:", heading_style))
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
<<<<<<< HEAD
        
        # 对描述文本进行格式化处理
        description = character_data['description']
        
        # 清理Markdown格式标记
        import re
        description = re.sub(r'\*\*(.*?)\*\*', r'\1', description)  # 移除 **粗体**
        description = re.sub(r'###\s*(.*?)\s*', r'\1', description)  # 移除 ### 标题
        description = re.sub(r'---+\s*', '', description)  # 移除 --- 分隔线
        description = re.sub(r'\*{3,}', '', description)  # 移除 *** 分隔线
        
        # 改进的格式化逻辑：按照角色名称、外貌描写、性格描写结构分段
        # 尝试识别描述中的不同部分
        name_pattern = r'([^。！？.!?]*?(姓名|名字|角色名)[^。！？.!?]*?[。！？.!?])'
        appearance_pattern = r'([^。！？.!?]*?(外貌|长相|外表|形象|发色|瞳色|身高|体重|眼睛|头发|皮肤)[^。！？.!?]*?[。！？.!?])'
        personality_pattern = r'([^。！？.!?]*?(性格|个性|脾气|品质|特点|性情|品格)[^。！？.!?]*?[。！？.!?])'
        race_pattern = r'([^。！？.!?]*?(种族|血统|物种|奇幻种族)[^。！？.!?]*?[。！？.!?])'
        
        # 提取不同部分的句子
        name_sentences = re.findall(name_pattern, description)
        appearance_sentences = re.findall(appearance_pattern, description)
        personality_sentences = re.findall(personality_pattern, description)
        race_sentences = re.findall(race_pattern, description)
        
        # 如果无法自动识别结构，使用智能分段
        if len(name_sentences) > 0 or len(appearance_sentences) > 0 or len(personality_sentences) > 0 or len(race_sentences) > 0:
            # 按照识别到的结构分段
            if name_sentences:
                story.append(Paragraph("▪️ 角色信息", heading_style))
                story.append(Spacer(1, 4))
                for sentence in name_sentences:
                    story.append(Paragraph(sentence[0], desc_style))
                story.append(Spacer(1, 8))
            
            if appearance_sentences:
                story.append(Paragraph("▪️ 外貌描写", heading_style))
                story.append(Spacer(1, 4))
                for sentence in appearance_sentences:
                    story.append(Paragraph(sentence[0], desc_style))
                story.append(Spacer(1, 8))
            
            if personality_sentences:
                story.append(Paragraph("▪️ 性格特点", heading_style))
                story.append(Spacer(1, 4))
                for sentence in personality_sentences:
                    story.append(Paragraph(sentence[0], desc_style))
                story.append(Spacer(1, 8))
            
            if race_sentences:
                story.append(Paragraph("▪️ 种族设定", heading_style))
                story.append(Spacer(1, 4))
                for sentence in race_sentences:
                    story.append(Paragraph(sentence[0], desc_style))
                story.append(Spacer(1, 8))
            
            # 添加剩余的描述内容（如果有）
            remaining_text = description
            for sentence_group in [name_sentences, appearance_sentences, personality_sentences, race_sentences]:
                for sentence in sentence_group:
                    remaining_text = remaining_text.replace(sentence[0], '', 1)
            
            if remaining_text.strip():
                story.append(Paragraph("▪️ 背景故事", heading_style))
                story.append(Spacer(1, 4))
                story.append(Paragraph(remaining_text.strip(), desc_style))
        else:
            # 如果无法识别结构，使用智能分段
            sentences = re.split(r'[。！？.!?]', description)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            # 将句子分组为段落（每段3-4句）
            paragraphs = []
            current_para = []
            for sentence in sentences:
                current_para.append(sentence)
                if len(current_para) >= 3 and len(''.join(current_para)) > 100:
                    paragraphs.append('。'.join(current_para) + '。')
                    current_para = []
            
            if current_para:
                paragraphs.append('。'.join(current_para) + '。')
            
            # 添加格式化后的段落
            for i, para in enumerate(paragraphs):
                if i == 0:
                    story.append(Paragraph("▪️ 角色介绍", heading_style))
                    story.append(Spacer(1, 4))
                story.append(Paragraph(para, desc_style))
                story.append(Spacer(1, 8))
=======
        description = character_data['description']
        story.append(Paragraph(description, desc_style))
>>>>>>> 5e2e3a28b9ce180e5ed882ba0e851c5eb1e1ab81

    # 构建PDF文档
    try:
        doc.build(story)
        print(f"[PDF生成] PDF文件已生成: {pdf_filename}")
        return pdf_filename
    except Exception as e:
        print(f"[PDF生成] 构建PDF失败: {e}")
        # 如果失败，尝试使用默认字体重新构建
        try:
            print("[PDF生成] 尝试使用默认字体重新构建...")
            # 重新创建简单的PDF
            from reportlab.pdfgen import canvas
            c = canvas.Canvas(pdf_filename, pagesize=A4)
            c.setFont("Helvetica", 12)
            c.drawString(50, 750, "角色档案")
            c.drawString(50, 730, f"姓名: {character_data.get('name', '未知角色')}")
            c.drawString(50, 710, f"性别: {character_data.get('gender', '')}")
            c.drawString(50, 690, f"年龄: {character_data.get('age', '')}")
            c.save()
            return pdf_filename
        except Exception as fallback_error:
            print(f"[PDF生成] 备用方案也失败: {fallback_error}")
            raise fallback_error

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

@app.post("/api/generate/character")
async def generate_character(request: Union[CharacterGenRequest, SimpleCharacterRequest]):
    # 支持两种请求格式：完整的角色属性或简单的描述文本
    if hasattr(request, 'description') and not hasattr(request, 'gender'):
        # 处理简单描述格式
        simple_request = request
        print(f"[角色生成] 处理简单描述请求: {simple_request.description[:50]}...")
        
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
        
        extract_messages = build_spark_text_prompt(extract_prompt, "你是一个角色属性提取器。", simple_request.language)
        extracted_data = get_spark_text_response(extract_messages)
        
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
        description_messages = build_spark_text_prompt(description_prompt, "你是一个角色设计师。", simple_request.language)
        character_description = get_spark_text_response(description_messages)
        
        if not character_description:
            character_description = simple_request.description  # 如果生成失败，使用原始描述
        
        # 2. 提取姓名
        name_prompt = f"从以下描述中提取角色的完整姓名（姓和名），只返回姓名，不要其他内容：{character_description[:200]}"
        name_messages = build_spark_text_prompt(name_prompt, "", simple_request.language)
        character_name = get_spark_text_response(name_messages).strip()
        
        if not character_name:
            character_name = "未知角色"
        
        # 更新角色数据
        character_data["name"] = character_name
        character_data["description"] = character_description
        
        # 3. 生成角色图片
        print(f"[角色生成] 尝试为简单描述生成图片...")
        image_gen_prompt = f"""
        全身肖像，{character_name}，{character_data.get('gender', '未知')}，{character_data.get('age', '未知')}，
        发色：{character_data.get('hair_color', '未知')}，瞳色：{character_data.get('eye_color', '未知')}，
        职业：{character_data.get('profession', '未知')}，性格：{character_data.get('personality', '未知')}，
        {character_data.get('nationality', '未知')}风格，高清，艺术插画，背景虚化
        """
        image_path = call_tti_api(image_gen_prompt)
        
        if image_path:
            print(f"[角色生成] 图片生成成功: {image_path}")
        else:
            print(f"[角色生成] 图片生成失败，将继续生成PDF")
        
        # 4. 生成PDF
        pdf_path = generate_character_pdf(character_data, image_path)
        
        return {
            "character": character_data,
            "image_url": f"/file/{os.path.basename(image_path)}" if image_path else None,
            "pdf_url": f"/file/{os.path.basename(pdf_path)}"
        }
    
    else:
        # 处理完整的角色属性格式（原有逻辑）
        print(f"[角色生成] 开始处理请求: {request.nationality} {request.profession}")
        
        # 1. 生成角色描述文本
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
        messages = build_spark_text_prompt(prompt, "你是一个角色设计师。", request.language)
        character_description = get_spark_text_response(messages)
        
        if not character_description:
            raise HTTPException(status_code=500, detail="生成角色描述失败")

        # 2. 提取姓名
        name_prompt = f"从以下描述中提取角色的完整姓名（姓和名），只返回姓名，不要其他内容：{character_description[:200]}"
        name_messages = build_spark_text_prompt(name_prompt, "", request.language)
        character_name = get_spark_text_response(name_messages).strip()
        
        if not character_name:
            character_name = "未知角色"

        # 3. 生成角色图片
        # 优化提示词，使其更适合图像生成
        image_gen_prompt = f"""
        全身肖像，{character_name}，{request.gender}，{request.age}，
        发色：{request.hair_color}，瞳色：{request.eye_color}，
        职业：{request.profession}，性格：{request.personality}，
        {request.nationality}风格，高清，艺术插画，背景虚化
        """
        print(f"[角色生成] 开始生成图片...")
        image_path = call_tti_api(image_gen_prompt)
        
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
        pdf_path = generate_character_pdf(character_data, image_path)
        
        return {
            "character": character_data,
            "image_url": f"/file/{os.path.basename(image_path)}" if image_path else None,
            "pdf_url": f"/file/{os.path.basename(pdf_path)}"
        }

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

@app.get("/file/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(TEMP_FILE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="文件未找到")

if __name__ == "__main__":
    print("=" * 50)
    print("创意写作助手API服务器启动中...")
    print(f"文本API-ModelID: {TEXT_MODEL_ID}")
    print(f"图像API-ModelID: {IMAGE_MODEL_ID}")
    print(f"临时文件目录: {TEMP_FILE_DIR}")
    print("=" * 50)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)