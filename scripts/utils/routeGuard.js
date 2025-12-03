/**
 * RouteGuard - Sistema de protección de rutas
 * 
 * Verifica que el usuario esté autenticado y tenga el rol correcto
 * antes de permitir el acceso a páginas protegidas.
 * 
 * Uso:
 * Opción 1 (Auto-espera):
 *   <script>
 *     waitForRouteGuard(['docente', 'director']);
 *   </script>
 * 
 * Opción 2 (Manual - si RouteGuard ya está cargado):
 *   RouteGuard.protect(['docente']);
 */

/**
 * Función helper que espera a que RouteGuard esté disponible antes de proteger
 * @param {string[]} allowedRoles - Roles permitidos
 * @param {string} redirectTo - URL de redirección si no autorizado
 */
function waitForRouteGuard(allowedRoles, redirectTo = '../../index.html') {
    if (typeof RouteGuard !== 'undefined') {
        RouteGuard.protect(allowedRoles, redirectTo);
    } else {
        setTimeout(() => waitForRouteGuard(allowedRoles, redirectTo), 50);
    }
}

class RouteGuard {
    /**
     * Verifica si el usuario está autenticado
     * @returns {Object|null} Usuario actual o null si no está autenticado
     */
    static getCurrentUser() {
        try {
            const userJSON = localStorage.getItem('currentUser');
            if (!userJSON) return null;
            
            const user = JSON.parse(userJSON);
            if (!user.id_usuario || !user.rol) return null;
            
            return user;
        } catch (error) {
            console.error('Error al obtener usuario actual:', error);
            return null;
        }
    }

    /**
     * Verifica si hay un token de autenticación válido
     * @returns {boolean}
     */
    static hasValidToken() {
        try {
            const token = localStorage.getItem('authToken');
            return !!token;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verifica si el usuario tiene uno de los roles permitidos
     * @param {string[]} allowedRoles - Array de roles permitidos
     * @returns {boolean}
     */
    static hasRole(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const userRole = String(user.rol).toLowerCase();
        return allowedRoles.some(role => String(role).toLowerCase() === userRole);
    }

    /**
     * Protege una ruta verificando autenticación y roles
     * @param {string[]} allowedRoles - Roles permitidos (ej: ['docente', 'director'])
     * @param {string} redirectTo - URL a la que redirigir si no autorizado (default: index.html)
     */
    static protect(allowedRoles = [], redirectTo = 'index.html') {
        // Ejecutar la protección de forma síncrona (inmediata)
        // Esto previene que el usuario vea contenido antes de la redirección
        this._executeProtection(allowedRoles, redirectTo);
    }

    /**
     * Ejecuta la verificación de protección
     * @private
     */
    static _executeProtection(allowedRoles, redirectTo) {
        console.log('=== RouteGuard._executeProtection ===');
        console.log('allowedRoles:', allowedRoles);
        console.log('redirectTo:', redirectTo);
        
        // Verificar que haya un usuario logueado
        const user = this.getCurrentUser();
        console.log('getCurrentUser() retornó:', user);
        
        if (!user) {
            console.warn('🔒 Acceso denegado: No hay usuario autenticado');
            console.warn('Redirigiendo a:', redirectTo);
            this.redirectToLogin(redirectTo);
            return;
        }

        console.log('Usuario encontrado:', user.usuario, 'rol:', user.rol);

        // Verificar que tenga el rol correcto
        if (allowedRoles.length > 0 && !this.hasRole(allowedRoles)) {
            console.warn('🔒 Acceso denegado: Rol no autorizado');
            console.warn(`Usuario: ${user.usuario} (${user.rol})`);
            console.warn(`Roles permitidos: ${allowedRoles.join(', ')}`);
            
            // Redirigir a la página correspondiente según su rol
            this.redirectToHomePage(user.rol);
            return;
        }

        console.log('✅ Acceso autorizado:', user.usuario, `(${user.rol})`);
    }

    /**
     * Redirige al login
     * @param {string} redirectTo - URL del login
     */
    static redirectToLogin(redirectTo = null) {
        // Guardar la URL actual para redirigir después del login
        try {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        } catch (e) {}
        
        // Calcular ruta al index.html desde la ubicación actual
        if (!redirectTo) {
            const pathParts = window.location.pathname.split('/');
            const depth = pathParts.filter(p => p && p !== 'index.html').length - 1;
            redirectTo = '../'.repeat(depth) + 'index.html';
        }
        
        console.log('Redirigiendo al login:', redirectTo);
        window.location.href = redirectTo;
    }

    /**
     * Redirige a la página principal según el rol del usuario
     * @param {string} role - Rol del usuario
     */
    static redirectToHomePage(role) {
        // Calcular la ruta base del sitio
        const pathParts = window.location.pathname.split('/');
        const depth = pathParts.filter(p => p && p !== 'index.html').length - 1;
        const basePath = '../'.repeat(depth);
        
        const rolePages = {
            docente: basePath + 'pages/bienvenidas/bienvenida Docente.html',
            director: basePath + 'pages/bienvenidas/bienvenida Director.html',
            tutor: basePath + 'pages/bienvenidas/bienvenida Tutor.html',
            estudiante: basePath + 'pages/bienvenidas/bienvenida Estudiante.html'
        };

        const targetPage = rolePages[String(role).toLowerCase()] || basePath + 'index.html';
        
        console.log('Redirigiendo a home page para rol:', role, '→', targetPage);
        alert(`No tienes permiso para acceder a esta página.\nSerás redirigido a tu página principal.`);
        window.location.href = targetPage;
    }

    /**
     * Verifica si el usuario está autenticado (sin redirigir)
     * Útil para mostrar/ocultar elementos de la UI
     * @returns {boolean}
     */
    static isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Obtiene el rol del usuario actual
     * @returns {string|null}
     */
    static getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.rol : null;
    }

    /**
     * Cierra sesión y redirige al login
     */
    static logout() {
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            sessionStorage.clear();
        } catch (e) {
            console.error('Error al cerrar sesión:', e);
        }
        
        window.location.href = '/index.html';
    }
}

// Exportar para uso global
window.RouteGuard = RouteGuard;

// Exportar para CommonJS si se usa en tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RouteGuard };
}
