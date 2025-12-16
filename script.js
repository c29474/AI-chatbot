/**
 * 创意写作助手 - 前端JavaScript核心逻辑
 * 
 * 功能说明：
 * 1. 提供多语言界面支持（中文、俄语）
 * 2. 管理聊天消息历史和角色生成流程
 * 3. 处理与后端API的通信（文本生成、图像生成、PDF生成）
 * 4. 实现实时聊天界面和角色创建表单
 * 5. 提供文件上传和下载功能
 * 
 * 主要模块：
 * - 界面初始化：多语言文本更新、按钮状态管理
 * - 聊天功能：消息发送、接收、历史记录管理
 * - 角色生成：自定义角色创建、预设角色选择
 * - 文件处理：图片显示、PDF下载、文件管理
 * - 多语言支持：翻译函数、界面文本切换
 * 
 * 作者：AI助手
 * 版本：1.0
 */

// ==================== 全局配置和变量 ====================
/**
 * 后端API基础地址 - 用于所有与后端服务的通信
 * @type {string}
 */
const API_BASE = 'http://localhost:8004/api';

/**
 * 文件服务基础地址 - 用于文件下载和静态资源访问
 * @type {string}
 */
const FILE_BASE = 'http://localhost:8004';

/**
 * 当前界面语言 - 支持中文('zh')和俄语('ru')，默认使用俄语
 * @type {string}
 */
let currentLanguage = 'ru';

/**
 * 聊天消息历史记录 - 存储所有用户和助手的对话消息
 * @type {Array<Object>}
 */
let messageHistory = [];

/**
 * 当前请求控制器 - 用于中止正在进行的API请求
 * @type {AbortController|null}
 */
let currentRequestController = null;

/**
 * 生成状态标记 - 防止在生成过程中发送重复请求
 * @type {boolean}
 */
let isGenerating = false;

/**
 * 页面初始化函数 - 在页面加载完成后执行所有初始化操作
 * 包括设置语言、界面更新、侧边栏状态、欢迎消息等
 * @returns {void}
 */
function initializePage() {
    try {
        // 设置语言选择器 - 根据当前语言设置下拉框选中项
        const langSelect = document.getElementById('lang');
        if (langSelect) {
            langSelect.value = currentLanguage;
        }
        
        // 强制更新所有界面文本 - 根据当前语言更新所有UI元素
        updateUI();
        
        // 在桌面端默认收起侧边栏 - 优化大屏幕用户体验
        if (window.innerWidth > 768) {
            const sidebar = document.getElementById('sidebar');
            const mainContainer = document.querySelector('.main-container');
            const toggleBtn = document.getElementById('sidebarToggleBtn');
            
            if (sidebar && mainContainer && toggleBtn) {
                // 默认不显示侧边栏 - 提供更专注的聊天体验
                sidebar.classList.remove('active');
                mainContainer.classList.remove('sidebar-active');
                
                // 更新按钮文本 - 确保按钮文本与当前语言一致
                const t = translations[currentLanguage];
                toggleBtn.textContent = t.sidebarToggleBtn;
            }
        }
        
        // 生成欢迎消息 - 向用户展示应用功能和操作提示
        generateWelcomeMessage();
        
        // 强制更新快速操作按钮 - 确保按钮文本与当前语言一致
        updateQuickActions();
        
        // 强制更新预设角色按钮 - 更新预设角色模板的显示
        updatePresetButtons();
        
        // 更新角色生成表单 - 设置表单标签和占位符文本
        updateCharacterForm();
        
        // 加载聊天历史 - 从本地存储恢复之前的对话记录
        loadChatHistory();
        
        console.log('[初始化] 页面初始化完成，当前语言:', currentLanguage);
    } catch (error) {
        console.error('[初始化] 错误:', error);
    }
}

/**
 * 更新界面文本函数 - 根据当前语言动态更新所有UI元素的文本内容
 * 包括页面标题、按钮文本、输入框占位符等
 * @returns {void}
 */
function updateUI() {
    const t = translations[currentLanguage];
    
    // 更新页面标题 - 浏览器标签页显示的标题
    document.getElementById('pageTitle').textContent = `${t.title} - AI聊天机器人`;
    
    // 更新主标题和副标题 - 应用主界面显示的标题
    document.getElementById('title').textContent = t.title;
    document.getElementById('subtitle').textContent = t.subtitle;
    
    // 更新按钮文本 - 所有功能按钮的文本内容
    document.getElementById('newChatBtn').textContent = t.newChatBtn;
    document.getElementById('clearChatBtn').textContent = t.clearChatBtn;
    document.getElementById('saveChatBtn').textContent = t.saveChatBtn;
    document.getElementById('sidebarToggleBtn').textContent = t.sidebarToggleBtn;
    document.getElementById('sendBtn').textContent = t.sendBtn;
    document.getElementById('stopBtn').textContent = currentLanguage === 'zh' ? '停止' : 'Стоп';
    
    // 更新输入框占位符 - 聊天输入框的提示文本
    document.getElementById('messageInput').placeholder = t.messagePlaceholder;
    
    // 更新语言选择器选项 - 下拉选择框的选项文本
    const langSelect = document.getElementById('lang');
    langSelect.options[0].text = '中文';
    langSelect.options[1].text = 'Русский';
}

/**
 * 语言切换函数 - 处理用户选择不同语言时的界面更新
 * 更新所有UI文本、欢迎消息、按钮状态，并保存语言设置到本地存储
 * @returns {void}
 */
function switchLanguage() {
    const langSelect = document.getElementById('lang');
    currentLanguage = langSelect.value;
    
    console.log('[语言切换] 切换到语言:', currentLanguage);
    
    // 强制更新所有界面文本 - 立即应用新的语言设置
    updateUI();
    
    // 重新生成欢迎消息 - 确保欢迎消息使用正确的语言
    generateWelcomeMessage();
    
    // 强制更新快速操作按钮 - 更新快速操作区域的按钮文本
    updateQuickActions();
    
    // 强制更新预设角色按钮 - 更新预设角色模板的显示文本
    updatePresetButtons();
    
    // 重新更新角色生成表单 - 更新表单标签和占位符文本
    updateCharacterForm();
    
    // 保存语言设置 - 将用户的语言偏好保存到本地存储
    localStorage.setItem('chatLanguage', currentLanguage);
    
    console.log('[语言切换] 语言切换完成');
}

/**
 * 自动保存对话历史到本地存储 - 将当前对话记录保存到浏览器本地存储
 * 用于持久化保存用户对话，支持跨会话恢复
 * @returns {void}
 */
function autoSaveChatHistory() {
    if (messageHistory.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(messageHistory));
        localStorage.setItem('chatLanguage', currentLanguage);
    }
}

/**
 * 从本地存储加载对话历史 - 从浏览器本地存储恢复之前的对话记录
 * 支持恢复对话内容和语言设置，提供无缝的用户体验
 * @returns {void}
 */
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
        
        // 重新渲染消息 - 将保存的对话记录显示在聊天区域
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
        
        // 滚动到最新消息 - 确保用户看到最新的对话内容
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

/**
 * 双语文本配置对象 - 包含应用所有界面文本的中文和俄语翻译
 * 支持完整的国际化，包括按钮、标签、提示信息等
 * @type {Object}
 */
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

/**
 * 预设角色配置对象 - 包含多种预设角色的多语言属性配置
 * 支持快速生成常见角色类型，如骑士、巫师、精灵等
 * @type {Object}
 */
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

/**
 * 保存聊天记录函数 - 将当前对话历史导出为文本文件并下载
 * 支持多语言提示，清理HTML标签，生成时间戳文件名
 * @returns {void}
 */
function saveChatHistory() {
    const t = translations[currentLanguage];
    if (messageHistory.length === 0) {
        alert(t.noChatToSave);
        return;
    }
    
    // 格式化聊天内容 - 将消息历史转换为纯文本格式
    const chatContent = messageHistory.map(msg => {
        const time = msg.time;
        const sender = msg.isUser ? (currentLanguage === 'zh' ? '用户' : 'Пользователь') : (currentLanguage === 'zh' ? '助手' : 'Ассистент');
        return `[${time}] ${sender}: ${msg.content.replace(/<[^>]*>/g, '')}`;
    }).join('\n\n');
    
    // 创建下载文件 - 使用Blob对象生成可下载的文件
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

/**
 * 切换侧边栏显示/隐藏函数 - 控制角色生成侧边栏的显示状态
 * 更新按钮文本以反映当前状态，提供直观的用户反馈
 * @returns {void}
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContainer = document.querySelector('.main-container');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    
    // 切换侧边栏显示状态 - 使用CSS类控制动画效果
    sidebar.classList.toggle('active');
    mainContainer.classList.toggle('sidebar-active');
    
    // 更新按钮文本 - 根据侧边栏状态显示相应的文本
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
    
    // 双语选项数据 - 修复：保持键值对的一致性
    const createBilingualOptions = (zhOptions, ruOptions) => {
        if (currentLanguage === 'zh') {
            return zhOptions;
        } else {
            // 在俄语模式下，使用中文键和俄语值的组合
            // 这样可以确保API接收到正确的中文键，同时显示俄语值给用户
            return ruOptions;
        }
    };
    
    const hairColors = createBilingualOptions(
        {
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
        },
        {
            'черный': 'Черный',
            'коричневый': 'Коричневый',
            'золотой': 'Золотой',
            'красный': 'Красный',
            'белый': 'Белый',
            'серебряный': 'Серебряный',
            'синий': 'Синий',
            'фиолетовый': 'Фиолетовый',
            'зеленый': 'Зеленый',
            'розовый': 'Розовый'
        }
    );
    
    const eyeColors = createBilingualOptions(
        {
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
        },
        {
            'черный': 'Черный',
            'коричневый': 'Коричневый',
            'синий': 'Синий',
            'зеленый': 'Зеленый',
            'серый': 'Серый',
            'янтарный': 'Янтарный',
            'фиолетовый': 'Фиолетовый',
            'красный': 'Красный',
            'золотой': 'Золотой',
            'серебряный': 'Серебряный'
        }
    );
    
    const personalities = createBilingualOptions(
        {
            '勇敢，忠诚': '勇敢，忠诚',
            '智慧，神秘': '智慧，神秘',
            '温和，优雅': '温和，优雅',
            '敏捷，坚韧': '敏捷，坚韧',
            '诚实，幽默': '诚实，幽默',
            '热情，冷静': '热情，冷静',
            '果断，谨慎': '果断，谨慎',
            '乐观，外向': '乐观，外向'
        },
        {
            '勇敢，忠诚': 'Храбрый, верный',
            '智慧，神秘': 'Мудрый, таинственный',
            '温和，优雅': 'Мягкий, элегантный',
            '敏捷，坚韧': 'Проворный, стойкий',
            '诚实，幽默': 'Честный, юмористичный',
            '热情，冷静': 'Страстный, спокойный',
            '果断，谨慎': 'Решительный, осторожный',
            '乐观，外向': 'Оптимистичный, экстравертный'
        }
    );
    
    const nationalities = createBilingualOptions(
        {
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
        },
        {
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
        }
    );
    
    const professions = createBilingualOptions(
        {
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
        },
        {
            'рыцарь': 'Рыцарь',
            'волшебник': 'Волшебник',
            'лучник': 'Лучник',
            'воин': 'Воин',
            'маг': 'Маг',
            'вор': 'Вор',
            'жрец': 'Жрец',
            'торговец': 'Торговец',
            'фермер': 'Фермер',
            'ученый': 'Ученый',
            'художник': 'Художник',
            'врач': 'Врач',
            'инженер': 'Инженер',
            'учитель': 'Учитель',
            'повар': 'Повар',
            'моряк': 'Моряк',
            'охотник': 'Охотник',
            'кузнец': 'Кузнец',
            'алхимик': 'Алхимик',
            'бард': 'Бард'
        }
    );
    
    const fantasyRaces = createBilingualOptions(
        {
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
        },
        {
            'человек': 'Человек',
            'эльф': 'Эльф',
            'гном': 'Гном',
            'орк': 'Орк',
            'дракон': 'Дракон',
            'ангел': 'Ангел',
            'демон': 'Демон',
            'вампир': 'Вампир',
            'оборотень': 'Оборотень',
            'фея': 'Фея',
            'элементаль': 'Элементаль',
            'механическое существо': 'Механическое существо',
            'нежить': 'Нежить',
            'кентавр': 'Кентавр',
            'тролль': 'Тролль',
            'гоблин': 'Гоблин',
            'нага': 'Нага',
            'друид': 'Друид'
        }
    );
    
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

// 扩展翻译映射表，添加更多中文词汇的俄语翻译
function getExtendedRussianTranslation(chineseText) {
    // 如果已经是俄语文本，直接返回
    if (/[а-яё]/i.test(chineseText)) {
        return chineseText;
    }
    
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
    const originalTranslation = getBasicRussianTranslation(chineseText);
    if (originalTranslation !== chineseText) {
        return originalTranslation;
    }
    
    // 然后尝试扩展翻译表
    return extendedTranslations[chineseText] || chineseText;
}

// 基础俄语翻译函数
function getBasicRussianTranslation(chineseText) {
    const basicTranslations = {
        // 性别
        '男': 'мужчина',
        '女': 'женщина',
        
        // 颜色
        '黑色': 'черный',
        '棕色': 'коричневый',
        '金色': 'золотой',
        '红色': 'красный',
        '白色': 'белый',
        '银色': 'серебряный',
        '蓝色': 'синий',
        '紫色': 'фиолетовый',
        '绿色': 'зеленый',
        '粉色': 'розовый',
        
        // 国家
        '中国': 'Китай',
        '俄罗斯': 'Россия',
        '英国': 'Великобритания',
        '日本': 'Япония',
        '法国': 'Франция',
        '德国': 'Германия',
        '美国': 'США',
        '印度': 'Индия',
        
        // 职业
        '骑士': 'рыцарь',
        '巫师': 'волшебник',
        '战士': 'воин',
        '法师': 'маг',
        '商人': 'торговец',
        '农民': 'фермер',
        '医生': 'доктор',
        '教师': 'учитель'
    };
    
    return basicTranslations[chineseText] || chineseText;
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
    const request = {
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
    };
    
    // 根据当前语言决定使用原始值还是翻译后的值
    const localizedRequest = {...request};
    
    if (currentLanguage === 'ru') {
        // 使用getExtendedRussianTranslation函数进行完整翻译
        localizedRequest.gender = getExtendedRussianTranslation(request.gender);
        localizedRequest.hair_color = getExtendedRussianTranslation(request.hair_color);
        localizedRequest.eye_color = getExtendedRussianTranslation(request.eye_color);
        localizedRequest.nationality = getExtendedRussianTranslation(request.nationality);
        localizedRequest.profession = getExtendedRussianTranslation(request.profession);
        localizedRequest.fantasy_race = getExtendedRussianTranslation(request.fantasy_race);
        
        // 翻译性格（可能包含多个特征）
        if (request.personality.includes('，') || request.personality.includes(',')) {
            const personalities = request.personality.replace(/，/g, ',').split(',');
            const translatedPersonalities = personalities.map(p => {
                const trimmed = p.trim();
                // 检查是否已经是俄语
                if (/[а-яё]/i.test(trimmed)) {
                    return trimmed;
                }
                return getExtendedRussianTranslation(trimmed);
            });
            localizedRequest.personality = translatedPersonalities.join(', ');
        } else {
            // 检查是否已经是俄语
            if (/[а-яё]/i.test(request.personality)) {
                localizedRequest.personality = request.personality;
            } else {
                localizedRequest.personality = getExtendedRussianTranslation(request.personality);
            }
        }
        
        // 翻译单位
        localizedRequest.age = request.age.replace('岁', ' лет').replace('cm', ' см').replace('kg', ' кг');
        localizedRequest.height = request.height.replace('cm', ' см');
        localizedRequest.weight = request.weight.replace('kg', ' кг');
    }
    
    const promptText = currentLanguage === 'zh' ? 
        `生成一个${request.nationality}的${request.profession}角色：
        - 性别：${request.gender}
        - 年龄：${request.age}
        - 身高：${request.height}，体重：${request.weight}
        - 发色：${request.hair_color}，瞳色：${request.eye_color}
        - 性格：${request.personality}
        - 种族：${request.fantasy_race}` :
        `Создать персонажа ${localizedRequest.nationality} ${localizedRequest.profession}：
        - Пол: ${localizedRequest.gender}
        - Возраст: ${localizedRequest.age}
        - Рост: ${localizedRequest.height}, Вес: ${localizedRequest.weight}
        - Цвет волос: ${localizedRequest.hair_color}, Цвет глаз: ${localizedRequest.eye_color}
        - Характер: ${localizedRequest.personality}
        - Раса: ${localizedRequest.fantasy_race}`;
    
    // Добавление сообщения пользователя
    addMessage(promptText, true);
    
    // Отображение индикатора ввода
    showTypingIndicator();
    
    try {
        const response = await callApi('generate/character', 'POST', localizedRequest);
        
        // 调试：打印完整响应
        console.log('[角色生成] 完整响应:', response);
        
        // 检查响应是否有效
        if (!response) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色失败：未收到响应' : 'Ошибка создания персонажа: ответ не получен'}`);
            return;
        }
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
            return;
        }
        
        const character = response.character;
        console.log('[角色生成] image_url:', response.image_url);
        console.log('[角色生成] pdf_url:', response.pdf_url);
        console.log('[角色生成] character对象:', character);
        
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
        
        addMessage(resultText);
        
        // 使用统一函数显示图片和PDF
        setTimeout(() => {
            displayImageAndPDF(response.image_url, response.pdf_url);
        }, 100);
    } catch (error) {
        console.error('[生成自定义角色] 错误:', error);
        let errorMessage = error.message || error.toString();
        
        // 如果error是对象且有error属性，使用它
        if (error && typeof error === 'object' && error.error) {
            errorMessage = error.error;
        }
        
        addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色失败：' : 'Ошибка создания персонажа：'} ${errorMessage}`);
    } finally {
        // 隐藏停止按钮，显示发送按钮
        toggleButtons(false);
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
        
        // 检查响应是否有效
        if (!response) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色失败：未收到响应' : 'Ошибка создания персонажа: ответ не получен'}`);
            return;
        }
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
            return;
        }
        
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
        
        addMessage(resultText);
        
        // 使用统一函数显示图片和PDF
        setTimeout(() => {
            displayImageAndPDF(response.image_url, response.pdf_url);
        }, 100);
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
        
        // 检查响应是否有效
        if (!response) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色失败：未收到响应' : 'Ошибка создания персонажа: ответ не получен'}`);
            return;
        }
        
        if (response.error) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
            return;
        }
        
        const character = response.character;
        
        // 调试：打印响应数据
        console.log('角色生成响应:', response);
        
        // 检查character对象是否存在
        if (!character) {
            addMessage(`❌ ${currentLanguage === 'zh' ? '角色生成失败：返回数据格式错误' : 'Ошибка создания персонажа：неверный формат данных'}`);
            return;
        }
        
        let resultText = currentLanguage === 'zh' ?
            `🎨 <strong>角色生成成功！</strong><br>
             👤 <strong>姓名：</strong>${character.name}<br>
             📝 <strong>描述：</strong>${character.description || '无描述'}<br>` :
            `🎨 <strong>Персонаж создан успешно！</strong><br>
             👤 <strong>Имя：</strong>${character.name}<br>
             📝 <strong>Описание：</strong>${character.description || '无描述'}<br>`;
        
        addMessage(resultText);
        
        // 使用统一函数显示图片和PDF
        setTimeout(() => {
            displayImageAndPDF(response.image_url, response.pdf_url);
        }, 100);
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

// 注意：handleKeyPress函数在后面定义（第2149行），这里删除重复定义

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

// 统一的函数：显示图片和PDF
function displayImageAndPDF(imageUrl, pdfUrl) {
    console.log('[显示媒体] imageUrl:', imageUrl, 'pdfUrl:', pdfUrl);
    
    // 显示图片
    if (imageUrl) {
        const fullImageUrl = `${FILE_BASE}${imageUrl}`;
        console.log('[显示图片] 完整URL:', fullImageUrl);
        const imageHtml = `<div class="media-container">
            <img src="${fullImageUrl}" class="character-image" alt="${currentLanguage === 'zh' ? '生成的角色图片' : 'Сгенерированное изображение персонажа'}" 
                 onerror="console.error('图片加载失败:', this.src); this.onerror=null; this.parentElement.innerHTML='<span style=\\'color: #666;\\'>${currentLanguage === 'zh' ? '（图片加载失败，可能已过期）' : '（Изображение не загружено, возможно устарело）'}</span>'"
                 onload="console.log('图片加载成功:', this.src)"
                 loading="lazy">
        </div>`;
        addMessage(imageHtml);
    } else {
        console.log('[显示图片] 图片URL为空');
        addMessage(`🖼️ <span style="color: #666;">${currentLanguage === 'zh' ? '（图片生成失败）' : '（Изображение не создано）'}</span>`);
    }
    
    // 显示PDF（在聊天窗口中嵌入）
    if (pdfUrl) {
        const fullPdfUrl = `${FILE_BASE}${pdfUrl}`;
        console.log('[显示PDF] 完整URL:', fullPdfUrl);
        const pdfId = 'pdf-' + Date.now();
        const pdfHtml = `<div class="pdf-container" id="${pdfId}">
            <div class="pdf-header">
                <a href="${fullPdfUrl}" class="download-link" target="_blank" download>
                    📥 ${currentLanguage === 'zh' ? '下载PDF档案' : 'Скачать PDF'}
                </a>
            </div>
            <iframe src="${fullPdfUrl}#toolbar=0&navpanes=0&scrollbar=0" class="pdf-viewer" frameborder="0" 
                    onload="console.log('PDF iframe加载成功:', this.src)"
                    onerror="console.error('PDF iframe加载失败:', this.src); this.onerror=null; const errorDiv = this.parentElement.querySelector('.pdf-error'); if(errorDiv) errorDiv.style.display='block';"
                    title="${currentLanguage === 'zh' ? 'PDF预览' : 'PDF Preview'}">
            </iframe>
            <div class="pdf-error" style="display: none; padding: 20px; text-align: center; color: #666;">
                ${currentLanguage === 'zh' ? 'PDF加载失败，请点击上方下载按钮' : 'PDF не загружен, пожалуйста, нажмите кнопку загрузки выше'}
            </div>
        </div>`;
        addMessage(pdfHtml);
        
        // 为Chrome浏览器添加特殊处理
        setTimeout(() => {
            const pdfContainer = document.getElementById(pdfId);
            if (pdfContainer) {
                const iframe = pdfContainer.querySelector('iframe');
                if (iframe) {
                    // 添加额外的错误检测
                    iframe.addEventListener('load', function() {
                        console.log('PDF iframe loaded event fired');
                    });
                    
                    iframe.addEventListener('error', function(e) {
                        console.error('PDF iframe error event:', e);
                        const errorDiv = pdfContainer.querySelector('.pdf-error');
                        if (errorDiv) {
                            errorDiv.style.display = 'block';
                        }
                    });
                }
            }
        }, 100);
    } else {
        console.log('[显示PDF] PDF URL为空');
        addMessage(`📄 <span style="color: #666;">${currentLanguage === 'zh' ? '（PDF生成失败）' : '（PDF не создан）'}</span>`);
    }
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

// 注意：callApi函数在下面定义（第1920行），支持AbortController和超时处理

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

// API调用函数 - 支持中止和超时处理
async function callApi(endpoint, method = 'GET', data = null) {
    // 创建新的AbortController
    currentRequestController = new AbortController();
    isGenerating = true;
    
    // 根据端点设置不同的超时时间
    // 生成角色（包含图片和PDF）需要更长时间
    // 图像生成可能需要60-120秒，加上文本生成和PDF生成，总共可能需要3-5分钟
    const timeoutDuration = endpoint.includes('generate/character') ? 300000 : 60000; // 5分钟或1分钟
    const timeoutId = setTimeout(() => {
        if (currentRequestController) {
            console.log(`[API调用] 请求超时 (${timeoutDuration}ms): ${endpoint}`);
            currentRequestController.abort();
        }
    }, timeoutDuration);
    
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
        
        console.log(`[API调用] 发送请求: ${method} ${API_BASE}/${endpoint}`);
        console.log(`[API调用] 请求数据:`, data ? JSON.stringify(data).substring(0, 200) : '无数据');
        console.log(`[API调用] 超时设置: ${timeoutDuration}ms (${timeoutDuration/1000}秒)`);
        
        const startTime = Date.now();
        const response = await fetch(`${API_BASE}/${endpoint}`, options);
        const elapsedTime = Date.now() - startTime;
        
        // 清除超时定时器
        clearTimeout(timeoutId);
        
        console.log(`[API调用] 收到响应，耗时: ${elapsedTime}ms, 状态: ${response.status}`);
        
        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = `无法读取错误信息: ${e.message}`;
            }
            console.error(`[API调用] HTTP错误 ${response.status}:`, errorText);
            
            // 尝试解析为JSON
            let errorData = null;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                // 不是JSON格式，使用原始文本
            }
            
            const errorMsg = errorData && errorData.error ? errorData.error : errorText.substring(0, 200);
            throw new Error(`HTTP错误 ${response.status}: ${errorMsg}`);
        }
        
        const result = await response.json();
        console.log(`[API调用] 请求成功: ${endpoint}`, {
            hasCharacter: !!result.character,
            hasImageUrl: !!result.image_url,
            hasPdfUrl: !!result.pdf_url,
            fullResult: result
        });
        return result;
    } catch (error) {
        // 清除超时定时器
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.log('[API调用] 请求已被中止');
            return { error: currentLanguage === 'zh' ? '请求已中止' : 'Запрос был прерван' };
        }
        
        // 处理网络错误
        if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message.includes('fetch')) {
            console.error('[API调用] 网络错误详情:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                endpoint: endpoint
            });
            
            // 检查是否是超时导致的
            const isTimeout = error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('aborted');
            
            if (isTimeout && endpoint.includes('generate/character')) {
                const errorMsg = currentLanguage === 'zh' 
                    ? '请求超时（已等待5分钟）。生成角色、图片和PDF需要较长时间，请：\n1. 检查后端控制台是否还在处理\n2. 稍后重试\n3. 或尝试简化角色描述'
                    : 'Время ожидания истекло (ожидание 5 минут). Генерация персонажа, изображения и PDF занимает много времени, пожалуйста:\n1. Проверьте, обрабатывает ли сервер запрос в консоли\n2. Попробуйте позже\n3. Или упростите описание персонажа';
                return { error: errorMsg };
            }
            
            // 尝试检查后端服务是否可达
            try {
                const testController = new AbortController();
                const testTimeout = setTimeout(() => testController.abort(), 3000);
                const testResponse = await fetch(`${API_BASE.replace('/api', '')}/docs`, { 
                    method: 'HEAD', 
                    signal: testController.signal 
                });
                clearTimeout(testTimeout);
                console.log('[API调用] 后端服务可达，状态:', testResponse.status);
            } catch (testError) {
                console.error('[API调用] 后端服务不可达:', testError);
            }
            
            const errorMsg = currentLanguage === 'zh' 
                ? '网络连接失败，请检查：\n1. 后端服务是否运行在 http://localhost:8004\n2. 网络连接是否正常\n3. 请求可能超时（生成图片和PDF需要较长时间）\n\n提示：查看后端控制台日志了解处理进度'
                : 'Ошибка сети, проверьте:\n1. Запущен ли сервер на http://localhost:8004\n2. Нормальное ли соединение\n3. Возможно истекло время ожидания (генерация изображений и PDF занимает много времени)\n\nПодсказка: проверьте логи сервера для понимания прогресса';
            return { error: errorMsg };
        }
        
        console.error('[API调用] 其他错误:', error);
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
                
                // 检查响应是否有效
                if (!response) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色失败：未收到响应' : 'Ошибка создания персонажа: ответ не получен'}`);
                    break;
                }
                
                if (response.error) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '生成角色时出错：' : 'Ошибка при создании персонажа：'} ${response.error}`);
                    break;
                }
                
                const character = response.character;
                
                // 检查character对象是否存在
                if (!character) {
                    addMessage(`❌ ${currentLanguage === 'zh' ? '角色生成失败：返回数据格式错误' : 'Ошибка создания персонажа：неверный формат данных'}`);
                    break;
                }
                
                let resultText = currentLanguage === 'zh' ?
                    `🎨 <strong>角色生成成功！</strong><br>
                     👤 <strong>姓名：</strong>${character.name || '未知'}<br>
                     📝 <strong>描述：</strong>${character.description || '无描述'}<br>` :
                    `🎨 <strong>Персонаж создан успешно！</strong><br>
                     👤 <strong>Имя：</strong>${character.name || 'Неизвестно'}<br>
                     📝 <strong>Описание：</strong>${character.description || '无描述'}<br>`;
                
                addMessage(resultText);
                
                // 使用统一函数显示图片和PDF
                setTimeout(() => {
                    displayImageAndPDF(response.image_url, response.pdf_url);
                }, 100);
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
        console.error('[发送消息] 错误:', error);
        let errorMessage = error.message;
        
        // 如果error是对象且有error属性，使用它
        if (error && typeof error === 'object' && error.error) {
            errorMessage = error.error;
        }
        
        addMessage(`❌ ${currentLanguage === 'zh' ? '请求失败：' : 'Запрос не удался：'} ${errorMessage}`);
    } finally {
        // 隐藏停止按钮，显示发送按钮
        toggleButtons(false);
        hideTypingIndicator();
    }
}

// 处理键盘事件（回车键发送消息）
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 注意：generateCustomCharacter 和 generateRandomCharacter 函数已在前面定义（第1144行和第1511行）
// 这里删除重复定义，避免覆盖前面的完整版本
