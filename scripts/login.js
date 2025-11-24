// login.js - maneja el formulario de login en `index.html`
(function(){
    function $(sel) { return document.querySelector(sel); }

    async function onSubmit(evt) {
        evt.preventDefault();
        const user = $('#user').value;
        const password = $('#password').value;

        if (!user || !password) {
            alert('Completa usuario y contraseña');
            return;
        }

        try {
            const creds = { usuario: user, password };
            console.log('Intentando login con:', { usuario: user });
            console.log('URL de login:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN);
            
            const res = await authService.login(creds);
            console.log('Respuesta de login:', res);
            console.log('Usuario recibido:', res.user);
            console.log('Rol del usuario:', res.user?.rol);
            
            if (!res || !res.token) {
                alert('Login falló: token no recibido');
                return;
            }

            if (!res.user || !res.user.rol) {
                console.error('Error: Usuario sin rol definido');
                alert('Error: Usuario sin rol asignado');
                return;
            }

            // Guardar token y usuario
            httpClient.setAuthToken(res.token);
            
            // Redirección según rol
            const role = String(res.user.rol).toLowerCase().trim();
            console.log('Rol normalizado para redirección:', role);
            
            try { 
                localStorage.setItem('currentUser', JSON.stringify(res.user));
                localStorage.setItem('authToken', res.token);
                console.log('✅ Datos guardados en localStorage');
                console.log('   - currentUser:', localStorage.getItem('currentUser'));
                console.log('   - authToken:', localStorage.getItem('authToken'));
            } catch(e){
                console.error('❌ Error guardando en localStorage:', e);
                alert('Error al guardar sesión. Por favor, intenta de nuevo.');
                return;
            }

            console.log('Usuario guardado:', localStorage.getItem('currentUser'));
            console.log('Rol del usuario:', role);

            const redirectMap = {
                'docente': './pages/bienvenidas/bienvenida Docente.html',
                'admin': './pages/bienvenidas/bienvenida Director.html',
                'tutor': './pages/bienvenidas/bienvenida Tutor.html',
                'estudiante': './pages/bienvenidas/bienvenida Estudiante.html'
            };

            const target = redirectMap[role];
            
            if (!target) {
                console.error('Rol no reconocido:', role);
                alert('Error: Rol de usuario no reconocido (' + role + ')');
                return;
            }
            
            console.log('✅ Redirigiendo a:', target);
            
            // Pequeña pausa para asegurar que localStorage se guarde
            setTimeout(() => {
                window.location.href = target;
            }, 100);
        } catch (err) {
            console.error('Error en login:', err);
            const msg = err && err.message ? err.message : 'Error en login';
            alert(msg);
        }
    }

    // esperar a que loadDependencies cargue httpClient & authService
    function init() {
        // Esperar hasta que authService y httpClient estén disponibles
        const ready = () => (typeof authService !== 'undefined' && typeof httpClient !== 'undefined');

        const attach = () => {
            const form = document.querySelector('form');
            if (!form) return;
            form.addEventListener('submit', onSubmit);
        };

        if (ready()) {
            attach();
            return;
        }

        const maxRetries = 50; // ~5s
        let tries = 0;
        const iv = setInterval(() => {
            if (ready()) {
                clearInterval(iv);
                attach();
                return;
            }
            tries += 1;
            if (tries > maxRetries) {
                clearInterval(iv);
                console.error('Dependencias de login no cargadas (authService/httpClient)');
            }
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
