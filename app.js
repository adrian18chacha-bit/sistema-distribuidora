const _supabase = supabase.createClient('https://ozdpcjhwbdsuqncgxfpz.supabase.co', 'sb_publishable_aBgdzg-JTQ61i1IkjUYysQ_4lYYJGPQ');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => console.log('Service Worker registrado con éxito:', registration.scope))
            .catch((error) => console.warn('Fallo al registrar el Service Worker:', error));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtns = document.querySelectorAll('.btn-install-app');
    installBtns.forEach(btn => btn.style.display = 'flex');
});

window.instalarApp = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            const installBtns = document.querySelectorAll('.btn-install-app');
            installBtns.forEach(btn => btn.style.display = 'none');
        }
        deferredPrompt = null;
    }
};
