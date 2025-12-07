# 图像生成API修复说明

## 修复的问题

根据用户提供的API文档，已修复以下关键问题：

### 1. API URL配置修正
**最终正确配置：** `https://maas-api.cn-huabei-1.xf-yun.com/v2.1/tti`

### 2. ModelId参数修正
**最终正确配置：** `xopzimageturbo`（根据用户提供的正确配置）

### 3. 修正请求参数结构
**关键修复：参数名修正**
- **修复前：** 测试文件中错误使用`"tti"`作为参数名
- **修复后：** 统一使用`"chat"`作为参数名（符合API文档）

**添加必需的参数：**
- `seed`: 42（随机种子）
- `num_inference_steps`: 20（推理步数）
- `guidance_scale`: 5.0（提示词相关度）
- `scheduler`: "Euler"（调度器）
- `negative_prompts`: { "text": "" }（负面提示词）

**保留必需的参数：**
- `patch_id`（必需字段，格式为数组：`["123456"]`）

### 4. 修正分辨率设置
**修复前：** `512x512`
**修复后：** `768x768`（API文档默认分辨率）

### 5. 修正payload结构
**修复前：** 
```json
{"role": "user", "content": prompt, "index": 0}
```
**修复后：**
```json
{"role": "user", "content": prompt}
```

### 6. 修正鉴权头生成
**修复前：** Authorization头进行了双重base64编码
**修复后：** Authorization头直接使用原始字符串格式

**修复前代码：**
```python
authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode('utf-8')
```

**修复后代码：**
```python
authorization = authorization_origin  # 直接使用原始字符串
```

## 修复的文件

### main.py
- 修正了TTI_API_URL配置
- 修正了IMAGE_MODEL_ID为"general"
- 简化了call_tti_api函数的请求参数
- 移除了多余的参数，只保留API文档中指定的参数

### test_image_api.py
- 修正了TTI_API_URL配置
- 修正了IMAGE_MODEL_ID为"general"
- 简化了test_tti_api函数的请求参数
- 移除了多余的参数，只保留API文档中指定的参数

## 修复后的请求格式

根据API文档，修复后的请求格式如下：

```json
{
  "header": {
    "app_id": "your_appid",
    "uid": "用户ID（可选）"
  },
  "parameter": {
    "chat": {
      "domain": "general",
      "width": 512,
      "height": 512
    }
  },
  "payload": {
    "message": {
      "text": [
        {
          "role": "user",
          "content": "提示词内容"
        }
      ]
    }
  }
}
```

## 测试方法

### 方法1：运行测试脚本
```bash
python test_image_api.py
```

### 方法2：启动FastAPI服务器
```bash
python main.py
```

然后通过API端点测试：
- POST `/api/generate/character` - 生成角色（包含图像生成）
- 或者直接调用call_tti_api函数

### 方法3：手动测试
可以使用以下代码片段进行测试：

```python
from main import call_tti_api

# 测试图像生成
result = call_tti_api("一个美丽的风景，有山有水，阳光明媚")
if result:
    print(f"图像生成成功，保存路径: {result}")
else:
    print("图像生成失败")
```

## 预期结果

修复后，图像生成API应该能够：
1. 成功建立连接并发送请求
2. 收到正确的HTTP 200响应
3. 解析返回的base64图像数据
4. 成功保存生成的图片文件

## 错误处理

如果仍然遇到问题，请检查：
1. API密钥和密钥是否正确
2. 网络连接是否正常
3. 服务器时间是否准确（鉴权对时间敏感）
4. 查看详细的错误日志信息

## 注意事项

- 图像生成按点数计费，不同分辨率计费不同
- 默认分辨率512x512为6个图点数
- 生成的图片会在元数据中包含AI生成标识
- 建议使用字节流方式保存图片以避免元数据丢失
