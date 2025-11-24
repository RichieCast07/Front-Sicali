class AuthService {
    /**
     * Realiza login validando credenciales contra la lista de usuarios
     * @param {Object} credentials { usuario, password }
     */
    async login(credentials) {
        try {
            console.log('Iniciando validación de login...');
            
            // Obtener todos los usuarios
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.LIST);
            
            if (!response.success || !response.data) {
                throw new Error('No se pudo obtener la lista de usuarios');
            }

            // Normalizar respuesta (puede ser array o objeto con array)
            let usuarios = Array.isArray(response.data) ? response.data : 
                          (response.data.usuarios || response.data.data || []);

            console.log(`Se encontraron ${usuarios.length} usuarios en el sistema`);

            // Buscar usuario que coincida con las credenciales
            const user = usuarios.find(u => 
                u.usuario === credentials.usuario && 
                u.password === credentials.password
            );

            console.log('Búsqueda de usuario:', {
                buscado: credentials.usuario,
                encontrado: !!user,
                rol: user ? user.rol : 'N/A'
            });

            if (!user) {
                console.error('Usuario no encontrado. Credenciales incorrectas.');
                throw new Error('Usuario o contraseña incorrectos');
            }

            // Verificar que el usuario esté activo
            if (user.estado && user.estado.toLowerCase() !== 'activo') {
                console.error('Usuario inactivo:', user.estado);
                throw new Error('Usuario inactivo. Contacta al administrador.');
            }

            console.log('✅ Login exitoso para:', user.nombre, user.ape_p, '| Rol:', user.rol);

            // Generar un token simple (en producción debería venir del backend)
            const token = btoa(`${user.id_usuario}:${user.usuario}:${Date.now()}`);

            const userData = {
                id_usuario: user.id_usuario,
                usuario: user.usuario,
                nombre: user.nombre,
                ape_p: user.ape_p,
                ape_m: user.ape_m,
                rol: user.rol,
                estado: user.estado,
                sexo: user.sexo
            };

            console.log('Datos del usuario a retornar:', userData);
            console.log('Token generado:', token);

            return { 
                token, 
                user: userData,
                raw: user 
            };
        } catch (error) {
            console.error('Error en AuthService.login:', error);
            throw error;
        }
    }

    logout() {
        httpClient.clearAuthToken();
        try { localStorage.removeItem('currentUser'); } catch (e) {}
    }
}

const authService = new AuthService();

// Exportar para CommonJS si se usa en tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService, authService };
}
