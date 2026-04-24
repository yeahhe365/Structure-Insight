export function registerAppServiceWorker(
    navigatorLike: Navigator = navigator,
    windowLike: Window = window
): void {
    if (!('serviceWorker' in navigatorLike)) {
        return;
    }

    windowLike.addEventListener('load', () => {
        const serviceWorkerUrl = new URL('sw.js', new URL(import.meta.env.BASE_URL, windowLike.location.origin)).toString();
        void navigatorLike.serviceWorker
            .register(serviceWorkerUrl)
            .catch((error) => {
                console.error('Failed to register service worker:', error);
            });
    });
}
