async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        Swal.fire('Atención', 'Por favor, ingresa tu correo y contraseña.', 'warning');
        return;
    }

    const { error } = await _supabase.auth.signInWithPassword({ email, password });

    if (!error) {
        checkUser();
    } else {
        Swal.fire('Error de acceso', 'Credenciales incorrectas.', 'error');
    }
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

document.addEventListener('DOMContentLoaded', checkUser);

window.userRol = 'vendedor'; // por defecto por seguridad

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) {
        try {
            const { data: perfil, error } = await _supabase.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
            if (perfil) {
                window.userRol = perfil.rol;
            } else if (user.email === 'adrian.18chacha@gmail.com') {
                window.userRol = 'admin'; // Hardcode de seguridad para ti por si falla la base de datos
            }
        } catch (e) {
            console.error('No se pudo cargar el perfil', e);
        }

        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        
        if (typeof aplicarPermisosUI === 'function') aplicarPermisosUI();

        cambiarModulo('home');
        actualizarTema();
        await cargarTodo();
        
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }
    } else {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 500);
        }
    }
}
