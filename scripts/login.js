// login.js - maneja el formulario de login en `index.html`
(function(){
    console.log('=== login.js cargado ===');
    
    function $(sel) { return document.querySelector(sel); }

    async function onSubmit(evt) {
        console.log('=== onSubmit llamado ===');
        if (evt) {
            evt.preventDefault();
            console.log('preventDefault ejecutado');
        }
        
        // Verificar que las dependencias estén disponibles
        if (typeof authService === 'undefined' || typeof httpClient === 'undefined') {
            console.error('Dependencias no disponibles aún');
            alert('El sistema aún está cargando. Por favor, espera un momento e intenta de nuevo.');
            return false;
        }
        
        const user = $('#user').value;
        const password = $('#password').value;

        console.log('Datos del formulario:', { usuario: user, password: '***' });

        if (!user || !password) {
            alert('Completa usuario y contraseña');
            return false;
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
            console.log('Rol tipo:', typeof role);
            console.log('Rol longitud:', role.length);
            console.log('Rol charCodes:', Array.from(role).map(c => c.charCodeAt(0)));
            
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

            // Obtener la URL base del sitio
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
            console.log('Base URL:', baseUrl);
            console.log('window.location.origin:', window.location.origin);
            console.log('window.location.pathname:', window.location.pathname);

            try {
                const redirectMap = {
                    'docente': baseUrl + '/pages/bienvenidas/bienvenida Docente.html',
                    'director': baseUrl + '/pages/bienvenidas/bienvenida Director.html',
                    'tutor': baseUrl + '/pages/bienvenidas/bienvenida Tutor.html',
                    'estudiante': baseUrl + '/pages/bienvenidas/bienvenida Estudiante.html',
                    'admin': baseUrl + '/pages/bienvenidas/bienvenida Director.html'
                };
                
                console.log('✅ redirectMap creado exitosamente');
                console.log('Claves disponibles en redirectMap:', Object.keys(redirectMap));
                console.log('Intentando acceder a redirectMap[' + JSON.stringify(role) + ']');

                const target = redirectMap[role];
                
                console.log('Target encontrado:', target);
                
                if (!target) {
                    console.error('Rol no reconocido:', role);
                    console.error('Roles disponibles:', Object.keys(redirectMap));
                    alert('Error: Rol de usuario no reconocido (' + role + '). Roles válidos: ' + Object.keys(redirectMap).join(', '));
                    return;
                }
                
                console.log('✅ Redirigiendo a:', target);
                
                // Pequeña pausa para asegurar que localStorage se guarde
                setTimeout(() => {
                    window.location.href = target;
                }, 100);
            } catch(redirectError) {
                console.error('❌ Error creando redirectMap:', redirectError);
                alert('Error al procesar redirección: ' + redirectError.message);
                return;
            }
        } catch (err) {
            console.error('Error en login:', err);
            const msg = err && err.message ? err.message : 'Error en login';
            alert(msg);
        }
        
        return false;
    }

    // esperar a que loadDependencies cargue httpClient & authService
    function init() {
        console.log('=== Inicializando login.js ===');
        console.log('document.readyState:', document.readyState);
        
        // Esperar hasta que authService y httpClient estén disponibles
        const ready = () => {
            const isReady = (typeof authService !== 'undefined' && typeof httpClient !== 'undefined');
            console.log('Dependencias listas?', isReady);
            return isReady;
        };

        const attach = () => {
            const btn = document.getElementById('loginBtn');
            const form = document.getElementById('loginForm');
            
            console.log('Botón encontrado:', !!btn);
            console.log('Form encontrado:', !!form);
            
            if (!btn) {
                console.error('No se encontró el botón de login');
                return;
            }
            
            // Deshabilitar el botón inicialmente
            btn.disabled = true;
            btn.textContent = 'Cargando...';
            
            // Esperar a que las dependencias estén listas
            const checkDeps = setInterval(() => {
                if (typeof authService !== 'undefined' && typeof httpClient !== 'undefined') {
                    clearInterval(checkDeps);
                    btn.disabled = false;
                    btn.textContent = 'Ingresar';
                    console.log('✅ Dependencias listas, botón habilitado');
                }
            }, 100);
            
            // Timeout después de 10 segundos
            setTimeout(() => {
                if (btn.disabled) {
                    clearInterval(checkDeps);
                    btn.textContent = 'Error al cargar';
                    console.error('❌ Timeout: No se cargaron las dependencias');
                }
            }, 10000);
            
            // Agregar evento al botón
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Click en botón detectado');
                onSubmit(null);
                return false;
            });
            
            // También prevenir el submit del formulario por si acaso
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Submit del form interceptado');
                    onSubmit(null);
                    return false;
                });
            }
            
            console.log('✅ Event listeners agregados');
        };

        if (ready()) {
            attach();
            return;
        }

        console.log('Esperando dependencias...');
        const maxRetries = 100; // ~10s
        let tries = 0;
        const iv = setInterval(() => {
            if (ready()) {
                clearInterval(iv);
                console.log('✅ Dependencias cargadas, adjuntando evento');
                attach();
                return;
            }
            tries += 1;
            if (tries > maxRetries) {
                clearInterval(iv);
                console.error('❌ Timeout: Dependencias de login no cargadas (authService/httpClient)');
                alert('Error al cargar el sistema de login. Por favor, recarga la página.');
            }
        }, 100);
    }

    // Asegurar que init se ejecute
    console.log('=== login.js cargado ===');
    if (document.readyState === 'loading') {
        console.log('Esperando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('DOM ya cargado, ejecutando init()...');
        init();
    }
})();
