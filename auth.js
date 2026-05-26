async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, password });

    if (!error) {
        checkUser();
    } else {
        alert('Error de acceso: Credenciales incorrectas');
    }
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

document.addEventListener('DOMContentLoaded', checkUser);

async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        cambiarPestana('ventas');
        cargarTodo();
    }
}
