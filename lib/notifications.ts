export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const sendNotification = (title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
        try {
            // Mobile vibration pattern (if supported)
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }

            const options = {
                body,
                icon: icon || '/kosmo/icons/icon-192x192.png',
                vibrate: [200, 100, 200],
                tag: 'kosmo-alert' // Prevent stacking too many similar alerts
            };

            new Notification(title, options);
        } catch (e) {
            console.error('Notification error:', e);
        }
    }
};
