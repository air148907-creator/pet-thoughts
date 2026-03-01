// Инициализация VK Bridge
const bridge = window.vkBridge;
bridge.send('VKWebAppInit');

// ==================== БАЗА ФРАЗ ====================
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

// Ключи для localStorage
const STORAGE_KEY = 'petProfile';
const THOUGHT_KEY = 'lastThought';

// ⚠️ ВСТАВЬТЕ СЮДА РЕАЛЬНЫЙ ID ВАШЕГО ПРИЛОЖЕНИЯ (число)
const APP_ID = 54466618; // Например: 8123456

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

function saveProfile(name, type) {
    const profile = { petName: name, petType: type };
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

        // Градиентный фон
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Белая карточка для текста
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.beginPath();
        ctx.roundRect(80, 200, 640, 400, 40);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Текст мысли (центрированный)
        ctx.fillStyle = '#333';
        ctx.font = 'bold 36px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Перенос строк
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

        // Подпись: — Тип Имя
        ctx.font = '28px "Arial", sans-serif';
        ctx.fillStyle = '#555';
        ctx.fillText(`— ${petType} ${petName}`, canvas.width / 2, 600);

        // Ссылка на приложение (нижний колонтитул)
        ctx.font = '24px "Arial", sans-serif';
        ctx.fillStyle = '#999';
        ctx.fillText(`vk.com/app${APP_ID}`, canvas.width / 2, 700);

        canvas.toBlob(resolve, 'image/png');
    });
}

// Вспомогательная функция для roundRect
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

// ==================== ЗАГРУЗКА ФОТО В ВК ====================
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

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
    });
    return response.json();
}

async function saveWallPhoto(server, photo, hash) {
    const result = await bridge.send('VKWebAppCallAPIMethod', {
        method: 'photos.saveWallPhoto',
        params: {
            server: server,
            photo: photo,
            hash: hash,
            v: '5.131'
        }
    });
    const saved = result.response[0];
    return `photo${saved.owner_id}_${saved.id}`;
}

async function uploadWallPhoto(blob) {
    const uploadUrl = await getWallUploadServer();
    const uploadResult = await uploadPhotoToServer(uploadUrl, blob);
    const attachment = await saveWallPhoto(uploadResult.server, uploadResult.photo, uploadResult.hash);
    return attachment;
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUIBasedOnProfile() {
    const profile = loadProfile();
    const loadingScreen = document.getElementById('loadingScreen');
    const profileScreen = document.getElementById('profileScreen');
    const mainScreen = document.getElementById('mainScreen');
    const petInfoDisplay = document.getElementById('petInfoDisplay');
    const thoughtText = document.getElementById('thoughtText');
    const updateNote = document.getElementById('updateNote');

    if (!profile) {
        loadingScreen.classList.add('hidden');
        profileScreen.classList.remove('hidden');
        mainScreen.classList.add('hidden');
    } else {
        loadingScreen.classList.add('hidden');
        profileScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');

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

        localStorage.setItem(THOUGHT_KEY, JSON.stringify({ date: today, thought: thought }));
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const petName = document.getElementById('petName').value.trim();
    const petType = document.getElementById('petType').value;

    if (!petName) {
        alert('Пожалуйста, введите имя питомца!');
        return;
    }

    saveProfile(petName, petType);
    updateUIBasedOnProfile();
});

document.getElementById('editProfileBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('petName').value = '';
    document.getElementById('petType').value = 'Кот';
    updateUIBasedOnProfile();
});

// ==================== НОВАЯ КНОПКА ПОДЕЛИТЬСЯ ====================
document.getElementById('shareButton').addEventListener('click', async () => {
    const profile = loadProfile();
    if (!profile) return;

    const thoughtElement = document.getElementById('thoughtText');
    const thoughtText = thoughtElement.textContent;

    // 1. Генерируем картинку
    const imageBlob = await generateThoughtImage(thoughtText, profile.petName, profile.petType);

    // 2. Запрашиваем права на фото
    try {
        await bridge.send('VKWebAppGetAuthToken', {
            app_id: APP_ID,      // ⚠️ ID вашего приложения
            scope: 'photos'
        });
    } catch (e) {
        alert('Не удалось получить разрешение на загрузку фото. Публикация невозможна.');
        return;
    }

    // 3. Загружаем фото в ВК
    let attachment;
    try {
        attachment = await uploadWallPhoto(imageBlob);
    } catch (e) {
        console.error('Ошибка загрузки фото:', e);
        alert('Не удалось загрузить изображение.');
        return;
    }

    // 4. Публикуем пост с фото и ссылкой
    const shareText = `😄 ${profile.petName} сегодня думает:\n\n${thoughtText}\n\n👉 Узнай мысли своего питомца каждый день!`;
    // ⚠️ Ссылка на приложение (можно так же использовать APP_ID)
    const link = `https://vk.com/app${APP_ID}`;

    bridge.send('VKWebAppShowWallPostBox', {
        message: shareText,
        attachments: `${attachment},${link}`
    }).catch(error => {
        console.error('Ошибка при открытии окна поста:', error);
        // Если не сработало — показываем текст
        alert('Не удалось открыть окно публикации. Но вот твоя мысль: ' + thoughtText);
    });
});

// ==================== ЗАПУСК ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', () => {
    bridge.send('VKWebAppGetUserInfo').then((data) => {
        console.log('Пользователь ВК:', data);
    }).catch((error) => {
        console.log('Не удалось получить данные пользователя (возможно, запуск не в ВК)');
    });

    setTimeout(() => {
        updateUIBasedOnProfile();
    }, 500);
});