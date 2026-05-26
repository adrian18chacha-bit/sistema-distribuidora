const _supabase = supabase.createClient('https://ozdpcjhwbdsuqncgxfpz.supabase.co', 'sb_publishable_aBgdzg-JTQ61i1IkjUYysQ_4lYYJGPQ');

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            registration.unregister().then((success) => {
                if (success) console.log('Service Worker desregistrado:', registration.scope);
            });
        });
    }).catch((error) => console.warn('No se pudieron obtener los service workers:', error));
}
