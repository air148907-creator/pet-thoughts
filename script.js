// Инициализация VK Bridge
const bridge = window.vkBridge;
bridge.send('VKWebAppInit');

// ==================== КОНСТАНТЫ ====================
const APP_ID = 54466618;

const thoughtsDB = [
    "Сегодня я буду игнорировать тебя ровно до 18:00, потом приду проситься на ручки. Это закон.",
    "Я слышал, как ты открывал(а) холодильник. Жду отчётности в виде вкусняшки.",
    "Соседская кошка снова на меня косо смотрит. Надо будет громко поорать ночью в знак протеста.",
    "Твой диван пахнет странно. Я его немного пометил(а), чтобы было как надо.",
    "Поставь, пожалуйста, этот ящик (ноутбук) на пол. Я хочу на нём посидеть.",
    "Уровень милоты сегодня зашкаливает. Готовь лакомства.",
    "Мне кажется, или ты забыл(а) купить корм? Я перерою всю квартиру в поисках доказательств.",
    "План на день: спать, есть, смотреть в окно, спать, немного побесить тебя в 6 утра.",
    "Я точно знаю, где ты спрятал(а) конфеты. Молчу, молчу... А что мне за это будет?",
    "Твоя подушка пахнет тобой. Я её немножко замурчал(а)/затоптал(а).",
    "Сегодня я чувствую себя хищником. Этот муравей на полу сильно поплатится.",
    "Ты слишком долго смотришь в телефон. Иди лучше почеши меня за ушком.",
    "Мне приснился сон, что ты даёшь мне много-много вкусняшек. Сделай этот сон реальностью.",
    "Этот пакет шуршит! Я должен(на) его проверить. Это инстинкт.",
    "Давай сегодня просто полежим и ничего не будем делать? Я составлю компанию.",
    "Ты надолго уходишь? Я планирую устроить небольшой беспорядок от скуки.",
    "Я сегодня не просто питомец, я — котролёр/собаконтролёр качества твоего отдыха.",
    "Мой язык — моё оружие. Сейчас я буду тебя вылизывать, и ты не посмеешь сопротивляться.",
    "Вода в миске стоит уже целых 2 часа. Это не свежак! Требую замены.",
    "Тот желтый банан на столе выглядит подозрительно. Я его изучу, когда ты отвернешься."
];

const STORAGE_KEY = 'petProfile';
const THOUGHT_KEY = 'lastThought';
const CHAT_HISTORY_KEY = 'chatHistory';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getThoughtIndexForToday(petName, petType) {
    const today = getTodayDateString();
    const seed = petName + petType + today;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % thoughtsDB.length;
}

function saveProfile(name, type, zodiacSign) {
    const profile = { petName: name, petType: type, zodiacSign: zodiacSign };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function loadProfile() {
    const profile = localStorage.getItem(STORAGE_KEY);
    return profile ? JSON.parse(profile) : null;
}

// ==================== ГЕНЕРАЦИЯ КАРТИНКИ ====================
function generateThoughtImage(thought, petName, petType) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.beginPath();
        ctx.roundRect(80, 200, 640, 400, 40);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#333';
        ctx.font = 'bold 36px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = 550;
        const words = thought.split(' ');
        let lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        ctx.font = '32px "Arial", sans-serif';
        let y = 380;
        lines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, y);
            y += 50;
        });

        ctx.font = '28px "Arial", sans-serif';
        ctx.fillStyle = '#555';
        ctx.fillText(`— ${petType} ${petName}`, canvas.width / 2, 600);

        ctx.font = '24px "Arial", sans-serif';
        ctx.fillStyle = '#999';
        ctx.fillText(`vk.com/app${APP_ID}`, canvas.width / 2, 700);

        canvas.toBlob(resolve, 'image/png');
    });
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
};

// ==================== ФУНКЦИИ ЗАГРУЗКИ ФОТО В ВК ====================
async function getWallUploadServer() {
    const result = await bridge.send('VKWebAppCallAPIMethod', {
        method: 'photos.getWallUploadServer',
        params: { v: '5.131' }
    });
    return result.response.upload_url;
}

async function uploadPhotoToServer(uploadUrl, blob) {
    const formData = new FormData();
    formData.append('photo', blob, 'thought.png');
    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    return response.json();
}

async function saveWallPhoto(server, photo, hash) {
    const result = await bridge.send('VKWebAppCallAPIMethod', {
        method: 'photos.saveWallPhoto',
        params: { server, photo, hash, v: '5.131' }
    });
    const saved = result.response[0];
    return `photo${saved.owner_id}_${saved.id}`;
}

async function uploadWallPhoto(blob) {
    const uploadUrl = await getWallUploadServer();
    const uploadResult = await uploadPhotoToServer(uploadUrl, blob);
    return await saveWallPhoto(uploadResult.server, uploadResult.photo, uploadResult.hash);
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
    if (confirm('Очистить всю историю сообщений?')) {
        localStorage.removeItem(CHAT_HISTORY_KEY);
        renderChatMessages();
    }
}

async function sendToMistral(userMessage) {
    const profile = loadProfile();
    if (!profile) return null;

    const systemPrompt = `Ты — Мафия, ${profile.petType} (питомец). Ты отвечаешь коротко, весело, с юмором, от первого лица. Используй имя хозяина: "${profile.petName}". Пиши как забавный питомец, который немного очеловечен. Не используй markdown, просто текст.`;

    const history = loadChatHistory();
    const recent = history.slice(-6);

    const messages = [
        { role: 'system', content: systemPrompt },
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
    const cacheKey = `horoscope_${profile.zodiacSign}_${today}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            return { text: parsed.text || parsed };
        } catch {}
    }

    const horoscope = await generateHoroscopeViaMistral(profile.zodiacSign, profile.petName, profile.petType);
    if (horoscope) {
        localStorage.setItem(cacheKey, JSON.stringify({ text: horoscope, petName: profile.petName }));
        return { text: horoscope };
    }
    return { error: 'generation_failed' };
}

async function renderHoroscope() {
    const horoscopeDiv = document.getElementById('horoscopeText');
    const loadingDiv = document.getElementById('horoscopeLoading');
    const timerDiv = document.getElementById('horoscopeTimer');
    if (!horoscopeDiv || !loadingDiv || !timerDiv) return;

    horoscopeDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    timerDiv.innerHTML = '';

    const result = await getHoroscopeForToday();

    loadingDiv.classList.add('hidden');
    horoscopeDiv.classList.remove('hidden');

    if (result.error === 'no_zodiac') {
        horoscopeDiv.innerHTML = '<p class="horoscope-placeholder">✨ Сначала укажи свой знак зодиака в настройках профиля (нажми ✏️).</p>';
    } else if (result.error === 'generation_failed') {
        horoscopeDiv.innerHTML = '<p class="horoscope-placeholder">😿 Не удалось получить гороскоп. Попробуй позже.</p>';
    } else {
        horoscopeDiv.innerHTML = `<p>${result.text}</p>`;
        const { hours, minutes } = getTimeUntilMidnight();
        timerDiv.innerHTML = `🔄 Новый гороскоп через ${hours} ч ${minutes} мин`;
    }
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUIBasedOnProfile() {
    const profile = loadProfile();
    const loadingScreen = document.getElementById('loadingScreen');
    const profileScreen = document.getElementById('profileScreen');
    const mainInterface = document.getElementById('mainInterface');
    const petInfoDisplay = document.getElementById('petInfoDisplay');
    const thoughtText = document.getElementById('thoughtText');
    const updateNote = document.getElementById('updateNote');

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

        const thoughtIndex = getThoughtIndexForToday(profile.petName, profile.petType);
        const thought = thoughtsDB[thoughtIndex];
        thoughtText.textContent = `${profile.petName}: ${thought}`;

        const lastThoughtData = localStorage.getItem(THOUGHT_KEY);
        const today = getTodayDateString();
        if (lastThoughtData) {
            const lastData = JSON.parse(lastThoughtData);
            updateNote.textContent = (lastData.date === today) ? 'Мысль на сегодня (уже смотрели)' : 'Сегодня новая мысль! ✨';
        } else {
            updateNote.textContent = 'Сегодня новая мысль! ✨';
        }
        localStorage.setItem(THOUGHT_KEY, JSON.stringify({ date: today, thought }));

        renderChatMessages();
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
    bridge.send('VKWebAppGetUserInfo').catch(() => {});

    setTimeout(() => {
        updateUIBasedOnProfile();
    }, 500);

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

    document.getElementById('shareButton')?.addEventListener('click', async () => {
        const profile = loadProfile();
        if (!profile) return;

        const thoughtElement = document.getElementById('thoughtText');
        if (!thoughtElement) return;
        const thoughtText = thoughtElement.textContent;

        const imageBlob = await generateThoughtImage(thoughtText, profile.petName, profile.petType);

        try {
            await bridge.send('VKWebAppGetAuthToken', { app_id: APP_ID, scope: 'photos' });
        } catch (e) {
            alert('Нужен доступ к фото для публикации');
            return;
        }

        let attachment;
        try {
            attachment = await uploadWallPhoto(imageBlob);
        } catch (e) {
            console.error('Ошибка загрузки фото:', e);
            alert('Не удалось загрузить изображение');
            return;
        }

        const shareText = `😄 ${profile.petName} сегодня думает:\n\n${thoughtText}\n\n👉 Узнай мысли своего питомца каждый день!`;
        const link = `https://vk.com/app${APP_ID}`;

        bridge.send('VKWebAppShowWallPostBox', {
            message: shareText,
            attachments: `${attachment},${link}`
        }).catch(error => {
            console.error('Ошибка при открытии окна поста:', error);
            alert('Не удалось открыть окно публикации. Но вот твоя мысль: ' + thoughtText);
        });
    });

    document.getElementById('sendChatBtn')?.addEventListener('click', handleChatSend);
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    document.getElementById('clearChatBtn')?.addEventListener('click', clearChatHistory);

    document.getElementById('chatInput')?.addEventListener('focus', () => {
        setTimeout(() => scrollChatToBottom(true), 300);
    });
});