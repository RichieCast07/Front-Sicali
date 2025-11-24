class UsuariosService {
    /**
     * Obtiene todos los usuarios
     * @returns {Promise<Array>} Lista de usuarios
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.LIST);
            if (response.success) {
                // Normalizar id_usuario -> id y limpiar strings
                if (Array.isArray(response.data)) {
                    return response.data.map(u => normalizeUsuario(u));
                }
                return normalizeUsuario(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    }

    /**
     * Obtiene un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object>} Usuario encontrado
     */
    async getById(id) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.GET_BY_ID(id));
            if (response.success) {
                return normalizeUsuario(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener usuario ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene usuarios por rol
     * @param {string} rol - Rol del usuario (docente, estudiante)
     * @returns {Promise<Array>} Lista de usuarios con el rol especificado
     */
    async getByRol(rol) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.BY_ROL(rol));
            if (response.success) {
                // Normalize each usuario like getAll does
                if (Array.isArray(response.data)) {
                    return response.data.map(u => normalizeUsuario(u));
                }
                return response.data ? normalizeUsuario(response.data) : [];
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener usuarios con rol ${rol}:`, error);
            throw error;
        }
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} usuario - Datos del usuario
     * @returns {Promise<Object>} Usuario creado
     */
    async create(usuario) {
        try {
            console.log('=== INICIO CREATE USUARIO ===');
            console.log('Datos recibidos:', usuario);
            
            // Sanitize and normalize incoming data before sending to API
            const collapse = s => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : s);
            const compact = s => (typeof s === 'string' ? s.replace(/\s+/g, '').toUpperCase() : s);

            const payload = {
                nombre: collapse(usuario.nombre),
                ape_p: collapse(usuario.ape_p),
                ape_m: collapse(usuario.ape_m),
                curp: compact(usuario.curp),
                rfc: compact(usuario.rfc),
                sexo: typeof usuario.sexo === 'string' ? usuario.sexo.trim().toUpperCase() : usuario.sexo,
                usuario: collapse(usuario.usuario),
                password: usuario.password,
                rol: collapse(usuario.rol),
                estado: 'Activo' // Backend usa "Activo" con mayúscula inicial
            };

            console.log('Payload normalizado:', payload);

            const validation = this.validate(payload);
            console.log('Validación:', validation);
            
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            console.log('Enviando petición POST a:', API_CONFIG.ENDPOINTS.USUARIOS.CREATE);
            const response = await httpClient.post(API_CONFIG.ENDPOINTS.USUARIOS.CREATE, payload);
            console.log('Respuesta recibida:', response);
            
            if (response.success) {
                return normalizeUsuario(response.data);
            }

            // Handle duplicate / conflict responses from API with clearer message
            if (response.status === 409 && response.data && response.data.error) {
                // Preserve API error detail (e.g., Duplicate entry 'CURP' ...)
                throw new Error(response.data.error);
            }

            throw new Error(response.message || 'Error desconocido al crear usuario');
        } catch (error) {
            console.error('Error al crear usuario:', error);
            console.error('Tipo de error:', error.constructor.name);
            console.error('Mensaje:', error.message);
            throw error;
        }
    }

    /**
     * Actualiza un usuario existente
     * @param {number} id - ID del usuario
     * @param {Object} usuario - Datos actualizados
     * @returns {Promise<Object>} Usuario actualizado
     */
    async update(id, usuario) {
        try {
            const response = await httpClient.put(API_CONFIG.ENDPOINTS.USUARIOS.UPDATE(id), usuario);
            if (response.success) {
                return normalizeUsuario(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al actualizar usuario ${id}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un usuario
     * @param {number} id - ID del usuario
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async delete(id) {
        try {
            const response = await httpClient.delete(API_CONFIG.ENDPOINTS.USUARIOS.DELETE(id));
            return response.success;
        } catch (error) {
            console.error(`Error al eliminar usuario ${id}:`, error);
            throw error;
        }
    }

    /**
     * Valida los datos de un usuario
     * @param {Object} usuario - Datos del usuario
     * @returns {Object} Objeto con validación {isValid: boolean, errors: Array}
     */
    validate(usuario) {
        const errors = [];

        // Helper to clean strings like create() does
        const cleanCompact = s => (typeof s === 'string' ? s.replace(/\s+/g, '').toUpperCase() : s);

        // Validaciones básicas
        if (!usuario.nombre || usuario.nombre.trim() === '') {
            errors.push('El nombre es requerido');
        }

        if (!usuario.ape_p || usuario.ape_p.trim() === '') {
            errors.push('El apellido paterno es requerido');
        }

        if (!usuario.ape_m || usuario.ape_m.trim() === '') {
            errors.push('El apellido materno es requerido');
        }

        // Validación de CURP - clean before checking length
        const curpClean = cleanCompact(usuario.curp);
        if (!usuario.curp || curpClean === '') {
            errors.push('El CURP es requerido');
        } else if (curpClean.length !== 18) {
            errors.push(`El CURP debe tener 18 caracteres (actualmente tiene ${curpClean.length})`);
        }

        // Validación de RFC - clean before checking length
        const rfcClean = cleanCompact(usuario.rfc);
        if (!usuario.rfc || rfcClean === '') {
            errors.push('El RFC es requerido');
        } else if (rfcClean.length < 12 || rfcClean.length > 13) {
            errors.push(`El RFC debe tener 12 o 13 caracteres (actualmente tiene ${rfcClean.length})`);
        }

        // Validación de sexo
        if (!usuario.sexo || !['M', 'F'].includes(usuario.sexo)) {
            errors.push('El sexo debe ser M o F');
        }

        // Validación de usuario
        if (!usuario.usuario || usuario.usuario.trim() === '') {
            errors.push('El nombre de usuario es requerido');
        }

        // Validación de password (solo para creación)
        if (!usuario.id_usuario && (!usuario.password || usuario.password.length < 6)) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }

        // Validación de rol
        if (!usuario.rol || !['docente', 'estudiante', 'director', 'tutor'].includes(usuario.rol)) {
            errors.push('El rol debe ser: docente, estudiante, director o tutor');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida formato de CURP
     * @param {string} curp - CURP a validar
     * @returns {boolean} True si es válido
     */
    validateCURP(curp) {
        const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
        return curpRegex.test(curp);
    }

    /**
     * Valida formato de RFC
     * @param {string} rfc - RFC a validar
     * @returns {boolean} True si es válido
     */
    validateRFC(rfc) {
        const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
        return rfcRegex.test(rfc);
    }
}

// Crear instancia global
// Helper: normaliza la estructura del usuario recibida desde la API
function normalizeUsuario(u) {
    if (!u || typeof u !== 'object') return u;

    const out = { ...u };

    // id normalization
    if (out.id_usuario && !out.id) out.id = out.id_usuario;

    // Trim string fields that may contain extra spaces
    ['nombre', 'ape_p', 'ape_m', 'curp', 'rfc', 'sexo', 'usuario', 'rol', 'estado'].forEach(k => {
        if (typeof out[k] === 'string') out[k] = out[k].trim();
    });

    return out;
}

const usuariosService = new UsuariosService();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UsuariosService, usuariosService };
}
