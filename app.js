const _supabase = supabase.createClient('https://ozdpcjhwbdsuqncgxfpz.supabase.co', 'sb_publishable_aBgdzg-JTQ61i1IkjUYysQ_4lYYJGPQ');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => console.log('Service Worker registrado con éxito:', registration.scope))
            .catch((error) => console.warn('Fallo al registrar el Service Worker:', error));
    });
}
