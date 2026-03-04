// Инициализация VK Bridge
const bridge = window.vkBridge;
bridge.send('VKWebAppInit').catch(() => {});

// ==================== КОНСТАНТЫ ====================
const APP_ID = 54466618;
const STORAGE_KEY = 'petProfile';
const CHAT_HISTORY_KEY = 'chatHistory';

// Кэш для системного промпта чата
let cachedSystemPrompt = '';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function saveProfile(name, type, zodiacSign) {
    const profile = { petName: name, petType: type, zodiacSign: zodiacSign };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    cachedSystemPrompt = '';
}

function loadProfile() {
    const profile = localStorage.getItem(STORAGE_KEY);
    return profile ? JSON.parse(profile) : null;
}

// ==================== ФУНКЦИИ ЧАТА ====================
function loadChatHistory() {
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

function saveChatHistory(messages) {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
}

function addChatMessage(role, content) {
    const messages = loadChatHistory();
    messages.push({ role, content, timestamp: Date.now() });
    saveChatHistory(messages);
    renderChatMessages();
}

function scrollChatToBottom(smooth = true) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
        container.scrollTop = container.scrollHeight;
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const messages = loadChatHistory();
    container.innerHTML = '';
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.role}`;
        div.textContent = msg.content;
        container.appendChild(div);
    });
    scrollChatToBottom(false);
}

function clearChatHistory() {
    let confirmed = false;
    try {
        confirmed = confirm('Очистить всю историю сообщений?');
    } catch (e) {
        alert('Очистка временно недоступна. Попробуйте позже.');
        return;
    }

    if (confirmed) {
        localStorage.removeItem(CHAT_HISTORY_KEY);
        renderChatMessages();
    }
}

async function sendToMistral(userMessage) {
    const profile = loadProfile();
    if (!profile) return null;

    if (!cachedSystemPrompt || !cachedSystemPrompt.includes(profile.petName) || !cachedSystemPrompt.includes(profile.petType)) {
        cachedSystemPrompt = `Ты — Мафия, ${profile.petType} (питомец). Ты отвечаешь коротко, весело, с юмором, от первого лица. Используй имя хозяина: "${profile.petName}". Пиши как забавный питомец, который немного очеловечен. Не используй markdown, просто текст.`;
    }

    const history = loadChatHistory();
    const recent = history.slice(-6);

    const messages = [
        { role: 'system', content: cachedSystemPrompt },
        ...recent.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
    ];

    try {
        const response = await fetch('https://sparkling-violet-2bcf.air148907.workers.dev/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });

        if (!response.ok) {
            console.error('Server error:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Ошибка при вызове своего сервера:', error);
        return null;
    }
}

async function handleChatSend() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addChatMessage('user', text);
    scrollChatToBottom(true);

    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant typing';
    typingDiv.textContent = 'Мафия печатает...';
    container.appendChild(typingDiv);
    scrollChatToBottom(true);

    const reply = await sendToMistral(text);
    container.removeChild(typingDiv);

    if (reply) {
        addChatMessage('assistant', reply);
    } else {
        addChatMessage('assistant', 'Мяу... что-то пошло не так. Попробуй позже.');
    }
    scrollChatToBottom(true);
}

// ==================== ФУНКЦИИ ДЛЯ ГОРОСКОПА ====================
function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diffMs = midnight - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
}

async function generateHoroscopeViaMistral(zodiacSign, petName, petType) {
    const systemPrompt = `Ты — кот Тимофей, но теперь ты выступаешь от имени питомца по имени ${petName} (${petType}). Составь короткий, весёлый и добрый гороскоп на сегодня для знака зодиака "${zodiacSign}". Используй лёгкий юмор, но без сарказма. Гороскоп должен быть уникальным для этого дня (учти, что сегодня ${getTodayDateString()}). Ответ дай в виде 2-3 предложений, только текст, без пояснений.`;

    try {
        const response = await fetch('https://sparkling-violet-2bcf.air148907.workers.dev/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Напиши гороскоп для знака ${zodiacSign}.` }
                ]
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Ошибка генерации гороскопа:', error);
        return null;
    }
}

async function getHoroscopeForToday() {
    const profile = loadProfile();
    if (!profile || !profile.zodiacSign) {
        return { error: 'no_zodiac' };
    }

    const today = getTodayDateString();
    const cacheKey = `horoscope_${today}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            return { text: parsed.text || parsed, fromCache: true };
        } catch {}
    }

    const horoscope = await generateHoroscopeViaMistral(profile.zodiacSign, profile.petName, profile.petType);
    if (horoscope) {
        localStorage.setItem(cacheKey, JSON.stringify({ text: horoscope, petName: profile.petName }));
        return { text: horoscope, fromCache: false };
    }
    return { error: 'generation_failed' };
}

async function renderHoroscope() {
    const horoscopeDiv = document.getElementById('horoscopeText');
    const loadingDiv = document.getElementById('horoscopeLoading');
    const timerDiv = document.getElementById('horoscopeTimer');
    if (!horoscopeDiv || !loadingDiv || !timerDiv) return;

    const profile = loadProfile();
    if (!profile || !profile.zodiacSign) {
        horoscopeDiv.innerHTML = '<p class="horoscope-placeholder">✨ Сначала укажи свой знак зодиака в настройках профиля (нажми ✏️).</p>';
        timerDiv.innerHTML = '';
        loadingDiv.classList.add('hidden');
        return;
    }

    const today = getTodayDateString();
    const cacheKey = `horoscope_${today}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            horoscopeDiv.innerHTML = `<p>${parsed.text || parsed}</p>`;
            const { hours, minutes } = getTimeUntilMidnight();
            timerDiv.innerHTML = `🔄 Новый гороскоп через ${hours} ч ${minutes} мин`;
        } catch (e) {
            horoscopeDiv.innerHTML = '';
            timerDiv.innerHTML = '';
        }
    } else {
        horoscopeDiv.innerHTML = '';
        timerDiv.innerHTML = '';
        loadingDiv.classList.remove('hidden');
    }

    const result = await getHoroscopeForToday();

    if (result.error === 'generation_failed') {
        if (!horoscopeDiv.innerHTML.trim()) {
            horoscopeDiv.innerHTML = '<p class="horoscope-placeholder">😿 Не удалось получить гороскоп. Попробуй позже.</p>';
        }
    } else if (!result.error) {
        if (!result.fromCache || !horoscopeDiv.innerHTML.trim()) {
            horoscopeDiv.innerHTML = `<p>${result.text}</p>`;
        }
        const { hours, minutes } = getTimeUntilMidnight();
        timerDiv.innerHTML = `🔄 Новый гороскоп через ${hours} ч ${minutes} мин`;
    }

    loadingDiv.classList.add('hidden');
}

// ==================== НОВАЯ ФУНКЦИЯ ШАРИНГА ГОРОСКОПА ====================
async function shareHoroscope() {
    const profile = loadProfile();
    if (!profile) {
        alert('Сначала создайте профиль');
        return;
    }

    const horoscopeDiv = document.getElementById('horoscopeText');
    if (!horoscopeDiv) return;

    let horoscopeText = horoscopeDiv.innerText || horoscopeDiv.textContent;
    // Проверяем, что гороскоп действительно загружен (не плейсхолдер)
    if (!horoscopeText || 
        horoscopeText.includes('Сначала укажи свой знак') || 
        horoscopeText.includes('Не удалось получить') ||
        horoscopeText.includes('Кот Тимофей составляет')) {
        alert('Гороскоп ещё не загружен или недоступен');
        return;
    }

    // Создаём canvas с изображением для поста
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Фон
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Заголовок
    ctx.fillStyle = '#333';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔮 Гороскоп на сегодня', canvas.width / 2, 80);

    // Имя питомца
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#764ba2';
    ctx.fillText(`${profile.petName} (${profile.petType})`, canvas.width / 2, 140);

    // Текст гороскопа (с переносом строк)
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    const words = horoscopeText.split(' ');
    let line = '';
    let y = 200;
    const lineHeight = 30;
    const maxWidth = 500;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, 50, y);
            line = words[i] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 50, y);

    // Подпись
    ctx.font = '18px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Мысли питомца • vk.com/nash_pitomec', canvas.width / 2, canvas.height - 40);

    // Конвертируем canvas в blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    // Получаем URL для загрузки изображения на сервер ВК
    let uploadUrl;
    try {
        const getUploadUrlResult = await bridge.send('VKWebAppGetWallUploadUrl');
        uploadUrl = getUploadUrlResult.upload_url;
    } catch (e) {
        console.error(e);
        alert('Не удалось получить ссылку для загрузки изображения');
        return;
    }

    // Загружаем изображение
    const formData = new FormData();
    formData.append('photo', blob, 'horoscope.png');

    let uploadResponse;
    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });
        uploadResponse = await response.json();
    } catch (e) {
        console.error(e);
        alert('Ошибка загрузки изображения');
        return;
    }

    if (!uploadResponse.photo) {
        alert('Не удалось загрузить изображение');
        return;
    }

    // Текст для публикации
    const message = `🔮 Гороскоп для ${profile.petName} (${profile.petType}) на сегодня:\n\n${horoscopeText}\n\n#МыслиПитомца`;

    // Открываем окно публикации на стене
    try {
        await bridge.send('VKWebAppShowWallPostBox', {
            message: message,
            attachments: uploadResponse.photo
        });
    } catch (e) {
        console.error(e);
        alert('Не удалось открыть окно публикации');
    }
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUIBasedOnProfile() {
    const profile = loadProfile();
    const loadingScreen = document.getElementById('loadingScreen');
    const profileScreen = document.getElementById('profileScreen');
    const mainInterface = document.getElementById('mainInterface');
    const petInfoDisplay = document.getElementById('petInfoDisplay');

    if (!profile) {
        loadingScreen.classList.add('hidden');
        profileScreen.classList.remove('hidden');
        mainInterface.classList.add('hidden');
        document.getElementById('petName').value = '';
        document.getElementById('petType').value = 'Кот';
        document.getElementById('zodiacSign').value = '';
        document.getElementById('profileTitle').textContent = '🫵 Кто тут у нас?';
    } else {
        loadingScreen.classList.add('hidden');
        profileScreen.classList.add('hidden');
        mainInterface.classList.remove('hidden');

        petInfoDisplay.textContent = `${profile.petType} ${profile.petName}`;

        renderChatMessages();

        if (document.getElementById('horoscopeTab').classList.contains('active')) {
            renderHoroscope();
        }
    }
}

// ==================== УПРАВЛЕНИЕ ТАБАМИ ====================
function switchTab(tabName) {
    const tabThoughts = document.getElementById('tabThoughts');
    const tabChat = document.getElementById('tabChat');
    const tabHoroscope = document.getElementById('tabHoroscope');
    const thoughtsTab = document.getElementById('thoughtsTab');
    const chatTab = document.getElementById('chatTab');
    const horoscopeTab = document.getElementById('horoscopeTab');

    if (!tabThoughts || !tabChat || !tabHoroscope || !thoughtsTab || !chatTab || !horoscopeTab) return;

    tabThoughts.classList.remove('active');
    tabChat.classList.remove('active');
    tabHoroscope.classList.remove('active');
    thoughtsTab.classList.remove('active');
    chatTab.classList.remove('active');
    horoscopeTab.classList.remove('active');

    if (tabName === 'thoughts') {
        tabThoughts.classList.add('active');
        thoughtsTab.classList.add('active');
    } else if (tabName === 'chat') {
        tabChat.classList.add('active');
        chatTab.classList.add('active');
        renderChatMessages();
        setTimeout(() => scrollChatToBottom(false), 100);
    } else if (tabName === 'horoscope') {
        tabHoroscope.classList.add('active');
        horoscopeTab.classList.add('active');
        renderHoroscope();
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
document.addEventListener('DOMContentLoaded', () => {
    updateUIBasedOnProfile();

    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
        const petName = document.getElementById('petName')?.value.trim();
        const petType = document.getElementById('petType')?.value;
        const zodiacSign = document.getElementById('zodiacSign')?.value;

        if (!petName) {
            alert('Введите имя питомца');
            return;
        }
        if (!zodiacSign) {
            alert('Выберите свой знак зодиака');
            return;
        }

        saveProfile(petName, petType, zodiacSign);
        updateUIBasedOnProfile();
        switchTab('thoughts');
    });

    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        const profile = loadProfile();
        if (profile) {
            document.getElementById('petName').value = profile.petName || '';
            document.getElementById('petType').value = profile.petType || 'Кот';
            document.getElementById('zodiacSign').value = profile.zodiacSign || '';
            document.getElementById('profileTitle').textContent = '✏️ Редактировать профиль';
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('profileScreen').classList.remove('hidden');
            document.getElementById('mainInterface').classList.add('hidden');
        } else {
            updateUIBasedOnProfile();
        }
    });

    // ИСПРАВЛЕНО: всегда открываем ссылку через window.open, без VK Bridge
    document.getElementById('openCommunityBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://vk.com/nash_pitomec', '_blank');
    });

    const tabsContainer = document.querySelector('.tabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const target = e.target.closest('.tab-btn');
            if (!target) return;

            if (target.id === 'tabThoughts') switchTab('thoughts');
            else if (target.id === 'tabChat') switchTab('chat');
            else if (target.id === 'tabHoroscope') switchTab('horoscope');
        });
    }

    document.getElementById('sendChatBtn')?.addEventListener('click', handleChatSend);
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    // ИСПРАВЛЕНО: убран touchend, оставлен только click с preventDefault
    const clearBtn = document.getElementById('clearChatBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearChatHistory();
        });
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            setTimeout(() => {
                chatInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        });
    }

    // НОВЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ "ПОДЕЛИТЬСЯ ГОРОСКОПОМ"
    document.getElementById('shareHoroscopeBtn')?.addEventListener('click', shareHoroscope);
});