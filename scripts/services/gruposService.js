class GruposService {
    /**
     * Obtiene todos los grupos
     * @returns {Promise<Array>} Lista de grupos
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPOS.LIST);
            if (response.success) {
                if (Array.isArray(response.data)) {
                    return response.data.map(g => normalizeGrupo(g));
                }
                return normalizeGrupo(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener grupos:', error);
            throw error;
        }
    }

    /**
     * Obtiene un grupo por ID
     * @param {number} id - ID del grupo
     * @returns {Promise<Object>} Grupo encontrado
     */
    async getById(id) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPOS.GET_BY_ID(id));
            if (response.success) {
                return normalizeGrupo(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener grupo ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene grupos por docente
     * @param {number} idDocente - ID del docente
     * @returns {Promise<Array>} Lista de grupos del docente
     */
    async getByDocente(idDocente) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPOS.BY_DOCENTE(idDocente));
            if (response.success) {
                if (Array.isArray(response.data)) return response.data.map(g => normalizeGrupo(g));
                return normalizeGrupo(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener grupos del docente ${idDocente}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene grupos por periodo
     * @param {number} idPeriodo - ID del periodo
     * @returns {Promise<Array>} Lista de grupos del periodo
     */
    async getByPeriodo(idPeriodo) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPOS.BY_PERIODO(idPeriodo));
            if (response.success) {
                if (Array.isArray(response.data)) return response.data.map(g => normalizeGrupo(g));
                return normalizeGrupo(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener grupos del periodo ${idPeriodo}:`, error);
            throw error;
        }
    }

    /**
     * Crea un nuevo grupo
     * @param {Object} grupo - Datos del grupo
     * @param {string} grupo.nombre - Nombre del grupo
     * @param {number} grupo.grado - Grado del grupo
     * @param {number} grupo.idPeriodo - ID del periodo
     * @param {number} grupo.idDocente - ID del docente
     * @returns {Promise<Object>} Grupo creado
     */
    async create(grupo) {
        try {
            console.log('=== INICIO CREATE GRUPO ===');
            console.log('Datos recibidos:', grupo);
            
            // Sanitize and coerce payload
            const nombre = typeof grupo.nombre === 'string' ? grupo.nombre.trim() : grupo.nombre;
            const grado = Number(grupo.grado);
            const idPeriodoNum = Number(grupo.idPeriodo) || null;
            const idDocenteNum = Number(grupo.idDocente) || null;

            console.log('Valores procesados:', { nombre, grado, idPeriodoNum, idDocenteNum });

            // Crear payload (POST usa IDs simples, no objetos anidados)
            const payload = {
                nombre,
                grado
            };

            // Incluir idPeriodo e idDocente como números simples si tienen valor
            if (idPeriodoNum) {
                payload.idPeriodo = idPeriodoNum;
            }
            if (idDocenteNum) {
                payload.idDocente = idDocenteNum;
            }

            console.log('Payload final a enviar:', JSON.stringify(payload, null, 2));

            // Validar después de crear el payload
            const validation = this.validate(payload);
            if (!validation.isValid) {
                console.error('Errores de validación:', validation.errors);
                throw new Error(validation.errors.join(', '));
            }

            const response = await httpClient.post(API_CONFIG.ENDPOINTS.GRUPOS.CREATE, payload);
            console.log('Respuesta del servidor:', response);
            console.log('Status de respuesta:', response.status);
            console.log('Data de respuesta:', response.data);
            
            if (response.success) {
                return normalizeGrupo(response.data);
            }

            // Intentar obtener el mensaje de error más específico del backend
            let errorMessage = 'Error al crear grupo';
            
            if (response.data) {
                // Intentar extraer mensaje de error de diferentes estructuras comunes
                if (typeof response.data === 'string') {
                    errorMessage = response.data;
                } else if (response.data.message) {
                    errorMessage = response.data.message;
                } else if (response.data.error) {
                    errorMessage = response.data.error;
                } else if (response.data.mensaje) {
                    errorMessage = response.data.mensaje;
                }
            }
            
            // Si no hay mensaje específico, usar el genérico
            if (errorMessage === 'Error al crear grupo' && response.message) {
                errorMessage = response.message;
            }

            console.error('❌ Error del backend:', errorMessage);
            throw new Error(errorMessage);
        } catch (error) {
            console.error('Error al crear grupo:', error);
            throw error;
        }
    }

    /**
     * Actualiza un grupo existente
     * @param {number} id - ID del grupo
     * @param {Object} grupo - Datos actualizados
     * @returns {Promise<Object>} Grupo actualizado
     */
    async update(id, grupo) {
        try {
            console.log('=== INICIO UPDATE GRUPO ===');
            console.log('ID:', id);
            console.log('Datos recibidos:', JSON.stringify(grupo, null, 2));
            
            // PASO 1: Obtener grupo actual para completar datos faltantes
            console.log('📥 Obteniendo grupo actual...');
            let grupoActual = {};
            try {
                grupoActual = await this.getById(id);
                console.log('✅ Grupo actual obtenido:', JSON.stringify(grupoActual, null, 2));
            } catch (e) {
                console.error('❌ Error al obtener grupo actual:', e.message);
                throw new Error('No se pudo obtener datos del grupo para actualizar. Verifica que el grupo exista.');
            }

            // PASO 2: Preparar valores finales - SIEMPRE usar actuales como fallback
            const nombre = grupo.nombre && grupo.nombre.trim() 
                ? grupo.nombre.trim() 
                : grupoActual.nombre;
                
            const grado = grupo.grado != null 
                ? Number(grupo.grado)
                : grupoActual.grado;
            
            // PASO 3: Obtener IDs de período y docente - CRÍTICO
            let idPeriodoNum = null;
            let idDocenteNum = null;
            
            // Período
            if (grupo.idPeriodo) {
                idPeriodoNum = Number(grupo.idPeriodo);
            } else if (grupoActual.idPeriodo) {
                if (typeof grupoActual.idPeriodo === 'object') {
                    idPeriodoNum = grupoActual.idPeriodo.idPeriodo || grupoActual.idPeriodo.id;
                } else {
                    idPeriodoNum = Number(grupoActual.idPeriodo);
                }
            }
            
            // Docente
            if (grupo.idDocente) {
                idDocenteNum = Number(grupo.idDocente);
            } else if (grupoActual.idDocente) {
                if (typeof grupoActual.idDocente === 'object') {
                    idDocenteNum = grupoActual.idDocente.id || grupoActual.idDocente.id_usuario;
                } else {
                    idDocenteNum = Number(grupoActual.idDocente);
                }
            }
            
            console.log('📊 Valores procesados:', {
                nombre,
                grado,
                idPeriodoNum,
                idDocenteNum
            });
            
            // PASO 4: Validar que todos los campos críticos tengan valor
            if (!nombre) throw new Error('El nombre del grupo no puede estar vacío');
            if (!grado || grado < 1 || grado > 6) throw new Error('El grado debe estar entre 1 y 6');
            if (!idPeriodoNum || idPeriodoNum <= 0) throw new Error('No se pudo obtener el periodo actual del grupo');
            if (!idDocenteNum || idDocenteNum <= 0) throw new Error('No se pudo obtener el docente actual del grupo');
            
            // PASO 5: Construir payload con estructura CORRECTA para el backend
            // El backend espera: nombre (string), grado (int), idPeriodo (int), idDocente (int)
            // NO: idPeriodo: { idPeriodo: N }, sino solo: idPeriodo: N
            const payload = {
                nombre: String(nombre).trim(),
                grado: Number(grado),
                idPeriodo: Number(idPeriodoNum),
                idDocente: Number(idDocenteNum)
            };
            
            console.log('📤 Payload final a enviar:', JSON.stringify(payload, null, 2));
            
            // PASO 6: Enviar actualización
            const response = await httpClient.put(API_CONFIG.ENDPOINTS.GRUPOS.UPDATE(id), payload);
            console.log('📨 Respuesta del servidor:', JSON.stringify(response, null, 2));
            
            if (response.success) {
                console.log('✅ Actualización exitosa');
                return normalizeGrupo(response.data);
            }
            
            // Manejo de errores del backend
            let errorMsg = response.message || 'Error desconocido al actualizar';
            if (response.data && response.data.message) {
                errorMsg = response.data.message;
            } else if (response.data && response.data.error) {
                errorMsg = response.data.error;
            }
            
            console.error('❌ Error del backend:', errorMsg);
            throw new Error(errorMsg);
            
        } catch (error) {
            console.error(`❌ Error en update() para grupo ${id}:`, error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    /**
     * Elimina un grupo
     * @param {number} id - ID del grupo
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async delete(id) {
        try {
            const response = await httpClient.delete(API_CONFIG.ENDPOINTS.GRUPOS.DELETE(id));
            return response.success;
        } catch (error) {
            console.error(`Error al eliminar grupo ${id}:`, error);
            throw error;
        }
    }

    /**
     * Valida los datos de un grupo
     * @param {Object} grupo - Datos del grupo
     * @returns {Object} Objeto con validación {isValid: boolean, errors: Array}
     */
    validate(grupo) {
        const errors = [];

        if (!grupo.nombre || grupo.nombre.trim() === '') {
            errors.push('El nombre del grupo es requerido');
        }

        if (!grupo.grado || grupo.grado < 1 || grupo.grado > 6) {
            errors.push('El grado debe ser un número entre 1 y 6');
        }

        // idPeriodo e idDocente son REQUERIDOS por el backend
        if (!grupo.idPeriodo) {
            errors.push('El periodo es requerido');
        } else {
            const periodoNum = Number(grupo.idPeriodo);
            if (isNaN(periodoNum) || periodoNum <= 0) {
                errors.push('El periodo debe ser un número válido');
            }
        }

        if (!grupo.idDocente) {
            errors.push('El docente es requerido');
        } else {
            const docenteNum = Number(grupo.idDocente);
            if (isNaN(docenteNum) || docenteNum <= 0) {
                errors.push('El docente debe ser un número válido');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Crear instancia global
const gruposService = new GruposService();

// Helper: normaliza la estructura de un grupo recibida desde la API
function normalizeGrupo(g) {
    if (!g || typeof g !== 'object') return g;

    const out = { ...g };

    // id normalization
    if (out.idGrupo && !out.id) out.id = out.idGrupo;

    // idPeriodo puede venir como { idPeriodo: N } o { id: N }
    if (out.idPeriodo && typeof out.idPeriodo === 'object') {
        out.idPeriodo = out.idPeriodo.idPeriodo || out.idPeriodo.id || out.idPeriodo;
    }

    // idDocente puede venir como objeto con id_usuario
    if (out.idDocente && typeof out.idDocente === 'object') {
        const docente = { ...out.idDocente };
        if (docente.id_usuario && !docente.id) docente.id = docente.id_usuario;
        out.idDocente = docente;
    }

    // Trim string fields
    ['nombre'].forEach(k => {
        if (typeof out[k] === 'string') out[k] = out[k].trim();
    });

    return out;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GruposService, gruposService };
}