// Инициализация VK Bridge
const bridge = window.vkBridge;
bridge.send('VKWebAppInit');

// База смешных мыслей (можно расширять до бесконечности)
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

// Функция для получения даты в формате ГГГГ-ММ-ДД (нужна для ежедневного обновления)
function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Генерация псевдослучайного индекса на основе даты и имени (чтобы мысли были уникальными для каждого, но постоянными в течение дня)
function getThoughtIndexForToday(petName, petType) {
    const today = getTodayDateString();
    const seed = petName + petType + today; // Комбинация для уникальности
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0; // Преобразование в 32-битное целое
    }
    return Math.abs(hash) % thoughtsDB.length;
}

// Сохранение профиля
function saveProfile(name, type) {
    const profile = { petName: name, petType: type };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// Загрузка профиля
function loadProfile() {
    const profile = localStorage.getItem(STORAGE_KEY);
    return profile ? JSON.parse(profile) : null;
}

// Обновление интерфейса после загрузки профиля
function updateUIBasedOnProfile() {
    const profile = loadProfile();
    const loadingScreen = document.getElementById('loadingScreen');
    const profileScreen = document.getElementById('profileScreen');
    const mainScreen = document.getElementById('mainScreen');
    const petInfoDisplay = document.getElementById('petInfoDisplay');
    const thoughtText = document.getElementById('thoughtText');
    const updateNote = document.getElementById('updateNote');

    if (!profile) {
        // Нет профиля — показываем экран создания
        loadingScreen.classList.add('hidden');
        profileScreen.classList.remove('hidden');
        mainScreen.classList.add('hidden');
    } else {
        // Профиль есть — показываем главный экран
        loadingScreen.classList.add('hidden');
        profileScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');

        // Отображаем информацию о питомце
        petInfoDisplay.textContent = `${profile.petType} ${profile.petName}`;

        // Генерируем мысль дня
        const thoughtIndex = getThoughtIndexForToday(profile.petName, profile.petType);
        const thought = thoughtsDB[thoughtIndex];
        
        // Добавляем имя питомца в начало мысли для большей персонализации
        thoughtText.textContent = `${profile.petName}: ${thought}`;

        // Проверяем, обновилась ли мысль сегодня
        const lastThoughtData = localStorage.getItem(THOUGHT_KEY);
        const today = getTodayDateString();
        
        if (lastThoughtData) {
            const lastData = JSON.parse(lastThoughtData);
            if (lastData.date === today) {
                updateNote.textContent = 'Мысль на сегодня (уже смотрели)';
            } else {
                updateNote.textContent = 'Сегодня новая мысль! ✨';
            }
        } else {
            updateNote.textContent = 'Сегодня новая мысль! ✨';
        }

        // Сохраняем факт просмотра
        localStorage.setItem(THOUGHT_KEY, JSON.stringify({ date: today, thought: thought }));
    }
}

// Обработчик сохранения профиля
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

// Кнопка редактирования профиля
document.getElementById('editProfileBtn').addEventListener('click', () => {
    // Очищаем профиль и показываем экран создания
    localStorage.removeItem(STORAGE_KEY);
    // Очищаем поля ввода (опционально)
    document.getElementById('petName').value = '';
    document.getElementById('petType').value = 'Кот';
    updateUIBasedOnProfile();
});

// Кнопка "Поделиться"
document.getElementById('shareButton').addEventListener('click', () => {
    const profile = loadProfile();
    if (!profile) return;

    const thoughtText = document.getElementById('thoughtText').textContent;
    
    // Текст для публикации (можно добавить ссылку на приложение)
    const shareText = `${thoughtText}\n\n😄 Узнай, о чем думает твой питомец каждый день!`;
    
    // Используем VKWebAppShare (работает везде)
    bridge.send('VKWebAppShare', {
        link: 'https://vk.com/app<ID_вашего_приложения>', // Замените <ID> на реальный ID приложения
        message: shareText
    }).catch((error) => {
        console.error('Ошибка при открытии окна шаринга:', error);
        // Если и этот метод не сработал — показываем alert
        alert('Не удалось открыть окно шаринга. Но вот твоя мысль: ' + thoughtText);
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Попробуем сразу получить информацию о пользователе ВК (опционально)
    bridge.send('VKWebAppGetUserInfo').then((data) => {
        console.log('Пользователь ВК:', data);
        // Можно использовать имя пользователя для приветствия, но пока пропустим
    }).catch((error) => {
        console.log('Не удалось получить данные пользователя (возможно, запуск не в ВК)');
    });

    // Показываем загрузку и через секунду проверяем профиль
    setTimeout(() => {
        updateUIBasedOnProfile();
    }, 500); // Небольшая задержка для имитации загрузки
});