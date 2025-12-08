const API_BASE = 'http://localhost:8001/api';
let currentLanguage = 'ru';
let messageHistory = [];
let currentRequestController = null; // 用于中止当前请求
let isGenerating = false; // 标记是否正在生成

// 页面初始化
function initializePage() {
    // 设置语言选择器
    document.getElementById('lang').value = currentLanguage;
    
    // 更新界面文本
    updateUI();
    
    // 生成欢迎消息
    generateWelcomeMessage();
    
    // 更新快速操作按钮
    updateQuickActions();
    
    // 更新预设角色按钮
    updatePresetButtons();
    
    // 更新角色生成表单
    updateCharacterForm();
    
    // 加载聊天历史
    loadChatHistory();
}

// 更新界面文本
function updateUI() {
    const t = translations[currentLanguage];
    
    // 更新页面标题
    document.getElementById('pageTitle').textContent = `${t.title} - AI聊天机器人`;
    
    // 更新主标题和副标题
    document.getElementById('title').textContent = t.title;
    document.getElementById('subtitle').textContent = t.subtitle;
    
    // 更新按钮文本
    document.getElementById('newChatBtn').textContent = t.newChatBtn;
    document.getElementById('clearChatBtn').textContent = t.clearChatBtn;
    document.getElementById('saveChatBtn').textContent = t.saveChatBtn;
    document.getElementById('sidebarToggleBtn').textContent = t.sidebarToggleBtn;
    document.getElementById('sendBtn').textContent = t.sendBtn;
    document.getElementById('stopBtn').textContent = currentLanguage === 'zh' ? '停止' : 'Стоп';
    
    // 更新输入框占位符
    document.getElementById('messageInput').placeholder = t.messagePlaceholder;
    
    // 更新语言选择器选项
    const langSelect = document.getElementById('lang');
    langSelect.options[0].text = '中文';
    langSelect.options[1].text = 'Русский';
}

// 语言切换函数
function switchLanguage() {
    const langSelect = document.getElementById('lang');
    currentLanguage = langSelect.value;
    
    // 更新界面文本
    updateUI();
    
    // 重新生成欢迎消息
    generateWelcomeMessage();
    
    // 重新更新快速操作按钮
    updateQuickActions();
    
    // 重新更新预设角色按钮
    updatePresetButtons();
    
    // 重新更新角色生成表单
    updateCharacterForm();
    
    // 保存语言设置
    localStorage.setItem('chatLanguage', currentLanguage);
}

// 自动保存对话历史到本地存储
function autoSaveChatHistory() {
    if (messageHistory.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(messageHistory));
        localStorage.setItem('chatLanguage', currentLanguage);
    }
}

// 从本地存储加载对话历史
function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    const savedLanguage = localStorage.getItem('chatLanguage');
    
    if (savedHistory) {
        messageHistory = JSON.parse(savedHistory);
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            document.getElementById('lang').value = currentLanguage;
        } else {
            // 如果没有保存的语言设置，使用默认的俄语
            currentLanguage = 'ru';
            document.getElementById('lang').value = currentLanguage;
        }
        
        // 重新渲染消息
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.innerHTML = '';
        
        messageHistory.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.isUser ? 'user' : 'bot'}`;
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${msg.content}
                    <div class="message-time">${msg.time}</div>
                </div>
            `;
            messagesDiv.appendChild(messageDiv);
        });
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } else {
        // 如果没有历史记录，设置默认语言为俄语
        currentLanguage = 'ru';
        document.getElementById('lang').value = currentLanguage;
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

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
        sidebarToggleBtn: "自定义角色生成",
        sidebarToggleBtnActive: "隐藏角色生成",
        newChatConfirm: "确定要开始新的对话吗？当前对话内容将被清空。",
        noChatToSave: "没有聊天记录可保存",
        chatSaved: "聊天记录已保存",
        quickActions: {
            generateName: "随机生成角色姓名",
            generateCharacter: "随机生成完整角色",
            generateBookTitle: "随机生成书名",
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
        customCharacterTitle: "Создание собственного персонажа",
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

// 预设配置 - 多语言支持
const presets = {
    russian_knight: {
        zh: {
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
        ru: {
            gender: "мужчина",
            age: "35 лет",
            height: "185см",
            weight: "85кг",
            hair_color: "коричневый",
            eye_color: "серый",
            profession: "рыцарь",
            personality: "храбрый, верный, серьезный",
            nationality: "Россия",
            fantasy_race: "человек"
        }
    },
    english_wizard: {
        zh: {
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
        ru: {
            gender: "мужчина",
            age: "65 лет",
            height: "175см",
            weight: "70кг",
            hair_color: "белый",
            eye_color: "синий",
            profession: "волшебник",
            personality: "мудрый, таинственный, мягкий",
            nationality: "Англия",
            fantasy_race: "человек"
        }
    },
    chinese_warrior: {
        zh: {
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
        ru: {
            gender: "мужчина",
            age: "28 лет",
            height: "178см",
            weight: "75кг",
            hair_color: "черный",
            eye_color: "черный",
            profession: "воин",
            personality: "верный, храбрый, честный",
            nationality: "Китай",
            fantasy_race: "человек"
        }
    },
    elf_archer: {
        zh: {
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
        ru: {
            gender: "женщина",
            age: "150 лет",
            height: "180см",
            weight: "60кг",
            hair_color: "серебряный",
            eye_color: "зеленый",
            profession: "лучник",
            personality: "элегантный, проворный, таинственный",
            nationality: "Эльфийское королевство",
            fantasy_race: "эльф"
        }
    },
    dwarf_blacksmith: {
        zh: {
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
        },
        ru: {
            gender: "мужчина",
            age: "80 лет",
            height: "140см",
            weight: "90кг",
            hair_color: "красный",
            eye_color: "коричневый",
            profession: "кузнец",
            personality: "стойкий, честный, страстный",
            nationality: "Горный край дварфов",
            fantasy_race: "гном"
        }
    }
};

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

// 生成欢迎消息
function generateWelcomeMessage() {
    const t = translations[currentLanguage];
    const welcomeContent = document.getElementById('welcomeContent');
    
    let welcomeHTML = `<strong>🤖 ${t.title}</strong><br>`;
    welcomeHTML += `<span>${t.welcomeMessage}</span>`;
    welcomeHTML += `<ul style="margin-top: 10px; padding-left: 20px;">`;
    welcomeHTML += `<li>💬 ${t.features.chat}</li>`;
    welcomeHTML += `<li>👤 ${t.features.character}</li>`;
    welcomeHTML += `<li>📚 ${t.features.book}</li>`;
    welcomeHTML += `<li>🖼️ ${t.features.pdf}</li>`;
    welcomeHTML += `</ul>`;
    welcomeHTML += `<div class="command-hint">${t.commandHint}</div>`;
    
    welcomeContent.innerHTML = welcomeHTML;
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
    
    // 双语选项数据 - 修复：选项值也根据语言切换
    const hairColors = currentLanguage === 'zh' ? {
        '黑色': '黑色',
        '棕色': '棕色',
        '金色': '金色',
        '红色': '红色',
        '白色': '白色',
        '银色': '银色',
        '蓝色': '蓝色',
        '紫色': '紫色',
        '绿色': '绿色',
        '粉色': '粉色'
    } : {
        'Черный': 'Черный',
        'Коричневый': 'Коричневый',
        'Золотой': 'Золотой',
        'Красный': 'Красный',
        'Белый': 'Белый',
        'Серебряный': 'Серебряный',
        'Синий': 'Синий',
        'Фиолетовый': 'Фиолетовый',
        'Зеленый': 'Зеленый',
        'Розовый': 'Розовый'
    };
    
    const eyeColors = currentLanguage === 'zh' ? {
        '黑色': '黑色',
        '棕色': '棕色',
        '蓝色': '蓝色',
        '绿色': '绿色',
        '灰色': '灰色',
        '琥珀色': '琥珀色',
        '紫色': '紫色',
        '红色': '红色',
        '金色': '金色',
        '银色': '银色'
    } : {
        'Черный': 'Черный',
        'Коричневый': 'Коричневый',
        'Синий': 'Синий',
        'Зеленый': 'Зеленый',
        'Серый': 'Серый',
        'Янтарный': 'Янтарный',
        'Фиолетовый': 'Фиолетовый',
        'Красный': 'Красный',
        'Золотой': 'Золотой',
        'Серебряный': 'Серебряный'
    };
    
    const personalities = currentLanguage === 'zh' ? {
        '勇敢，忠诚': '勇敢，忠诚',
        '智慧，神秘': '智慧，神秘',
        '温和，优雅': '温和，优雅',
        '敏捷，坚韧': '敏捷，坚韧',
        '诚实，幽默': '诚实，幽默',
        '热情，冷静': '热情，冷静',
        '果断，谨慎': '果断，谨慎',
        '乐观，外向': '乐观，外向'
    } : {
        'Храбрый, верный': 'Храбрый, верный',
        'Мудрый, таинственный': 'Мудрый, таинственный',
        'Мягкий, элегантный': 'Мягкий, элегантный',
        'Проворный, стойкий': 'Проворный, стойкий',
        'Честный, юмористичный': 'Честный, юмористичный',
        'Страстный, спокойный': 'Страстный, спокойный',
        'Решительный, осторожный': 'Решительный, осторожный',
        'Оптимистичный, экстравертный': 'Оптимистичный, экстравертный'
    };
    
    const nationalities = currentLanguage === 'zh' ? {
        '中国': '中国',
        '俄罗斯': '俄罗斯',
        '英国': '英国',
        '日本': '日本',
        '法国': '法国',
        '德国': '德国',
        '意大利': '意大利',
        '西班牙': '西班牙',
        '美国': '美国',
        '印度': '印度',
        '埃及': '埃及',
        '希腊': '希腊',
        '巴西': '巴西',
        '墨西哥': '墨西哥',
        '韩国': '韩国',
        '泰国': '泰国',
        '澳大利亚': '澳大利亚',
        '加拿大': '加拿大'
    } : {
        'Китай': 'Китай',
        'Россия': 'Россия',
        'Великобритания': 'Великобритания',
        'Япония': 'Япония',
        'Франция': 'Франция',
        'Германия': 'Германия',
        'Италия': 'Италия',
        'Испания': 'Испания',
        'США': 'США',
        'Индия': 'Индия',
        'Египет': 'Египет',
        'Греция': 'Греция',
        'Бразилия': 'Бразилия',
        'Мексика': 'Мексика',
        'Корея': 'Корея',
        'Таиланд': 'Таиланд',
        'Австралия': 'Австралия',
        'Канада': 'Канада'
    };
    
    const professions = currentLanguage === 'zh' ? {
        '骑士': '骑士',
        '巫师': '巫师',
        '弓箭手': '弓箭手',
        '战士': '战士',
        '法师': '法师',
        '盗贼': '盗贼',
        '牧师': '牧师',
        '商人': '商人',
        '农民': '农民',
        '学者': '学者',
        '艺术家': '艺术家',
        '医生': '医生',
        '工程师': '工程师',
        '教师': '教师',
        '厨师': '厨师',
        '水手': '水手',
        '猎人': '猎人',
        '铁匠': '铁匠',
        '炼金术士': '炼金术士',
        '吟游诗人': '吟游诗人'
    } : {
        'Рыцарь': 'Рыцарь',
        'Волшебник': 'Волшебник',
        'Лучник': 'Лучник',
        'Воин': 'Воин',
        'Маг': 'Маг',
        'Вор': 'Вор',
        'Священник': 'Священник',
        'Торговец': 'Торговец',
        'Фермер': 'Фермер',
        'Ученый': 'Ученый',
        'Художник': 'Художник',
        'Доктор': 'Доктор',
        'Инженер': 'Инженер',
        'Учитель': 'Учитель',
        'Повар': 'Повар',
        'Моряк': 'Моряк',
        'Охотник': 'Охотник',
        'Кузнец': 'Кузнец',
        'Алхимик': 'Алхимик',
        'Бард': 'Бард'
    };
    
    const fantasyRaces = currentLanguage === 'zh' ? {
        '人类': '人类',
        '精灵': '精灵',
        '矮人': '矮人',
        '兽人': '兽人',
        '龙族': '龙族',
        '天使': '天使',
        '恶魔': '恶魔',
        '吸血鬼': '吸血鬼',
        '狼人': '狼人',
        '妖精': '妖精',
        '元素生物': '元素生物',
        '机械生命': '机械生命',
        '亡灵': '亡灵',
        '半人马': '半人马',
        '巨魔': '巨魔',
        '哥布林': '哥布林',
        '娜迦': '娜迦',
        '德鲁伊': '德鲁伊'
    } : {
        'Человек': 'Человек',
        'Эльф': 'Эльф',
        'Гном': 'Гном',
        'Орк': 'Орк',
        'Дракон': 'Дракон',
        'Ангел': 'Ангел',
        'Демон': 'Демон',
        'Вампир': 'Вампир',
        'Оборотень': 'Оборотень',
        'Фея': 'Фея',
        'Элементаль': 'Элементаль',
        'Механическое существо': 'Механическое существо',
        'Нежить': 'Нежить',
        'Кентавр': 'Кентавр',
        'Тролль': 'Тролль',
        'Гоблин': 'Гоблин',
        'Нага': 'Нага',
        'Друид': 'Друид'
    };
    
    const customText = currentLanguage === 'zh' ? '自定义...' : 'Свой вариант...';
    const customHairPlaceholder = currentLanguage === 'zh' ? '输入自定义发色' : 'Введите свой цвет волос';
    const customEyesPlaceholder = currentLanguage === 'zh' ? '输入自定义瞳色' : 'Введите свой цвет глаз';
    const customProfessionPlaceholder = currentLanguage === 'zh' ? '输入自定义职业' : 'Введите свою профессию';
    const customPersonalityPlaceholder = currentLanguage === 'zh' ? '输入自定义性格' : 'Введите свой характер';
    const customNationalityPlaceholder = currentLanguage === 'zh' ? '输入自定义国家' : 'Введите свою страну';
    const customRacePlaceholder = currentLanguage === 'zh' ? '输入自定义种族' : 'Введите свою расу';
    
    characterFormDiv.innerHTML = `
        <strong>${t.customCharacterTitle}:</strong>
        <div class="form-group">
            <label>${t.genderLabel}</label>
            <select id="customGender">
                <option value="${currentLanguage === 'zh' ? '男' : 'мужчина'}">${currentLanguage === 'zh' ? '男' : 'Мужской'}</option>
                <option value="${currentLanguage === 'zh' ? '女' : 'женщина'}">${currentLanguage === 'zh' ? '女' : 'Женский'}</option>
            </select>
        </div>
        <div class="form-group">
            <label>${t.ageLabel}</label>
            <input type="text" id="customAge" placeholder="${t.agePlaceholder}" value="${currentLanguage === 'zh' ? '20岁' : '20 лет'}">
        </div>
        <div class="form-group">
            <label>${t.heightLabel}</label>
            <input type="text" id="customHeight" placeholder="${t.heightPlaceholder}" value="${currentLanguage === 'zh' ? '175cm' : '175см'}">
        </div>
        <div class="form-group">
            <label>${t.weightLabel}</label>
            <input type="text" id="customWeight" placeholder="${t.weightPlaceholder}" value="${currentLanguage === 'zh' ? '70kg' : '70кг'}">
        </div>
        <div class="form-group">
            <label>${t.hairLabel}</label>
            <select id="customHair">
                ${Object.entries(hairColors).map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
                <option value="custom">${customText}</option>
            </select>
            <input type="text" id="customHairInput" placeholder="${customHairPlaceholder}" style="display: none; margin-top: 5px;">
        </div>
        <div class="form-group">
            <label>${t.eyesLabel}</label>
            <select id="customEyes">
                ${Object.entries(eyeColors).map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
                <option value="custom">${customText}</option>
            </select>
            <input type="text" id="customEyesInput" placeholder="${customEyesPlaceholder}" style="display: none; margin-top: 5px;">
        </div>
        <div class="form-group">
            <label>${t.professionLabel}</label>
            <select id="customProfession">
                ${Object.entries(professions).map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
                <option value="custom">${customText}</option>
            </select>
            <input type="text" id="customProfessionInput" placeholder="${customProfessionPlaceholder}" style="display: none; margin-top: 5px;">
        </div>
        <div class="form-group">
            <label>${t.personalityLabel}</label>
            <select id="customPersonality">
                ${Object.entries(personalities).map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
                <option value="custom">${customText}</option>
            </select>
            <input type="text" id="customPersonalityInput" placeholder="${customPersonalityPlaceholder}" style="display: none; margin-top: 5px;">
        </div>
        <div class="form-group">
            <label>${t.nationalityLabel}</label>
            <select id="customNationality">
                ${Object.entries(nationalities).map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
                <option value="custom">${customText}</option>
            </select>
            <input type="text" id="customNationalityInput" placeholder="${customNationalityPlaceholder}" style="display: none; margin-top: 5px;">
        </div>
        <div class="form-group">
            <label>${t.raceLabel}</label>
            <select id="customRace">
                ${Object.entries(fantasyRaces).map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
                <option value="custom">${customText}</option>
            </select>
            <input type="text" id="customRaceInput" placeholder="${customRacePlaceholder}" style="display: none; margin-top: 5px;">
        </div>
        <button class="generate-custom-btn" onclick="generateCustomCharacter()">${t.generateCustomBtn}</button>
    `;
    
    // 添加下拉框事件监听器
    setupCustomInputHandlers();
}

// 设置自定义输入处理
function setupCustomInputHandlers() {
    // 发色下拉框处理
    const hairSelect = document.getElementById('customHair');
    const hairInput = document.getElementById('customHairInput');
    hairSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            hairInput.style.display = 'block';
            hairInput.value = '';
        } else {
            hairInput.style.display = 'none';
            hairInput.value = '';
        }
    });
    
    // 瞳色下拉框处理
    const eyesSelect = document.getElementById('customEyes');
    const eyesInput = document.getElementById('customEyesInput');
    eyesSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            eyesInput.style.display = 'block';
            eyesInput.value = '';
        } else {
            eyesInput.style.display = 'none';
            eyesInput.value = '';
        }
    });
    
    // 职业下拉框处理
    const professionSelect = document.getElementById('customProfession');
    const professionInput = document.getElementById('customProfessionInput');
    professionSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            professionInput.style.display = 'block';
            professionInput.value = '';
        } else {
            professionInput.style.display = 'none';
            professionInput.value = '';
        }
    });
    
    // 性格下拉框处理
    const personalitySelect = document.getElementById('customPersonality');
    const personalityInput = document.getElementById('customPersonalityInput');
    personalitySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            personalityInput.style.display = 'block';
            personalityInput.value = '';
        } else {
            personalityInput.style.display = 'none';
            personalityInput.value = '';
        }
    });
    
    // 国籍下拉框处理
    const nationalitySelect = document.getElementById('customNationality');
    const nationalityInput = document.getElementById('customNationalityInput');
    nationalitySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            nationalityInput.style.display = 'block';
            nationalityInput.value = '';
        } else {
            nationalityInput.style.display = 'none';
            nationalityInput.value = '';
        }
    });
    
    // 种族下拉框处理
    const raceSelect = document.getElementById('customRace');
    const raceInput = document.getElementById('customRaceInput');
    raceSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            raceInput.style.display = 'block';
            raceInput.value = '';
        } else {
            raceInput.style.display = 'none';
            raceInput.value = '';
        }
    });
}

// 生成自定义角色
// 辅助函数：获取中文到俄文的翻译
function getRussianTranslation(chineseText) {
    // 发色翻译
    const hairColorTranslations = {
        '黑色': 'черные',
        '棕色': 'коричневые',
        '金色': 'золотые',
        '红色': 'рыжие',
        '白色': 'белые',
        '银色': 'серебристые',
        '蓝色': 'синие',
        '紫色': 'фиолетовые',
        '绿色': 'зеленые',
        '粉色': 'розовые'
    };
    
    // 瞳色翻译
    const eyeColorTranslations = {
        '黑色': 'черные',
        '棕色': 'коричневые',
        '蓝色': 'голубые',
        'зеленые': 'зеленые',
        'серые': 'серые',
        'янтарные': 'янтарные',
        'фиолетовые': 'фиолетовые',
        'красные': 'красные',
        'золотые': 'золотые',
        'серебристые': 'серебристые'
    };
    
    // 性格翻译
    const personalityTranslations = {
        '勇敢': 'храбрый',
        'мудрый': 'мудрый',
        'загадочный': 'загадочный',
        'мягкий': 'мягкий',
        'элегантный': 'элегантный',
        'проворный': 'проворный',
        'стойкий': 'стойкий',
        'честный': 'честный',
        'веселый': 'веселый',
        'серьезный': 'серьезный',
        'страстный': 'страстный',
        'спокойный': 'спокойный',
        'решительный': 'решительный',
        'осторожный': 'осторожный',
        'оптимистичный': 'оптимистичный',
        'открытый': 'открытый'
    };
    
    // страна
    const nationalityTranslations = {
        'Китай': 'Китай',
        'Россия': 'Россия',
        'Англия': 'Англия',
        'Япония': 'Япония',
        'Франция': 'Франция',
        'Германия': 'Германия',
        'Италия': 'Италия',
        'Испания': 'Испания',
        'США': 'США',
        'Индия': 'Индия',
        'Египет': 'Египет',
        'Греция': 'Греция',
        'Бразилия': 'Бразилия',
        'Мексика': 'Мексика',
        'Корея': 'Корея',
        'Таиланд': 'Таиланд',
        'Австралия': 'Австралия',
        'Канада': 'Канада'
    };
    
    // профессия
    const professionTranslations = {
        'рыцарь': 'рыцарь',
        'волшебник': 'волшебник',
        'лучник': 'лучник',
        'воин': 'воин',
        'маг': 'маг',
        'вор': 'вор',
        'священник': 'священник',
        'торговец': 'торговец',
        'фермер': 'фермер',
        'ученый': 'ученый',
        'художник': 'художник',
        'доктор': 'доктор',
        'инженер': 'инженер',
        'учитель': 'учитель',
        'повар': 'повар',
        'моряк': 'моряк',
        'охотник': 'охотник',
        'кузнец': 'кузнец',
        'алхимик': 'алхимик',
        'бард': 'бард'
    };
    
    // раса
    const raceTranslations = {
        'человек': 'человек',
        'эльф': 'эльф',
        'гном': 'гном',
        'орк': 'орк',
        'дракон': 'дракон',
        'ангел': 'ангел',
        'демон': 'демон',
        'вампир': 'вампир',
        'оборотень': 'оборотень',
        'фея': 'фея',
        'элементаль': 'элементаль',
        'механическое существо': 'механическое существо',
        'нежить': 'нежить',
        'кентавр': 'кентавр',
        'троль': 'троль',
        'гоблин': 'гоблин',
        'нага': 'нага',
        'друид': 'друид'
    };
    
    // попытка найти перевод
    return hairColorTranslations[chineseText] || 
           eyeColorTranslations[chineseText] || 
           personalityTranslations[chineseText] || 
           nationalityTranslations[chineseText] || 
           professionTranslations[chineseText] || 
           raceTranslations[chineseText] || 
           chineseText; // если перевод не найден, вернуть исходный текст
}

// 扩展翻译映射表，添加更多中文词汇的俄语翻译
function getExtendedRussianTranslation(chineseText) {
    // 扩展的翻译映射表
    const extendedTranslations = {
        // 性别
        '男': 'мужчина',
        '女': 'женщина',
        
        // 颜色
        '黑色': 'черный',
        '白色': 'белый',
        '红色': 'красный',
        '蓝色': 'синий',
        '绿色': 'зеленый',
        '黄色': 'желтый',
        '紫色': 'фиолетовый',
        '粉色': 'розовый',
        '棕色': 'коричневый',
        '灰色': 'серый',
        '金色': 'золотой',
        '银色': 'серебряный',
        '橙色': 'оранжевый',
        
        // 国家
        '中国': 'Китай',
        '俄罗斯': 'Россия',
        '英国': 'Великобритания',
        '美国': 'США',
        '法国': 'Франция',
        '德国': 'Германия',
        '日本': 'Япония',
        '韩国': 'Корея',
        '印度': 'Индия',
        '意大利': 'Италия',
        '西班牙': 'Испания',
        '加拿大': 'Канада',
        '澳大利亚': 'Австралия',
        '巴西': 'Бразилия',
        '墨西哥': 'Мексика',
        '埃及': 'Египет',
        '希腊': 'Греция',
        '泰国': 'Таиланд',
        
        // 职业
        '骑士': 'рыцарь',
        '战士': 'воин',
        '法师': 'маг',
        '弓箭手': 'лучник',
        '牧师': 'жрец',
        '盗贼': 'вор',
        '商人': 'торговец',
        '农民': 'фермер',
        '学者': 'ученый',
        '艺术家': 'художник',
        '医生': 'врач',
        '工程师': 'инженер',
        '教师': 'учитель',
        '厨师': 'повар',
        '水手': 'моряк',
        '猎人': 'охотник',
        '铁匠': 'кузнец',
        '炼金术士': 'алхимик',
        '吟游诗人': 'бард',
        '士兵': 'солдат',
        '王子': 'принц',
        '公主': 'принцесса',
        '国王': 'король',
        '女王': 'королева',
        '贵族': 'дворянин',
        '刺客': 'убийца',
        '僧侣': 'монах',
        '巫师': 'волшебник',
        '德鲁伊': 'друид',
        '圣骑士': 'паладин',
        '死灵法师': 'некромант',
        
        // 性格
        '勇敢': 'храбрый',
        '聪明': 'умный',
        '善良': 'добрый',
        '温和': 'мягкий',
        '优雅': 'элегантный',
        '热情': 'страстный',
        '冷静': 'спокойный',
        '严肃': 'серьезный',
        '幽默': 'юмористический',
        '忠诚': 'верный',
        '诚实': 'честный',
        '乐观': 'оптимистичный',
        '悲观': 'пессимистичный',
        '内向': 'интроверт',
        '外向': 'экстраверт',
        '神秘': 'таинственный',
        '果断': 'решительный',
        '谨慎': 'осторожный',
        '开放': 'открытый',
        '保守': 'консервативный',
        '活泼': 'живой',
        '安静': 'тихий',
        '坚强': 'сильный',
        '脆弱': 'хрупкий',
        '独立': 'независимый',
        '依赖': 'зависимый',
        
        // 种族
        '人类': 'человек',
        '精灵': 'эльф',
        '矮人': 'гном',
        '兽人': 'орк',
        '龙族': 'дракон',
        '天使': 'ангел',
        '恶魔': 'демон',
        '吸血鬼': 'вампир',
        '狼人': 'оборотень',
        '妖精': 'фея',
        '元素': 'элементаль',
        '机械': 'механический',
        '亡灵': 'нежить',
        '半人马': 'кентавр',
        '巨魔': 'тролль',
        '哥布林': 'гоблин',
        '娜迦': 'нага',
        '德鲁伊': 'друид',
        '半精灵': 'полуэльф',
        '半兽人': 'полуорк',
        '地精': 'гоблин',
        '蜥蜴人': 'ящер',
        '鸟人': 'птицечеловек',
        '鱼人': 'рыбочеловек',
        
        // 单位
        '岁': 'лет',
        'cm': 'см',
        'kg': 'кг',
        '米': 'метр',
        '厘米': 'сантиметр',
        '公斤': 'килограмм'
    };
    
    // 首先尝试原有的翻译表
    const originalTranslation = getRussianTranslation(chineseText);
    if (originalTranslation !== chineseText) {
        return originalTranslation;
    }
    
    // 然后尝试扩展翻译表
    return extendedTranslations[chineseText] || chineseText;
}

async function generateCustomCharacter() {
    // Получение значений формы, обработка пользовательского ввода
    const getFieldValue = (selectId, inputId) => {
        const select = document.getElementById(selectId);
        const input = document.getElementById(inputId);
        return select.value === 'custom' ? input.value : select.value;
    };
    
    // Получение исходных значений
    const rawValues = {
        gender: document.getElementById('customGender').value,
        age: document.getElementById('customAge').value,
        height: document.getElementById('customHeight').value,
        weight: document.getElementById('customWeight').value,
        hair_color: getFieldValue('customHair', 'customHairInput'),
        eye_color: getFieldValue('customEyes', 'customEyesInput'),
        profession: getFieldValue('customProfession', 'customProfessionInput'),
        personality: getFieldValue('customPersonality', 'customPersonalityInput'),
        nationality: getFieldValue('customNationality', 'customNationalityInput'),
        fantasy_race: getFieldValue('customRace', 'customRaceInput')
    };
    
    // 根据当前语言决定使用原始值还是翻译后的值
    const request = currentLanguage === 'zh' ? {
        gender: rawValues.gender,
        age: rawValues.age,
        height: rawValues.height,
        weight: rawValues.weight,
        hair_color: rawValues.hair_color,
        eye_color: rawValues.eye_color,
        profession: rawValues.profession,
        personality: rawValues.personality,
        nationality: rawValues.nationality,
        fantasy_race: rawValues.fantasy_race,
        language: currentLanguage
    } : {
        // 俄语模式下使用扩展翻译函数
        gender: getExtendedRussianTranslation(rawValues.gender),
        age: rawValues.age.replace('岁', ' лет').replace('cm', ' см').replace('kg', ' кг'),
        height: rawValues.height.replace('cm', ' см'),
        weight: rawValues.weight.replace('kg', ' кг'),
        hair_color: getExtendedRussianTranslation(rawValues.hair_color),
        eye_color: getExtendedRussianTranslation(rawValues.eye_color),
        profession: getExtendedRussianTranslation(rawValues.profession),
        personality: getExtendedRussianTranslation(rawValues.personality),
        nationality: getExtendedRussianTranslation(rawValues.nationality),
        fantasy_race: getExtendedRussianTranslation(rawValues.fantasy_race),
        language: currentLanguage
    };
    
    // Создание подробного текста запроса, содержащего все параметры
    // Для русскоязычной среды подготовка переведенных значений
    const localizedRequest = {...request};
    
    if (currentLanguage === 'ru') {
        // перевод пола
        const genderTranslations = {
            '男': 'мужчина',
            '女': 'женщина'
        };
        
        // перевод цвета волос
        const hairColorTranslations = {
            'черные': 'черные',
            'коричневые': 'коричневые',
            'золотые': 'золотые',
            'рыжие': 'рыжие',
            'белые': 'белые',
            'серебристые': 'серебристые',
            'синие': 'синие',
            'фиолетовые': 'фиолетовые',
            'зеленые': 'зеленые',
            'розовые': 'розовые'
        };
        
        // перевод цвета глаз
        const eyeColorTranslations = {
            'черные': 'черные',
            'коричневые': 'коричневые',
            'голубые': 'голубые',
            'зеленые': 'зеленые',
            'серые': 'серые',
            'янтарные': 'янтарные',
            'фиолетовые': 'фиолетовые',
            'красные': 'красные',
            'золотые': 'золотые',
            'серебристые': 'серебристые'
        };
        
        // перевод характера
        const personalityTranslations = {
            'храбрый': 'храбрый',
            'мудрый': 'мудрый',
            'загадочный': 'загадочный',
            'мягкий': 'мягкий',
            'элегантный': 'элегантный',
            'проворный': 'проворный',
            'стойкий': 'стойкий',
            'честный': 'честный',
            'веселый': 'веселый',
            'серьезный': 'серьезный',
            'страстный': 'страстный',
            'спокойный': 'спокойный',
            'решительный': 'решительный',
            'осторожный': 'осторожный',
            'оптимистичный': 'оптимистичный',
            'открытый': 'открытый',
            '，': ', ',
            ',': ', '
        };
        
        // страна
        const nationalityTranslations = {
            'Китай': 'Китай',
            'Россия': 'Россия',
            'Англия': 'Англия',
            'Япония': 'Япония',
            'Франция': 'Франция',
            'Германия': 'Германия',
            'Италия': 'Италия',
            'Испания': 'Испания',
            'США': 'Америка',
            'Индия': 'Индия',
            'Египет': 'Египет',
            'Греция': 'Греция',
            'Бразилия': 'Бразилия',
            'Мексика': 'Мексика',
            'Корея': 'Корея',
            'Таиланд': 'Таиланд',
            'Австралия': 'Австралия',
            'Канада': 'Канада'
        };
        
        // профессия
        const professionTranslations = {
            'рыцарь': 'рыцарь',
            'волшебник': 'волшебник',
            'лучник': 'лучник',
            'воин': 'воин',
            'маг': 'маг',
            'вор': 'вор',
            'священник': 'священник',
            'торговец': 'торговец',
            'фермер': 'фермер',
            'ученый': 'ученый',
            'художник': 'художник',
            'доктор': 'доктор',
            'инженер': 'инженер',
            'учитель': 'учитель',
            'повар': 'повар',
            'моряк': 'моряк',
            'охотник': 'охотник',
            'кузнец': 'кузнец',
            'алхимик': 'алхимик',
            'бард': 'бард'
        };
        
        // раса
        const raceTranslations = {
            'человек': 'человек',
            'эльф': 'эльф',
            'гном': 'гном',
            'орк': 'орк',
            'дракон': 'дракон',
            'ангел': 'ангел',
            'демон': 'демон',
            'вампир': 'вампир',
            'оборотень': 'оборотень',
            'фея': 'фея',
            'элементаль': 'элементаль',
            'механическое существо': 'механическое существо',
            'нежить': 'нежить',
            'кентавр': 'кентавр',
            'троль': 'троль',
            'гоблин': 'гоблин',
            'нага': 'нага',
            'друид': 'друид'
        };
        
        // перевод пола
        localizedRequest.gender = genderTranslations[request.gender] || request.gender;
        localizedRequest.hair_color = hairColorTranslations[request.hair_color] || request.hair_color;
        localizedRequest.eye_color = eyeColorTranslations[request.eye_color] || request.eye_color;
        localizedRequest.nationality = nationalityTranslations[request.nationality] || request.nationality;
        localizedRequest.profession = professionTranslations[request.profession] || request.profession;
        localizedRequest.fantasy_race = raceTranslations[request.fantasy_race] || request.fantasy_race;
        
        // перевод характера (может быть несколько характеристик)
        if (request.personality.includes('，') || request.personality.includes(',')) {
            const personalities = request.personality.replace(/，/g, ',').split(',');
            const translatedPersonalities = personalities.map(p => {
                const trimmed = p.trim();
                return personalityTranslations[trimmed] || trimmed;
            });
            localizedRequest.personality = translatedPersonalities.join(', ');
        } else {
            localizedRequest.personality = personalityTranslations[request.personality] || request.personality;
        }
        
        // перевод единиц измерения возраста, роста и веса
        localizedRequest.age = request.age.replace('лет', ' лет');
        localizedRequest.height = request.height.replace('см', 'см');
        localizedRequest.weight = request.weight.replace('кг', 'кг');
    }
    
    const promptText = currentLanguage === 'zh' ? 
        `生成一个${request.nationality}的${request.profession}角色：
        - 性别：${request.gender}
        - 年龄：${request.age}
        - 身高：${request.height}，体重：${request.weight}
        - 发色：${request.hair_color}，瞳色：${request.eye_color}
        - 性格：${request.personality}
        - 种族：${request.fantasy_race}` :
        `Создать персонажа ${getExtendedRussianTranslation(request.nationality)} ${getExtendedRussianTranslation(request.profession)}：
        - Пол: ${getExtendedRussianTranslation(request.gender)}
        - Возраст: ${request.age.replace('岁', ' лет').replace('cm', ' см').replace('kg', ' кг')}
        - Рост: ${request.height.replace('cm', ' см')}, Вес: ${request.weight.replace('kg', ' кг')}
        - Цвет волос: ${getExtendedRussianTranslation(request.hair_color)}, Цвет глаз: ${getExtendedRussianTranslation(request.eye_color)}
        - Характер: ${getExtendedRussianTranslation(request.personality)}
        - Раса: ${getExtendedRussianTranslation(request.fantasy_race)}`;
    
    // Добавление сообщения пользователя
    addMessage(promptText, true);
    
    // Отображение индикатора ввода
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', request);
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
        } else {
            const character = response.character;
            
            // Отладка: вывод данных ответа
            console.log('Создание персонажа:', response);
            
            // Проверка наличия объекта character
            if (!character) {
                addMessage(`❌ ${currentLanguage === 'zh' ? 'Роль не создана: неверный формат данных' : 'Ошибка создания персонажа: неверный формат данных'}`);
                return;
            }
            
                    let resultText = currentLanguage === 'zh' ?
                        `🎨 <strong>角色生成成功！</strong><br>
                         👤 <strong>姓名：</strong>${character.name || '未知'}<br>
                         📝 <strong>描述：</strong>${character.description || '无描述'}<br>` :
                        `🎨 <strong>Персонаж создан успешно！</strong><br>
                         👤 <strong>Имя：</strong>${character.name || 'Неизвестно'}<br>
                         📝 <strong>Описание：</strong>${character.description || '无描述'}<br>`;
            
            // Добавление ссылки для скачивания PDF
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 下载PDF档案</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF</a>`;
            } else {
                resultText += currentLanguage === 'zh' ?
                    `<span style="color: #666;">（PDF生成失败）</span>` :
                    `<span style="color: #666;">（PDF не создан）</span>`;
            }
            
            addMessage(resultText);
            
            // Добавление изображения
            if (response.image_url) {
                setTimeout(() => {
                    addMessage(`<img src="${API_BASE}${response.image_url}" class="character-image" alt="Сгенерированное изображение персонажа">`);
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
        addMessage(`❌ ${currentLanguage === 'zh' ? 'Запрос не удался：' : 'Запрос не удался：'} ${error.message}`);
    } finally {
        hideTypingIndicator();
    }
}

// Новый диалог
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
    
    // 清除本地存储
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatLanguage');
    
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
            // 随机选择国家和奇幻种族
            const nationalities = currentLanguage === 'zh' ? 
                ['中国', '俄罗斯', '英国', '日本', '法国', '德国', '意大利', '西班牙', '美国', '印度'] :
                ['Китай', 'Россия', 'Англия', 'Япония', 'Франция', 'Германия', 'Италия', 'Испания', 'США', 'Индия'];
                
            const fantasyTypes = currentLanguage === 'zh' ?
                ['精灵', '矮人', '兽人', '龙族', '巫师', '魔法师', '吸血鬼', '狼人', '天使', '恶魔'] :
                ['эльф', 'гном', 'орк', 'дракон', 'волшебник', 'маг', 'вампир', 'оборотень', 'ангел', 'демон'];
            
            const randomNationality = nationalities[Math.floor(Math.random() * nationalities.length)];
            const randomFantasyType = Math.random() > 0.5 ? fantasyTypes[Math.floor(Math.random() * fantasyTypes.length)] : '';
            
            message = currentLanguage === 'zh' ? 
                `请帮我生成一个${randomNationality}${randomFantasyType ? '的' + randomFantasyType : ''}角色姓名` : 
                `Пожалуйста, создайте имя персонажа ${randomNationality}${randomFantasyType ? ' ' + randomFantasyType : ''}`;
            break;
            
        case 'generateCharacter':
            // 创建真正随机的角色，让AI自由发挥
            generateRandomCharacter();
            return;
            
        case 'generateBookTitle':
            // 随机选择题材和风格
            const genres = currentLanguage === 'zh' ? 
                ['奇幻', '科幻', '爱情', '悬疑', '历史', '武侠', '都市', '恐怖', '冒险', '推理'] :
                ['фэнтези', 'научная фантастика', 'романтика', 'триллер', 'исторический', 'боевик', 'городской', 'ужасы', 'приключения', 'детектив'];
                
            const styles = currentLanguage === 'zh' ? 
                ['史诗级', '浪漫', '惊悚', '幽默', '黑暗', '治愈', '热血', '悬疑', '温馨', '惊险'] :
                ['эпический', 'романтический', 'захватывающий', 'юмористический', 'темный', 'трогательный', 'динамичный', 'интригующий', 'уютный', 'зловещий'];
            
            const randomGenre = genres[Math.floor(Math.random() * genres.length)];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            
            message = currentLanguage === 'zh' ?
                `请帮我生成一个${randomStyle}的${randomGenre}小说书名` :
                `Пожалуйста, создайте ${randomStyle} ${randomGenre} название романа`;
            break;
            
        case 'chat':
            // 随机选择聊天话题
            const topics = [
                "给我一些创意写作的建议",
                "如何塑造一个令人难忘的角色？",
                "小说开头应该怎么写才能吸引读者？",
                "如何构建一个完整的世界观？",
                "对话写作有什么技巧？"
            ];
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            
            message = currentLanguage === 'zh' ?
                randomTopic :
                "Давайте поговорим о творческом письме";
            break;
    }
    
    document.getElementById('messageInput').value = message;
    sendMessage();
}

// 生成真正随机的角色
async function generateRandomCharacter() {
    const t = translations[currentLanguage];
    
    // 随机生成各种角色属性 - 根据语言切换
    const genders = currentLanguage === 'zh' ? ['男', '女'] : ['мужчина', 'женщина'];
    const ages = currentLanguage === 'zh' ? 
        ['18岁', '22岁', '28岁', '35岁', '45岁', '60岁', '150岁', '300岁'] : 
        ['18 лет', '22 лет', '28 лет', '35 лет', '45 лет', '60 лет', '150 лет', '300 лет'];
    const heights = currentLanguage === 'zh' ? 
        ['160cm', '170cm', '175cm', '180cm', '185cm', '190cm', '200cm', '140cm'] : 
        ['160см', '170см', '175см', '180см', '185см', '190см', '200см', '140см'];
    const weights = currentLanguage === 'zh' ? 
        ['50kg', '60kg', '65kg', '70kg', '75kg', '80kg', '85kg', '90kg'] : 
        ['50кг', '60кг', '65кг', '70кг', '75кг', '80кг', '85кг', '90кг'];
    const hairColors = currentLanguage === 'zh' ? 
        ['黑色', '棕色', '金色', '红色', '白色', '银色', '蓝色', '紫色', '绿色'] : 
        ['черный', 'коричневый', 'золотой', 'красный', 'белый', 'серебряный', 'синий', 'фиолетовый', 'зеленый'];
    const eyeColors = currentLanguage === 'zh' ? 
        ['黑色', '棕色', '蓝色', '绿色', '灰色', '琥珀色', '紫色', '红色', '金色'] : 
        ['черный', 'коричневый', 'синий', 'зеленый', 'серый', 'янтарный', 'фиолетовый', 'красный', 'золотой'];
    const professions = currentLanguage === 'zh' ? 
        ['骑士', '巫师', '弓箭手', '战士', '法师', '盗贼', '牧师', '商人', '农民', '学者', '艺术家', '医生'] : 
        ['рыцарь', 'волшебник', 'лучник', 'воин', 'маг', 'вор', 'священник', 'торговец', 'фермер', 'ученый', 'художник', 'врач'];
    const personalities = currentLanguage === 'zh' ? 
        ['勇敢', '智慧', '神秘', '温和', '优雅', '敏捷', '坚韧', '诚实', '幽默', '严肃', '热情', '冷静'] : 
        ['храбрый', 'умный', 'таинственный', 'мягкий', 'элегантный', 'проворный', 'стойкий', 'честный', 'юмористический', 'серьезный', 'страстный', 'спокойный'];
    const nationalities = currentLanguage === 'zh' ? 
        ['中国', '俄罗斯', '英国', '日本', '法国', '德国', '意大利', '西班牙', '美国', '印度', '埃及', '希腊'] : 
        ['Китай', 'Россия', 'Великобритания', 'Япония', 'Франция', 'Германия', 'Италия', 'Испания', 'США', 'Индия', 'Египет', 'Греция'];
    const fantasyRaces = currentLanguage === 'zh' ? 
        ['人类', '精灵', '矮人', '兽人', '龙族', '天使', '恶魔', '吸血鬼', '狼人', '妖精', '元素生物', '机械生命'] : 
        ['человек', 'эльф', 'гном', 'орк', 'дракон', 'ангел', 'демон', 'вампир', 'оборотень', 'фея', 'элементаль', 'механическое существо'];
    
    // 随机选择属性
    const randomRequest = {
        gender: genders[Math.floor(Math.random() * genders.length)],
        age: ages[Math.floor(Math.random() * ages.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
        weight: weights[Math.floor(Math.random() * weights.length)],
        hair_color: hairColors[Math.floor(Math.random() * hairColors.length)],
        eye_color: eyeColors[Math.floor(Math.random() * eyeColors.length)],
        profession: professions[Math.floor(Math.random() * professions.length)],
        personality: Array.from({length: 3}, () => personalities[Math.floor(Math.random() * personalities.length)]).join('，'),
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        fantasy_race: Math.random() > 0.3 ? fantasyRaces[Math.floor(Math.random() * fantasyRaces.length)] : '',
        language: currentLanguage
    };
    
    // 创建提示文本
    const promptText = currentLanguage === 'zh' ? 
        `生成一个${randomRequest.nationality}的${randomRequest.fantasy_race ? randomRequest.fantasy_race + '' : ''}${randomRequest.profession}角色：
        - 性别：${randomRequest.gender}
        - 年龄：${randomRequest.age}
        - 身高：${randomRequest.height}，体重：${randomRequest.weight}
        - 发色：${randomRequest.hair_color}，瞳色：${randomRequest.eye_color}
        - 性格：${randomRequest.personality}
        ${randomRequest.fantasy_race ? '- 种族：' + randomRequest.fantasy_race : ''}` :
        `Создать персонажа ${randomRequest.nationality} ${randomRequest.fantasy_race ? randomRequest.fantasy_race + ' ' : ''}${randomRequest.profession}：
        - Пол: ${randomRequest.gender}
        - Возраст: ${randomRequest.age}
        - Рост: ${randomRequest.height}, Вес: ${randomRequest.weight}
        - Цвет волос: ${randomRequest.hair_color}, Цвет глаз: ${randomRequest.eye_color}
        - Характер: ${randomRequest.personality}
        ${randomRequest.fantasy_race ? '- Раса: ' + randomRequest.fantasy_race : ''}`;
    
    // 添加用户消息
    addMessage(promptText, true);
    
    // 显示输入指示器
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', randomRequest);
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
        } else {
            const character = response.character;
            
            // 检查character对象是否存在
            if (!character) {
                addMessage(`❌ ${currentLanguage === 'zh' ? '角色生成失败：返回数据格式错误' : 'Ошибка создания персонажа：неверный формат данных'}`);
                return;
            }
            
            let resultText = currentLanguage === 'zh' ?
                `🎨 <strong>随机角色生成成功！</strong><br>
                 👤 <strong>姓名：</strong>${character.name || '未知'}<br>
                 📝 <strong>描述：</strong>${character.description || '无描述'}<br>` :
                `🎨 <strong>Случайный персонаж создан успешно！</strong><br>
                 👤 <strong>Имя：</strong>${character.name || 'Неизвестно'}<br>
                 📝 <strong>Описание：</strong>${character.description || '无描述'}<br>`;
            
            // 添加PDF下载链接
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 下载PDF档案</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF</a>`;
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

// 从预设生成角色
async function generateCharacterFromPreset(presetKey) {
    const preset = presets[presetKey];
    if (!preset) return;
    
    const t = translations[currentLanguage];
    const presetName = t.presets[presetKey];
    
    // 根据当前语言选择预设数据
    const presetData = preset[currentLanguage] || preset['zh']; // 默认使用中文
    
    // 添加用户消息
    addMessage(`${currentLanguage === 'zh' ? '生成' : 'Создать'} ${presetName}`, true);
    
    // 显示输入指示器
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', {
            ...presetData,
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
                 📝 <strong>描述：</strong>${character.description || '无描述'}<br>` :
                `🎨 <strong>Персонаж создан успешно！</strong><br>
                 👤 <strong>Имя：</strong>${character.name}<br>
                 📝 <strong>Описание：</strong>${character.description || '无描述'}<br>`;
            
            // 添加PDF下载链接
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 下载PDF档案</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF</a>`;
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
    
    // 自动保存到本地存储
    autoSaveChatHistory();
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
    } else if (lowerMessage.includes('书名') || lowerMessage.includes('标题') || 
               lowerMessage.includes('название') || lowerMessage.includes('book')) {
        return 'book';
    } else if (isCharacterDescription(message)) {
        return 'character';
    } else {
        return 'chat';
    }
}

// 智能判断是否为角色描述
function isCharacterDescription(message) {
    const lowerMessage = message.toLowerCase();
    
    // 检查文本长度（角色描述通常比较详细）
    if (message.length < 20) {
        return false;
    }
    
    // 检查是否包含角色特征关键词
    const characterKeywords = [
        // 性别相关
        '男', '女', '男性', '女性', '性别', 'мужчин', 'женщин', 'пол',
        // 年龄相关
        '岁', '年龄', '年', 'возраст', 'лет',
        // 外貌特征
        '身高', '体重', '发色', '瞳色', '眼睛', '头发', '外表', '外貌',
        'рост', 'вес', 'волос', 'глаз', 'внешность',
        // 职业
        '骑士', '巫师', '武士', '弓箭手', '铁匠', '战士', '法师', '盗贼',
        'рыцарь', 'волшебник', 'воин', 'лучник', 'кузнец', 'воин', 'маг', 'вор',
        // 性格
        '勇敢', '忠诚', '智慧', '神秘', '温和', '优雅', '敏捷', '坚韧', '诚实',
        'храбрый', 'верный', 'мудрый', 'таинственный', 'мягкий', 'элегантный', 'проворный', 'стойкий', 'честный',
        // 种族
        '人类', '精灵', '矮人', '兽人', '龙族', 'человек', 'эльф', 'гном', 'орк', 'дракон'
    ];
    
    // 计算关键词匹配数量
    let keywordCount = 0;
    characterKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword.toLowerCase())) {
            keywordCount++;
        }
    });
    
    // 如果匹配到足够多的关键词，认为是角色描述
    return keywordCount >= 2;
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

// 停止生成
function stopGeneration() {
    if (currentRequestController && isGenerating) {
        currentRequestController.abort();
        currentRequestController = null;
        isGenerating = false;
        
        // 使用统一的函数管理按钮状态
        toggleButtons(false);
        
        // 隐藏输入指示器
        hideTypingIndicator();
        
        // 添加停止提示消息
        const t = translations[currentLanguage];
        addMessage(`⏹️ <strong>${currentLanguage === 'zh' ? '生成已停止' : 'Генерация остановлена'}</strong>`);
    }
}

// 显示/隐藏按钮
function toggleButtons(showStop) {
    const sendBtn = document.getElementById('sendBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (showStop) {
        sendBtn.classList.add('hide');
        stopBtn.classList.add('show');
    } else {
        sendBtn.classList.remove('hide');
        stopBtn.classList.remove('show');
    }
}

// 修改API调用函数以支持中止
async function callApi(endpoint, method = 'GET', data = null) {
    // 创建新的AbortController
    currentRequestController = new AbortController();
    isGenerating = true;
    
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: currentRequestController.signal
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE}/${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('请求已被中止');
            return { error: '请求已中止' };
        }
        throw error;
    } finally {
        currentRequestController = null;
        isGenerating = false;
    }
}

// 发送消息
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // 添加用户消息
    addMessage(message, true);
    messageInput.value = '';
    
    // 显示停止按钮，隐藏发送按钮
    toggleButtons(true);
    
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
                // 智能识别的角色描述，直接使用用户输入作为描述
                response = await callApi('generate/character', 'POST', {
                    description: message,
                    language: currentLanguage
                });
                
                if (response.error) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
                } else {
                    const character = response.character;
                    
                    // 检查character对象是否存在
                    if (!character) {
                        addMessage(`❌ ${currentLanguage === 'zh' ? '角色生成失败：返回数据格式错误' : 'Ошибка создания персонажа：неверный формат данных'}`);
                        return;
                    }
                    
                    let resultText = currentLanguage === 'zh' ?
                        `🎨 <strong>角色生成成功！</strong><br>
                         👤 <strong>姓名：</strong>${character.name || '未知'}<br>
                         📝 <strong>描述：</strong>${character.description || '无描述'}<br>
                         <a href="${API_BASE}${response.pdf_url}" class="download-link">📥 下载PDF档案</a>` :
                        `🎨 <strong>Персонаж создан успешно！</strong><br>
                         👤 <strong>Имя：</strong>${character.name || 'Неизвестно'}<br>
                         📝 <strong>Описание：</strong>${character.description || '无描述'}<br>
                         <a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF</a>`;
                    
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
        // 隐藏停止按钮，显示发送按钮
        toggleButtons(false);
        hideTypingIndicator();
    }
}

// 初始化
function init() {
    // 首先更新UI元素
    updateUI();
    updateQuickActions();
    updatePresetButtons();
    updateCharacterForm();
    
    // 然后加载保存的对话历史
    loadChatHistory();
    
    // 如果没有历史记录，添加欢迎消息
    if (messageHistory.length === 0) {
        setTimeout(() => {
            const t = translations[currentLanguage];
            addMessage(`💡 <strong>${t.usageTips.title}</strong><br>
                • ${t.usageTips.character}<br>
                • ${t.usageTips.name}<br>
                • ${t.usageTips.book}<br>
                • ${t.usageTips.chat}`);
        }, 1000);
    }
}

// 处理键盘事件（回车键发送消息）
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 修改自定义角色生成函数以支持停止功能
async function generateCustomCharacter() {
    // 获取表单值，处理自定义输入
    const getFieldValue = (selectId, inputId) => {
        const select = document.getElementById(selectId);
        const input = document.getElementById(inputId);
        return select.value === 'custom' ? input.value : select.value;
    };
    
    const request = {
        gender: document.getElementById('customGender').value,
        age: document.getElementById('customAge').value,
        height: document.getElementById('customHeight').value,
        weight: document.getElementById('customWeight').value,
        hair_color: getFieldValue('customHair', 'customHairInput'),
        eye_color: getFieldValue('customEyes', 'customEyesInput'),
        profession: getFieldValue('customProfession', 'customProfessionInput'),
        personality: getFieldValue('customPersonality', 'customPersonalityInput'),
        nationality: getFieldValue('customNationality', 'customNationalityInput'),
        fantasy_race: getFieldValue('customRace', 'customRaceInput'),
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
    
    // 显示停止 кнопку,隐藏发送 кнопку
    toggleButtons(true);
    
    // 显示输入指示器
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', request);
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
        } else {
            const character = response.character;
            
            // 检查character对象是否存在
            if (!character) {
                addMessage(`❌ ${currentLanguage === 'zh' ? '角色生成失败：返回数据格式错误' : 'Ошибка создания персонажа：неверный формат данных'}`);
                return;
            }
            
            let resultText = currentLanguage === 'zh' ?
                `🎨 <strong>角色生成成功！</strong><br>
                 👤 <strong>姓名：</strong>${character.name || '未知'}<br>
                 📝 <strong>描述：</strong>${character.description || '无描述'}<br>` :
                `🎨 <strong>Персонаж создан успешно！</strong><br>
                 👤 <strong>Имя：</strong>${character.name || 'Неизвестно'}<br>
                 📝 <strong>Описание：</strong>${character.description || 'Без описания'}<br>`;
            
            // 添加PDF下载链接
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF-архив</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF</a>`;
            } else {
                resultText += currentLanguage === 'zh' ?
                    `<span style="color: #666;">(PDF не создан)</span>` :
                    `<span style="color: #666;">(PDF не создан)</span>`;
            }
            
            addMessage(resultText);
            
            // Добавляем изображение
            if (response.image_url) {
                setTimeout(() => {
                    addMessage(`<img src="${API_BASE}${response.image_url}" class="character-image" alt="Сгенерированное изображение персонажа">`);
                }, 100);
            } else {
                setTimeout(() => {
                    addMessage(currentLanguage === 'zh' ? 
                        `🖼️ <span style="color: #666;">(Изображение не создано)</span>` :
                        `🖼️ <span style="color: #666;">(Изображение не создано)</span>`);
                }, 100);
            }
        }
    } catch (error) {
        addMessage(`❌ ${currentLanguage === 'zh' ? 'Запрос завершился с ошибкой:' : 'Запрос не удался:'} ${error.message}`);
    } finally {
        // Скрываем кнопку остановки, показываем кнопку отправки
        toggleButtons(false);
        hideTypingIndicator();
    }
}

// 生成真正随机的角色
async function generateRandomCharacter() {
    const t = translations[currentLanguage];
    
    // Случайным образом генерируем различные атрибуты персонажа - 根据语言切换
    const genders = currentLanguage === 'zh' ? ['男', '女'] : ['мужчина', 'женщина'];
    const ages = currentLanguage === 'zh' ? 
        ['18岁', '22岁', '28岁', '35岁', '45岁', '60岁', '150岁', '300岁'] : 
        ['18 лет', '22 лет', '28 лет', '35 лет', '45 лет', '60 лет', '150 лет', '300 лет'];
    const heights = currentLanguage === 'zh' ? 
        ['160cm', '170cm', '175cm', '180cm', '185cm', '190cm', '200cm', '140cm'] : 
        ['160см', '170см', '175см', '180см', '185см', '190см', '200см', '140см'];
    const weights = currentLanguage === 'zh' ? 
        ['50kg', '60kg', '65kg', '70kg', '75kg', '80kg', '85kg', '90kg'] : 
        ['50кг', '60кг', '65кг', '70кг', '75кг', '80кг', '85кг', '90кг'];
    const hairColors = currentLanguage === 'zh' ? 
        ['黑色', '棕色', '金色', '红色', '白色', '银色', '蓝色', '紫色', '绿色'] : 
        ['черный', 'коричневый', 'золотой', 'красный', 'белый', 'серебряный', 'синий', 'фиолетовый', 'зеленый'];
    const eyeColors = currentLanguage === 'zh' ? 
        ['黑色', '棕色', '蓝色', '绿色', '灰色', '琥珀色', '紫色', '红色', '金色'] : 
        ['черный', 'коричневый', 'синий', 'зеленый', 'серый', 'янтарный', 'фиолетовый', 'красный', 'золотой'];
    const professions = currentLanguage === 'zh' ? 
        ['骑士', '巫师', '弓箭手', '战士', '法师', '盗贼', '牧师', '商人', '农民', '学者', '艺术家', '医生'] : 
        ['рыцарь', 'волшебник', 'лучник', 'воин', 'маг', 'вор', 'священник', 'торговец', 'фермер', 'ученый', 'художник', 'врач'];
    const personalities = currentLanguage === 'zh' ? 
        ['勇敢', '智慧', '神秘', '温和', '优雅', '敏捷', '坚韧', '诚实', '幽默', '严肃', '热情', '冷静'] : 
        ['храбрый', 'умный', 'таинственный', 'мягкий', 'элегантный', 'проворный', 'стойкий', 'честный', 'юмористический', 'серьезный', 'страстный', 'спокойный'];
    const nationalities = currentLanguage === 'zh' ? 
        ['中国', '俄罗斯', '英国', '日本', '法国', '德国', '意大利', '西班牙', '美国', '印度', '埃及', '希腊'] : 
        ['Китай', 'Россия', 'Великобритания', 'Япония', 'Франция', 'Германия', 'Италия', 'Испания', 'США', 'Индия', 'Египет', 'Греция'];
    const fantasyRaces = currentLanguage === 'zh' ? 
        ['人类', '精灵', '矮人', '兽人', '龙族', '天使', '恶魔', '吸血鬼', '狼人', '妖精', '元素生物', '机械生命'] : 
        ['человек', 'эльф', 'гном', 'орк', 'дракон', 'ангел', 'демон', 'вампир', 'оборотень', 'фея', 'элементаль', 'механическое существо'];
    
    // Случайным образом выбираем атрибуты (значения на китайском)
    const rawRequest = {
        gender: genders[Math.floor(Math.random() * genders.length)],
        age: ages[Math.floor(Math.random() * ages.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
        weight: weights[Math.floor(Math.random() * weights.length)],
        hair_color: hairColors[Math.floor(Math.random() * hairColors.length)],
        eye_color: eyeColors[Math.floor(Math.random() * eyeColors.length)],
        profession: professions[Math.floor(Math.random() * professions.length)],
        personality: Array.from({length: 3}, () => personalities[Math.floor(Math.random() * personalities.length)]).join('，'),
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        fantasy_race: Math.random() > 0.3 ? fantasyRaces[Math.floor(Math.random() * fantasyRaces.length)] : '',
        language: currentLanguage
    };
    
    // Получаем локализованные значения в зависимости от текущего языка
    const localizedRequest = {
        gender: currentLanguage === 'zh' ? rawRequest.gender : (rawRequest.gender === '男' ? 'мужчина' : 'женщина'),
        age: currentLanguage === 'zh' ? rawRequest.age : rawRequest.age.replace('岁', ' лет').replace('cm', 'см').replace('kg', 'кг'),
        height: currentLanguage === 'zh' ? rawRequest.height : rawRequest.height.replace('cm', 'см'),
        weight: currentLanguage === 'zh' ? rawRequest.weight : rawRequest.weight.replace('kg', 'кг'),
        hair_color: currentLanguage === 'zh' ? rawRequest.hair_color : getRussianTranslation(rawRequest.hair_color),
        eye_color: currentLanguage === 'zh' ? rawRequest.eye_color : getRussianTranslation(rawRequest.eye_color),
        profession: currentLanguage === 'zh' ? rawRequest.profession : getRussianTranslation(rawRequest.profession),
        personality: currentLanguage === 'zh' ? rawRequest.personality : getRussianTranslation(rawRequest.personality),
        nationality: currentLanguage === 'zh' ? rawRequest.nationality : getRussianTranslation(rawRequest.nationality),
        fantasy_race: currentLanguage === 'zh' ? rawRequest.fantasy_race : getRussianTranslation(rawRequest.fantasy_race),
        language: currentLanguage
    };
    
    // Создаем текст запроса
    const promptText = currentLanguage === 'zh' ? 
        `生成一个${localizedRequest.nationality}的${localizedRequest.fantasy_race ? localizedRequest.fantasy_race + '' : ''}${localizedRequest.profession}角色：
        - 性别：${localizedRequest.gender}
        - 年龄：${localizedRequest.age}
        - Рост：${localizedRequest.height}，Вес：${localizedRequest.weight}
        - Цвет волос：${localizedRequest.hair_color}，Цвет глаз：${localizedRequest.eye_color}
        - Характер：${localizedRequest.personality}
        ${localizedRequest.fantasy_race ? '- Раса：' + localizedRequest.fantasy_race : ''}` :
        `Создать персонажа ${localizedRequest.nationality} ${localizedRequest.fantasy_race ? localizedRequest.fantasy_race + ' ' : ''}${localizedRequest.profession}：
        - Пол: ${localizedRequest.gender}
        - Возраст: ${localizedRequest.age}
        - Рост: ${localizedRequest.height}, Вес: ${localizedRequest.weight}
        - Цвет волос: ${localizedRequest.hair_color}, Цвет глаз: ${localizedRequest.eye_color}
        - Характер: ${localizedRequest.personality}
        ${localizedRequest.fantasy_race ? '- Раса: ' + localizedRequest.fantasy_race : ''}`;
    
    // Добавляем сообщение пользователя
    addMessage(promptText, true);
    
    // Показываем кнопку остановки, скрываем кнопку отправки
    toggleButtons(true);
    
    // Показываем индикатор ввода
    showTypingIndicator();
    
    // Отправляем запрос на сервер с использованием исходных китайских значений
    try {
        const response = await callApi('generate/character', 'POST', rawRequest);
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? 'Генерация персонажа завершилась с ошибкой:' : 'Ошибка при создании персонажа:'} ${response.error}`);
        } else {
            const character = response.character;
            
            // Проверяем, существует ли объект character
            if (!character) {
                addMessage(`❌ ${currentLanguage === 'zh' ? 'Генерация персонажа завершилась с ошибкой: неверный формат данных' : 'Ошибка создания персонажа: неверный формат данных'}`);
                return;
            }
            
            let resultText = currentLanguage === 'zh' ?
                `🎨 <strong>Случайный персонаж успешно создан!</strong><br>
                 👤 <strong>Имя:</strong>${character.name || 'Неизвестно'}<br>
                 📝 <strong>Описание:</strong>${character.description || 'Без описания'}<br>` :
                `🎨 <strong>Случайный персонаж успешно создан!</strong><br>
                 👤 <strong>Имя:</strong>${character.name || 'Неизвестно'}<br>
                 📝 <strong>Описание:</strong>${character.description || 'Без описания'}<br>`;
            
            // Добавляем ссылку для скачивания PDF
            if (response.pdf_url) {
                resultText += currentLanguage === 'zh' ?
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF-архив</a>` :
                    `<a href="${API_BASE}${response.pdf_url}" class="download-link">📥 Скачать PDF</a>`;
            } else {
                resultText += currentLanguage === 'zh' ?
                    `<span style="color: #666;">(PDF не создан)</span>` :
                    `<span style="color: #666;">(PDF не создан)</span>`;
            }
            
            addMessage(resultText);
            
            // Добавляем изображение
            if (response.image_url) {
                setTimeout(() => {
                    addMessage(`<img src="${API_BASE}${response.image_url}" class="character-image" alt="Сгенерированное изображение персонажа">`);
                }, 100);
            } else {
                setTimeout(() => {
                    addMessage(currentLanguage === 'zh' ? 
                        `🖼️ <span style="color: #666;">(Изображение не создано)</span>` :
                        `🖼️ <span style="color: #666;">(Изображение не создано)</span>`);
                }, 100);
            }
        }
    } catch (error) {
        addMessage(`❌ ${currentLanguage === 'zh' ? 'Запрос завершился с ошибкой:' : 'Запрос не удался:'} ${error.message}`);
    } finally {
        // Скрываем кнопку остановки, показываем кнопку отправки
        toggleButtons(false);
        hideTypingIndicator();
    }
}

// Инициализация после загрузки страницы
window.onload = init;
