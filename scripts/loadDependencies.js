// LoadDependencies - carga secuencial de scripts comunes del proyecto
(function() {
    const files = [
        'config/apiConfig.js',
        'utils/httpClient.js',
        'utils/dateUtils.js',
        'utils/uiUtils.js',
        'utils/routeGuard.js',
        // services (cargar después de utils)
        'services/asistenciaService.js',
        'services/estudianteGrupoService.js',
        'services/gruposService.js',
        'services/grupoAsignaturaService.js',
        'services/ciclosService.js',
        'services/usuariosService.js',
        'services/authService.js',
        'services/tutorService.js',
        'services/calificacionesService.js'
    ];

    const base = (function() {
        const s = document.currentScript && document.currentScript.src;
        if (!s) return '/scripts/';
        return s.replace(/\/loadDependencies\.js(\?.*)?$/, '/');
    })();

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            try {
                // evitar recargar si ya existe
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const el = document.createElement('script');
                el.src = src;
                el.async = false;
                el.onload = () => resolve();
                el.onerror = () => reject(new Error('Error cargando ' + src));
                document.head.appendChild(el);
            } catch (err) {
                reject(err);
            }
        });
    }

    async function loadAll() {
        for (const f of files) {
            const full = base + f;
            try {
                await loadScript(full);
            } catch (err) {
                console.error(err);
            }
        }
        
        // Crear alias para servicios (para compatibilidad)
        if (typeof tutorService !== 'undefined') {
            window.tutoresService = tutorService;
        }
        
        // Asegurar que todos los servicios estén en window scope
        if (typeof calificacionesService !== 'undefined') {
            window.calificacionesService = calificacionesService;
        }
        if (typeof httpClient !== 'undefined') {
            window.httpClient = httpClient;
        }
        if (typeof API_CONFIG !== 'undefined') {
            window.API_CONFIG = API_CONFIG;
        }
        if (typeof authService !== 'undefined') {
            window.authService = authService;
        }
        if (typeof usuariosService !== 'undefined') {
            window.usuariosService = usuariosService;
        }
        if (typeof grupoAsignaturaService !== 'undefined') {
            window.grupoAsignaturaService = grupoAsignaturaService;
        }
        
        // Esperar un tick de evento para asegurar que todos los scripts están ejecutados
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Disparar evento cuando todas las dependencias estén cargadas
        window.dispatchEvent(new Event('dependenciesLoaded'));
        
        // También disparar evento de forma manual para verificación
        console.log('[loadDependencies] Evento dependenciesLoaded disparado');
        console.log('[loadDependencies] Servicios disponibles:', {
            calificacionesService: typeof window.calificacionesService !== 'undefined',
            httpClient: typeof window.httpClient !== 'undefined',
            API_CONFIG: typeof window.API_CONFIG !== 'undefined',
            authService: typeof window.authService !== 'undefined'
        });
    }

    // iniciar carga en cuanto se evalúe este archivo
    if (document.readyState === 'loading') {
        // no bloquear DOMContentLoaded
        loadAll();
    } else {
        loadAll();
    }

})();
