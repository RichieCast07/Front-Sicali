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
        'services/authService.js'
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
        // Disparar evento cuando todas las dependencias estén cargadas
        window.dispatchEvent(new Event('dependenciesLoaded'));
    }

    // iniciar carga en cuanto se evalúe este archivo
    if (document.readyState === 'loading') {
        // no bloquear DOMContentLoaded
        loadAll();
    } else {
        loadAll();
    }

})();
