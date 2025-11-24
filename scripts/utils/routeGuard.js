/**
 * RouteGuard - Sistema de protección de rutas
 * 
 * Verifica que el usuario esté autenticado y tenga el rol correcto
 * antes de permitir el acceso a páginas protegidas.
 * 
 * Uso:
 * 1. Incluir este script en las páginas que necesitan protección
 * 2. Llamar a RouteGuard.protect(['docente', 'director']) con los roles permitidos
 */

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
    static protect(allowedRoles = [], redirectTo = '/index.html') {
        // Verificar que haya un usuario logueado
        const user = this.getCurrentUser();
        
        if (!user) {
            console.warn('🔒 Acceso denegado: No hay usuario autenticado');
            this.redirectToLogin(redirectTo);
            return;
        }

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
    static redirectToLogin(redirectTo = '/index.html') {
        // Guardar la URL actual para redirigir después del login
        try {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        } catch (e) {}
        
        window.location.href = redirectTo;
    }

    /**
     * Redirige a la página principal según el rol del usuario
     * @param {string} role - Rol del usuario
     */
    static redirectToHomePage(role) {
        const rolePages = {
            docente: '/pages/bienvenidas/bienvenida Docente.html',
            director: '/pages/bienvenidas/bienvenida Director.html',
            tutor: '/pages/bienvenidas/bienvenida Tutor.html',
            estudiante: '/pages/estudiantes/estudiante.html'
        };

        const targetPage = rolePages[String(role).toLowerCase()] || '/index.html';
        
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
