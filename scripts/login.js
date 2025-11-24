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
            
            if (!res || !res.token) {
                alert('Login falló: token no recibido');
                return;
            }

            // Guardar token y usuario
            httpClient.setAuthToken(res.token);
            try { localStorage.setItem('currentUser', JSON.stringify(res.user || res.raw || {})); } catch(e){}

            // Redirección según rol
            const role = (res.user && res.user.rol) ? String(res.user.rol).toLowerCase() : null;
            const redirectMap = {
                docente: 'pages/bienvenidas/bienvenida Docente.html',
                admin: 'pages/bienvenidas/bienvenida Director.html',
                tutor: 'pages/bienvenidas/bienvenida Tutor.html',
                estudiante: 'pages/bienvenidas/bienvenida Estudiante.html'
            };

            const target = (role && redirectMap[role]) ? redirectMap[role] : 'index.html';
            window.location.href = target;
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
