export function registerAppServiceWorker(
    navigatorLike: Navigator = navigator,
    windowLike: Window = window
): void {
    if (!('serviceWorker' in navigatorLike)) {
        return;
    }

    windowLike.addEventListener('load', () => {
        void navigatorLike.serviceWorker
            .register('/sw.js')
            .catch((error) => {
                console.error('Failed to register service worker:', error);
            });
    });
}
