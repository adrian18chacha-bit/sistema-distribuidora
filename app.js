const _supabase = supabase.createClient('https://ozdpcjhwbdsuqncgxfpz.supabase.co', 'sb_publishable_aBgdzg-JTQ61i1IkjUYysQ_4lYYJGPQ');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => console.log('Service Worker registrado con éxito:', registration.scope))
            .catch((error) => console.warn('Fallo al registrar el Service Worker:', error));
    });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

window.instalarApp = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
    } else {
        // Fallback for iOS / unsupported browsers
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Instalar App',
                html: 'Para instalar la aplicación en tu dispositivo móvil:<br><br><b>En iOS (iPhone/iPad):</b> Toca el botón <b>"Compartir"</b> (el cuadrado con la flecha hacia arriba) en la barra inferior de Safari y luego selecciona <b>"Agregar a inicio"</b>.<br><br><b>En Android:</b> Toca los tres puntos arriba a la derecha y selecciona <b>"Instalar aplicación"</b>.',
                icon: 'info',
                confirmButtonText: 'Entendido'
            });
        } else {
            alert('Para instalar la app en iOS, toca "Compartir" y luego "Agregar a inicio".');
        }
    }
};
