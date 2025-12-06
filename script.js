const API_BASE = 'http://localhost:8000/api';
let currentLanguage = 'zh';
let messageHistory = [];

// 双语文本配置
const translations = {
    zh: {
        title: "创意写作助手",
        subtitle: "AI聊天机器人 - 为作家和编剧提供创意支持",
        welcomeMessage: "您好！我是您的创意写作助手，我可以帮助您：",
        sendBtn: "发送",
        messagePlaceholder: "输入您的消息...",
        newChatBtn: "新建对话",
        clearChatBtn: "清空对话",
        saveChatBtn: "保存聊天记录",
        sidebarToggleBtn: "显示角色生成",
        sidebarToggleBtnActive: "隐藏角色生成",
        newChatConfirm: "确定要开始新的对话吗？当前对话内容将被清空。",
        noChatToSave: "没有聊天记录可保存",
        chatSaved: "聊天记录已保存",
        quickActions: {
            generateName: "生成角色姓名",
            generateCharacter: "生成完整角色",
            generateBookTitle: "生成书名",
            chat: "创意聊天"
        },
        presetTitle: "预设角色模板",
        customCharacterTitle: "自定义角色生成",
        genderLabel: "性别",
        ageLabel: "年龄",
        heightLabel: "身高",
        weightLabel: "体重",
        hairLabel: "发色",
        eyesLabel: "瞳色",
        professionLabel: "职业",
        personalityLabel: "性格",
        nationalityLabel: "国家",
        raceLabel: "奇幻种族",
        agePlaceholder: "如：30岁",
        heightPlaceholder: "如：175cm",
        weightPlaceholder: "如：70kg",
        hairPlaceholder: "如：黑色",
        eyesPlaceholder: "如：棕色",
        professionPlaceholder: "如：骑士",
        personalityPlaceholder: "如：勇敢，忠诚",
        nationalityPlaceholder: "如：中国",
        racePlaceholder: "如：人类",
        generateCustomBtn: "生成自定义角色",
        presets: {
            russian_knight: "俄罗斯骑士",
            english_wizard: "英国巫师",
            chinese_warrior: "中国武士",
            elf_archer: "精灵弓箭手",
            dwarf_blacksmith: "矮人铁匠"
        },
        features: {
            chat: "聊天交流创意想法",
            character: "生成角色姓名和完整档案",
            book: "根据描述生成书名，或根据书名生成描述",
            pdf: "生成角色图片并导出PDF档案"
        },
        commandHint: "试试说：\"生成一个俄罗斯骑士的角色\" 或 \"帮我起一个精灵的名字\"",
        usageTips: {
            title: "使用提示",
            character: "说\"生成一个俄罗斯骑士\"来创建角色",
            name: "说\"帮我起个精灵名字\"来生成姓名",
            book: "说\"根据爱情故事生成书名\"来创作书名",
            chat: "或者直接和我聊天讨论创意想法"
        },
        commands: {
            name: "生成姓名",
            character: "生成角色",
            book: "生成书名",
            chat: "聊天"
        }
    },
    ru: {
        title: "Творческий помощник писателя",
        subtitle: "AI Чат-бот - творческая поддержка для писателей и сценаристов",
        welcomeMessage: "Здравствуйте! Я ваш творческий помощник, я могу помочь вам:",
        sendBtn: "Отправить",
        messagePlaceholder: "Введите ваше сообщение...",
        newChatBtn: "Новый диалог",
        clearChatBtn: "Очистить диалог",
        saveChatBtn: "Сохранить историю чата",
        sidebarToggleBtn: "Показать создание персонажа",
        sidebarToggleBtnActive: "Скрыть создание персонажа",
        newChatConfirm: "Вы уверены, что хотите начать новый диалог? Текущий диалог будет очищен.",
        noChatToSave: "Нет истории чата для сохранения",
        chatSaved: "История чата сохранена",
        quickActions: {
            generateName: "Создать имя персонажа",
            generateCharacter: "Создать персонажа",
            generateBookTitle: "Создать название книги",
            chat: "Творческий чат"
        },
        presetTitle: "Шаблоны персонажей",
        customCharacterTitle: "Создание персонажа",
        genderLabel: "Пол",
        ageLabel: "Возраст",
        heightLabel: "Рост",
        weightLabel: "Вес",
        hairLabel: "Цвет волос",
        eyesLabel: "Цвет глаз",
        professionLabel: "Профессия",
        personalityLabel: "Характер",
        nationalityLabel: "Страна",
        raceLabel: "Фэнтези раса",
        agePlaceholder: "Например: 30 лет",
        heightPlaceholder: "Например: 175см",
        weightPlaceholder: "Например: 70кг",
        hairPlaceholder: "Например: черный",
        eyesPlaceholder: "Например: коричневый",
        professionPlaceholder: "Например: рыцарь",
        personalityPlaceholder: "Например: храбрый, верный",
        nationalityPlaceholder: "Например: Китай",
        racePlaceholder: "Например: человек",
        generateCustomBtn: "Создать персонажа",
        presets: {
            russian_knight: "Русский рыцарь",
            english_wizard: "Английский волшебник",
            chinese_warrior: "Китайский воин",
            elf_archer: "Эльфийский лучник",
            dwarf_blacksmith: "Дварф-кузнец"
        },
        features: {
            chat: "Обсуждать творческие идеи",
            character: "Создавать имена и профили персонажей",
            book: "Создавать названия книг по описанию или описания по названию",
            pdf: "Создавать изображения персонажей и экспортировать PDF"
        },
        commandHint: "Попробуйте сказать: \"Создать персонажа русского рыцаря\" или \"Создайте имя эльфа\"",
        usageTips: {
            title: "Советы по использованию",
            character: "Скажите \"Создать русского рыцаря\" для создания персонажа",
            name: "Скажите \"Создайте имя эльфа\" для генерации имени",
            book: "Скажите \"Создайте название для любовной истории\" для создания названия",
            chat: "Или просто поговорите со мной о творческом письме"
        },
        commands: {
            name: "Создать имя",
            character: "Создать персонажа",
            book: "Создать название",
            chat: "Чат"
        }
    }
};

// 预设配置
const presets = {
    russian_knight: {
        gender: "男",
        age: "35岁",
        height: "185cm",
        weight: "85kg",
        hair_color: "棕色",
        eye_color: "灰色",
        profession: "骑士",
        personality: "勇敢，忠诚，严肃",
        nationality: "俄罗斯",
        fantasy_race: "人类"
    },
    english_wizard: {
        gender: "男",
        age: "65岁",
        height: "175cm",
        weight: "70kg",
        hair_color: "白色",
        eye_color: "蓝色",
        profession: "巫师",
        personality: "智慧，神秘，温和",
        nationality: "英国",
        fantasy_race: "人类"
    },
    chinese_warrior: {
        gender: "男",
        age: "28岁",
        height: "178cm",
        weight: "75kg",
        hair_color: "黑色",
        eye_color: "黑色",
        profession: "武士",
        personality: "忠诚，勇敢，正直",
        nationality: "中国",
        fantasy_race: "人类"
    },
    elf_archer: {
        gender: "女",
        age: "150岁",
        height: "180cm",
        weight: "60kg",
        hair_color: "银色",
        eye_color: "绿色",
        profession: "弓箭手",
        personality: "优雅，敏捷，神秘",
        nationality: "精灵王国",
        fantasy_race: "精灵"
    },
    dwarf_blacksmith: {
        gender: "男",
        age: "80岁",
        height: "140cm",
        weight: "90kg",
        hair_color: "红色",
        eye_color: "棕色",
        profession: "铁匠",
        personality: "坚韧，诚实，热情",
        nationality: "矮人山脉",
        fantasy_race: "矮人"
    }
};

// 切换语言
function switchLanguage() {
    currentLanguage = document.getElementById('lang').value;
    updateUI();
    updateQuickActions();
    updatePresetButtons();
    updateCharacterForm();
}

// 保存聊天记录
function saveChatHistory() {
    const t = translations[currentLanguage];
    if (messageHistory.length === 0) {
        alert(t.noChatToSave);
        return;
    }
    
    const chatContent = messageHistory.map(msg => {
        const time = msg.time;
        const sender = msg.isUser ? (currentLanguage === 'zh' ? '用户' : 'Пользователь') : (currentLanguage === 'zh' ? '助手' : 'Ассистент');
        return `[${time}] ${sender}: ${msg.content.replace(/<[^>]*>/g, '')}`;
    }).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(t.chatSaved);
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.querySelector('.main-container');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    
    sidebar.classList.toggle('active');
    mainContainer.classList.toggle('sidebar-active');
    
    // 更新按钮文本
    const t = translations[currentLanguage];
    if (sidebar.classList.contains('active')) {
        toggleBtn.textContent = t.sidebarToggleBtnActive;
    } else {
        toggleBtn.textContent = t.sidebarToggleBtn;
    }
}

// 更新界面文本
function updateUI() {
    const t = translations[currentLanguage];
    document.getElementById('title').textContent = t.title;
    document.getElementById('subtitle').textContent = t.subtitle;
    document.getElementById('welcomeMessage').textContent = t.welcomeMessage;
    document.getElementById('sendBtn').textContent = t.sendBtn;
    document.getElementById('messageInput').placeholder = t.messagePlaceholder;
    document.getElementById('newChatBtn').textContent = t.newChatBtn;
    document.getElementById('clearChatBtn').textContent = t.clearChatBtn;
    document.getElementById('saveChatBtn').textContent = t.saveChatBtn;
    
    // 更新侧边栏切换按钮文本
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebar && toggleBtn) {
        if (sidebar.classList.contains('active')) {
            toggleBtn.textContent = t.sidebarToggleBtnActive;
        } else {
            toggleBtn.textContent = t.sidebarToggleBtn;
        }
    }
}

// 更新快速操作按钮
function updateQuickActions() {
    const t = translations[currentLanguage];
    const quickActionsDiv = document.getElementById('quickActions');
    quickActionsDiv.innerHTML = `
        <div class="quick-action" onclick="handleQuickAction('generateName')">${t.quickActions.generateName}</div>
        <div class="quick-action" onclick="handleQuickAction('generateCharacter')">${t.quickActions.generateCharacter}</div>
        <div class="quick-action" onclick="handleQuickAction('generateBookTitle')">${t.quickActions.generateBookTitle}</div>
        <div class="quick-action" onclick="handleQuickAction('chat')">${t.quickActions.chat}</div>
    `;
}

// 更新预设角色按钮
function updatePresetButtons() {
    const t = translations[currentLanguage];
    const presetButtonsDiv = document.getElementById('presetButtons');
    let buttonsHTML = `<strong>${t.presetTitle}:</strong>`;
    
    Object.keys(t.presets).forEach(key => {
        buttonsHTML += `<div class="quick-action" onclick="handlePresetClick('${key}')">${t.presets[key]}</div>`;
    });
    
    presetButtonsDiv.innerHTML = buttonsHTML;
}

// 更新角色生成表单
function updateCharacterForm() {
    const t = translations[currentLanguage];
    const characterFormDiv = document.getElementById('characterForm');
    
    characterFormDiv.innerHTML = `
        <strong>${t.customCharacterTitle}:</strong>
        <div class="form-group">
            <label>${t.genderLabel}</label>
            <select id="customGender">
                <option value="男">${currentLanguage === 'zh' ? '男' : 'Мужской'}</option>
                <option value="女">${currentLanguage === 'zh' ? '女' : 'Женский'}</option>
            </select>
        </div>
        <div class="form-group">
            <label>${t.ageLabel}</label>
            <input type="text" id="customAge" placeholder="${t.agePlaceholder}" value="30岁">
        </div>
        <div class="form-group">
            <label>${t.heightLabel}</label>
            <input type="text" id="customHeight" placeholder="${t.heightPlaceholder}" value="175cm">
        </div>
        <div class="form-group">
            <label>${t.weightLabel}</label>
            <input type="text" id="customWeight" placeholder="${t.weightPlaceholder}" value="70kg">
        </div>
        <div class="form-group">
            <label>${t.hairLabel}</label>
            <input type="text" id="customHair" placeholder="${t.hairPlaceholder}" value="黑色">
        </div>
        <div class="form-group">
            <label>${t.eyesLabel}</label>
            <input type="text" id="customEyes" placeholder="${t.eyesPlaceholder}" value="棕色">
        </div>
        <div class="form-group">
            <label>${t.professionLabel}</label>
            <input type="text" id="customProfession" placeholder="${t.professionPlaceholder}" value="骑士">
        </div>
        <div class="form-group">
            <label>${t.personalityLabel}</label>
            <input type="text" id="customPersonality" placeholder="${t.personalityPlaceholder}" value="勇敢，忠诚">
        </div>
        <div class="form-group">
            <label>${t.nationalityLabel}</label>
            <input type="text" id="customNationality" placeholder="${t.nationalityPlaceholder}" value="中国">
        </div>
        <div class="form-group">
            <label>${t.raceLabel}</label>
            <input type="text" id="customRace" placeholder="${t.racePlaceholder}" value="人类">
        </div>
        <button class="generate-custom-btn" onclick="generateCustomCharacter()">${t.generateCustomBtn}</button>
    `;
}

// 生成自定义角色
async function generateCustomCharacter() {
    const request = {
        gender: document.getElementById('customGender').value,
        age: document.getElementById('customAge').value,
        height: document.getElementById('customHeight').value,
        weight: document.getElementById('customWeight').value,
        hair_color: document.getElementById('customHair').value,
        eye_color: document.getElementById('customEyes').value,
        profession: document.getElementById('customProfession').value,
        personality: document.getElementById('customPersonality').value,
        nationality: document.getElementById('customNationality').value,
        fantasy_race: document.getElementById('customRace').value,
        language: currentLanguage
    };
    
    // 创建详细的提示文本，包含所有参数
    const promptText = currentLanguage === 'zh' ? 
        `生成一个${request.nationality}的${request.profession}角色：
        - 性别：${request.gender}
        - 年龄：${request.age}
        - 身高：${request.height}，体重：${request.weight}
        - 发色：${request.hair_color}，瞳色：${request.eye_color}
        - 性格：${request.personality}
        - 种族：${request.fantasy_race}` :
        `Создать персонажа ${request.nationality} ${request.profession}：
        - Пол: ${request.gender}
        - Возраст: ${request.age}
        - Рост: ${request.height}, Вес: ${request.weight}
        - Цвет волос: ${request.hair_color}, Цвет глаз: ${request.eye_color}
        - Характер: ${request.personality}
        - Раса: ${request.fantasy_race}`;
    
    // 添加用户消息
    addMessage(promptText, true);
    
    // 显示输入指示器
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', request);
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
        } else {
            const character = response.character;
            
            // 调试：打印响应数据
            console.log('自定义角色生成响应:', response);
            
            let resultText = currentLanguage === 'zh' ?
                `🎨 <strong>角色生成成功！</strong><br>
                 👤 <strong>姓名：</strong>${character.name}<br>
                 📝 <strong>描述：</strong>${character.description ? character.description.substring(0, 200) + '...' : '无描述'}<br>` :
                `🎨 <strong>Персонаж создан успешно！</strong><br>
                 👤 <strong>Имя：</strong>${character.name}<br>
                 📝 <strong>Описание：</strong>${character.description ? character.description.substring(0, 200) + '...' : '无描述'}<br>`;
            
            // 添加PDF下载链接
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" target="_blank" class="download-link">📥 下载PDF档案</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" target="_blank" class="download-link">📥 Скачать PDF</a>`;
            } else {
                resultText += currentLanguage === 'zh' ?
                    `<span style="color: #666;">（PDF生成失败）</span>` :
                    `<span style="color: #666;">（PDF не создан）</span>`;
            }
            
            addMessage(resultText);
            
            // 添加图片显示
            if (response.image_url) {
                setTimeout(() => {
                    addMessage(`<img src="${API_BASE}${response.image_url}" class="character-image" alt="生成的角色图片">`);
                }, 100);
            } else {
                setTimeout(() => {
                    addMessage(currentLanguage === 'zh' ? 
                        `🖼️ <span style="color: #666;">（图片生成失败）</span>` :
                        `🖼️ <span style="color: #666;">（Изображение не создано）</span>`);
                }, 100);
            }
        }
    } catch (error) {
        addMessage(`❌ ${currentLanguage === 'zh' ? '请求失败：' : 'Запрос не удался：'} ${error.message}`);
    } finally {
        hideTypingIndicator();
    }
}

// 新建对话
function newConversation() {
    const t = translations[currentLanguage];
    if (confirm(t.newChatConfirm)) {
        clearConversation();
        addMessage(t.welcomeMessage, false);
    }
}

// 清空对话
function clearConversation() {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = '';
    messageHistory = [];
    
    // 重新添加欢迎消息
    const t = translations[currentLanguage];
    addMessage(`<strong>🤖 ${t.title}</strong><br>
        <span>${t.welcomeMessage}</span>
        <ul style="margin-top: 10px; padding-left: 20px;">
            <li>💬 ${t.features.chat}</li>
            <li>👤 ${t.features.character}</li>
            <li>📚 ${t.features.book}</li>
            <li>🖼️ ${t.features.pdf}</li>
        </ul>
        <div class="command-hint">${t.commandHint}</div>`, false);
}

// 处理快速操作
function handleQuickAction(action) {
    const t = translations[currentLanguage];
    let message = '';
    
    switch(action) {
        case 'generateName':
            message = currentLanguage === 'zh' ? 
                "请帮我生成一个角色姓名" : 
                "Пожалуйста, создайте имя персонажа";
            break;
        case 'generateCharacter':
            // 直接调用生成角色函数，不通过消息
            generateCharacterFromPreset('chinese_warrior');
            return;
        case 'generateBookTitle':
            message = currentLanguage === 'zh' ?
                "请帮我生成一个书名" :
                "Пожалуйста, создайте название книги";
            break;
        case 'chat':
            message = currentLanguage === 'zh' ?
                "我们来聊聊创意写作吧" :
                "Давайте поговорим о творческом письме";
            break;
    }
    
    document.getElementById('messageInput').value = message;
    sendMessage();
}

// 从预设生成角色
async function generateCharacterFromPreset(presetKey) {
    const preset = presets[presetKey];
    if (!preset) return;
    
    const t = translations[currentLanguage];
    const presetName = t.presets[presetKey];
    
    // 添加用户消息
    addMessage(`${currentLanguage === 'zh' ? '生成' : 'Создать'} ${presetName}`, true);
    
    // 显示输入指示器
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', {
            ...preset,
            language: currentLanguage
        });
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
        } else {
            const character = response.character;
            
            // 调试：打印响应数据
            console.log('角色生成响应:', response);
            
            let resultText = currentLanguage === 'zh' ?
                `🎨 <strong>角色生成成功！</strong><br>
                 👤 <strong>姓名：</strong>${character.name}<br>
                 📝 <strong>描述：</strong>${character.description ? character.description.substring(0, 200) + '...' : '无描述'}<br>` :
                `🎨 <strong>Персонаж создан успешно！</strong><br>
                 👤 <strong>Имя：</strong>${character.name}<br>
                 📝 <strong>Описание：</strong>${character.description ? character.description.substring(0, 200) + '...' : '无描述'}<br>`;
            
            // 添加PDF下载链接
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" target="_blank" class="download-link">📥 下载PDF档案</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" target="_blank" class="download-link">📥 Скачать PDF</a>`;
            } else {
                resultText += currentLanguage === 'zh' ?
                    `<span style="color: #666;">（PDF生成失败）</span>` :
                    `<span style="color: #666;">（PDF не создан）</span>`;
            }
            
            addMessage(resultText);
            
            // 添加图片显示
            if (response.image_url) {
                setTimeout(() => {
                    addMessage(`<img src="${API_BASE}${response.image_url}" class="character-image" alt="生成的角色图片">`);
                }, 100);
            } else {
                setTimeout(() => {
                    addMessage(currentLanguage === 'zh' ? 
                        `🖼️ <span style="color: #666;">（图片生成失败）</span>` :
                        `🖼️ <span style="color: #666;">（Изображение не создано）</span>`);
                }, 100);
            }
        }
    } catch (error) {
        addMessage(`❌ ${currentLanguage === 'zh' ? '请求失败：' : 'Запрос не удался：'} ${error.message}`);
    } finally {
        hideTypingIndicator();
    }
}

// 处理预设角色按钮点击
function handlePresetClick(presetKey) {
    generateCharacterFromPreset(presetKey);
}

// 处理按键事件
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 添加消息到聊天窗口
function addMessage(content, isUser = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${content}
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // 保存到历史记录
    messageHistory.push({
        content: content,
        isUser: isUser,
        time: time
    });
}

// 显示输入指示器
function showTypingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'message bot';
    indicatorDiv.id = 'typingIndicator';
    indicatorDiv.innerHTML = '<div class="typing-indicator">🤖 正在思考...</div>';
    messagesDiv.appendChild(indicatorDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 隐藏输入指示器
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// API调用函数
async function callApi(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API调用错误:', error);
        return { error: error.message };
    }
}

// 命令识别函数
function parseCommand(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('姓名') || lowerMessage.includes('名字') || 
        lowerMessage.includes('имя') || lowerMessage.includes('generate name')) {
        return 'name';
    } else if (lowerMessage.includes('角色') || lowerMessage.includes('人物') || 
               lowerMessage.includes('персонаж') || lowerMessage.includes('character')) {
        return 'character';
    } else if (lowerMessage.includes('书名') || lowerMessage.includes('标题') || 
               lowerMessage.includes('название') || lowerMessage.includes('book')) {
        return 'book';
    } else {
        return 'chat';
    }
}

// 提取参数函数
function extractParameters(message, command) {
    const params = {};
    
    if (command === 'name') {
        // 提取国家和奇幻类型
        const nationalityMatch = message.match(/(俄罗斯|英国|中国|美国|日本|德国|法国|意大利|西班牙|俄国|английск|китайск|американск|японск|германск|французск|итальянск|испанск)/i);
        const fantasyMatch = message.match(/(精灵|矮人|兽人|龙族|巫师|魔法师|эльф|гном|орк|дракон|волшебник|маг)/i);
        
        params.nationality = nationalityMatch ? nationalityMatch[0] : (currentLanguage === 'zh' ? '中国' : 'Китай');
        params.fantasy_type = fantasyMatch ? fantasyMatch[0] : '';
    } else if (command === 'character') {
        // 尝试匹配预设
        for (const [key, preset] of Object.entries(presets)) {
            const presetName = translations[currentLanguage].presets[key];
            if (message.includes(presetName)) {
                return { preset: key };
            }
        }
        
        // 如果没有匹配预设，使用默认值
        params.preset = 'chinese_warrior';
    }
    
    return params;
}

// 发送消息
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // 添加用户消息
    addMessage(message, true);
    messageInput.value = '';
    
    // 显示输入指示器
    showTypingIndicator();
    
    // 识别命令
    const command = parseCommand(message);
    const params = extractParameters(message, command);
    
    try {
        let response;
        
        switch(command) {
            case 'name':
                response = await callApi(`generate/name?nationality=${params.nationality}&fantasy_type=${params.fantasy_type}&language=${currentLanguage}`);
                if (response.error) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '生成姓名时出错：' : 'Ошибка при создании имени：'} ${response.error}`);
                } else {
                    const resultText = currentLanguage === 'zh' ?
                        `🎭 <strong>生成的姓名：</strong>${response.name}<br>🏙️ <strong>推荐城市：</strong>${response.city}` :
                        `🎭 <strong>Созданное имя：</strong>${response.name}<br>🏙️ <strong>Рекомендуемый город：</strong>${response.city}`;
                    addMessage(resultText);
                }
                break;
                
            case 'character':
                if (params.preset) {
                    const preset = presets[params.preset];
                    response = await callApi('generate/character', 'POST', {
                        ...preset,
                        language: currentLanguage
                    });
                } else {
                    // 使用默认预设
                    response = await callApi('generate/character', 'POST', {
                        ...presets.chinese_warrior,
                        language: currentLanguage
                    });
                }
                
                if (response.error) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
                } else {
                    const character = response.character;
                    let resultText = currentLanguage === 'zh' ?
                        `🎨 <strong>角色生成成功！</strong><br>
                         👤 <strong>姓名：</strong>${character.name}<br>
                         📝 <strong>描述：</strong>${character.description.substring(0, 200)}...<br>
                         <a href="${API_BASE}${response.pdf_url}" target="_blank" class="download-link">📥 下载PDF档案</a>` :
                        `🎨 <strong>Персонаж создан успешно！</strong><br>
                         👤 <strong>Имя：</strong>${character.name}<br>
                         📝 <strong>Описание：</strong>${character.description.substring(0, 200)}...<br>
                         <a href="${API_BASE}${response.pdf_url}" target="_blank" class="download-link">📥 Скачать PDF</a>`;
                    
                    addMessage(resultText);
                    
                    if (response.image_url) {
                        setTimeout(() => {
                            addMessage(`<img src="${API_BASE}${response.image_url}" class="character-image" alt="生成的角色图片">`);
                        }, 100);
                    }
                }
                break;
                
            case 'book':
                // 简单的书名生成逻辑
                const isGeneratingTitle = message.includes('书名') || message.includes('标题') || 
                                        message.includes('название') || message.includes('title');
                const bookRequest = isGeneratingTitle ? 
                    { description: message, language: currentLanguage } :
                    { title: message, language: currentLanguage };
                    
                response = await callApi('generate/booktitle', 'POST', bookRequest);
                
                if (response.error) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '处理书籍请求时出错：' : 'Ошибка при обработке запроса книги：'} ${response.error}`);
                } else {
                    const resultText = currentLanguage === 'zh' ?
                        `📚 <strong>${response.task === '生成书名' ? '生成的书名：' : '生成的描述：'}</strong>${response.result}` :
                        `📚 <strong>${response.task === '生成书名' ? 'Созданное название：' : 'Созданное описание：'}</strong>${response.result}`;
                    addMessage(resultText);
                }
                break;
                
            case 'chat':
            default:
                response = await callApi('chat', 'POST', { 
                    message: message, 
                    language: currentLanguage 
                });
                
                if (response.error) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '聊天时出错：' : 'Ошибка при чате：'} ${response.error}`);
                } else {
                    addMessage(`🤖 <strong>助手：</strong> ${response.response}`);
                }
                break;
        }
    } catch (error) {
        addMessage(`❌ ${currentLanguage === 'zh' ? '请求失败：' : 'Запрос не удался：'} ${error.message}`);
    } finally {
        hideTypingIndicator();
    }
}

// 初始化
function init() {
    updateUI();
    updateQuickActions();
    updatePresetButtons();
    updateCharacterForm();
    
    // 添加欢迎消息
    setTimeout(() => {
        const t = translations[currentLanguage];
        addMessage(`💡 <strong>${t.usageTips.title}</strong><br>
            • ${t.usageTips.character}<br>
            • ${t.usageTips.name}<br>
            • ${t.usageTips.book}<br>
            • ${t.usageTips.chat}`);
    }, 1000);
}

// 页面加载完成后初始化
window.onload = init;
