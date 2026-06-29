// notifications.js — Изолированный модуль уведомлений через OneSignal и Cloudflare

export async function setupNotifications(currentUser) {
    if (!currentUser) return;

    // 1. Подключаем официальный скрипт OneSignal SDK динамически, чтобы не раздувать HTML
    if (!window.OneSignal) {
        const script = document.createElement('script');
        script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
        script.defer = true;
        document.head.appendChild(script);

        // Ждем, пока скрипт загрузится
        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }

    // 2. Инициализируем OneSignal
    window.OneSignal = window.OneSignal || [];
    OneSignal.push(async function() {
        await OneSignal.init({
            appId: "581fcba6-2018-4a74-a2d4-dadde071db26", // Замени на реальный ID из панели OneSignal
            safari_web_id: "ТВОЙ_SAFARI_WEB_ID", // Если настраивали для Safari
            notifyButton: { enable: false }, // Скрываем стандартную колокольчик-кнопку
        });

        // Привязываем юзернейм из чата к OneSignal, чтобы Cloudflare Worker знал, кому слать пуш
        await OneSignal.login(currentUser.id);
        
        // Передаем имя как тег для красивого отображения
        await OneSignal.User.addTag("user_name", currentUser.name);
        
        console.log(`Уведомления успешно настроены для @${currentUser.id}`);
    });
}

// Функция отправки пуша через твой Cloudflare Worker
export async function sendPushNotification(senderName, targetUsername, text) {
    const WORKER_URL = "https://semejka-push-worker.sirenamaster2000.workers.dev/"; // Замени на URL твоего Воркера

    try {
        await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderName: senderName,
                targetId: targetUsername, // Юзернейм того, кому летит пуш (Мама, Папа и т.д.)
                messageText: text
            })
        });
    } catch (error) {
        console.error("Не удалось отправить пуш через Cloudflare:", error);
    }
}
