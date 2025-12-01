class AsistenciaService {
    /**
     * Obtiene todas las asistencias
     * @returns {Promise<Array>} Lista de asistencias
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASISTENCIA.LIST);
            if (response.success) {
                const asistencias = Array.isArray(response.data) ? response.data : [];
                return asistencias.map(asist => this.normalizeAsistencia(asist));
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener asistencias:', error);
            // Si hay error de backend, retornar array vacío
            console.warn('⚠️ Retornando array vacío debido a error en backend:', error.message);
            return [];
        }
    }

    /**
     * Obtiene una asistencia por ID
     * @param {number} id - ID de la asistencia
     * @returns {Promise<Object>} Asistencia encontrada
     */
    async getById(id) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASISTENCIA.GET_BY_ID(id));
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener asistencia ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene asistencias por estudiante
     * @param {number} idEstudiante - ID del estudiante
     * @returns {Promise<Array>} Lista de asistencias del estudiante
     */
    async getByEstudiante(idEstudiante) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASISTENCIA.BY_ESTUDIANTE(idEstudiante));
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener asistencias del estudiante ${idEstudiante}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene asistencias por grupo
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<Array>} Lista de asistencias del grupo
     */
    async getByGrupo(idGrupo) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASISTENCIA.BY_GRUPO(idGrupo));
            if (response.success) {
                // Normalizar respuesta (puede venir como array directo o dentro de data)
                const asistencias = Array.isArray(response.data) ? response.data : [];
                return asistencias.map(asist => this.normalizeAsistencia(asist));
            }
            throw new Error(response.message || 'Error al obtener asistencias del grupo');
        } catch (error) {
            console.error(`Error al obtener asistencias del grupo ${idGrupo}:`, error);
            // Si hay error de backend, retornar array vacío para no bloquear la UI
            console.warn('⚠️ Retornando array vacío debido a error en backend:', error.message);
            return [];
        }
    }

    /**
     * Obtiene asistencias por fecha
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>} Lista de asistencias de la fecha
     */
    async getByFecha(fecha) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASISTENCIA.BY_FECHA(fecha));
            if (response.success) {
                const asistencias = Array.isArray(response.data) ? response.data : [];
                return asistencias.map(asist => this.normalizeAsistencia(asist));
            }
            throw new Error(response.message || 'Error al obtener asistencias de la fecha');
        } catch (error) {
            console.error(`Error al obtener asistencias de la fecha ${fecha}:`, error);
            throw error;
        }
    }

    /**
     * Normaliza una asistencia del backend (maneja objetos anidados)
     * @param {Object} asistencia - Asistencia del backend
     * @returns {Object} Asistencia normalizada
     */
    normalizeAsistencia(asistencia) {
        if (!asistencia) return null;

        // El backend retorna objetos anidados en la respuesta
        // Extraer IDs de objetos anidados si existen
        let idEstudiante = asistencia.idEstudiante;
        let idGrupo = asistencia.idGrupo;
        
        // Si son objetos, extraer el ID
        if (typeof idEstudiante === 'object' && idEstudiante !== null) {
            idEstudiante = idEstudiante.id_usuario;
        }
        
        if (typeof idGrupo === 'object' && idGrupo !== null) {
            idGrupo = idGrupo.idGrupo;
        }

        return {
            idAsistencia: asistencia.idAsistencia,
            idEstudiante: idEstudiante,
            idGrupo: idGrupo,
            fecha: asistencia.fecha,
            estado: asistencia.estado,
            estudiante: typeof asistencia.idEstudiante === 'object' ? asistencia.idEstudiante : null,
            grupo: typeof asistencia.idGrupo === 'object' ? asistencia.idGrupo : null
        };
    }

    /**
     * Registra una nueva asistencia
     * @param {Object} asistencia - Datos de la asistencia
     * @param {number} asistencia.idEstudiante - ID del estudiante
     * @param {number} asistencia.idGrupo - ID del grupo
     * @param {string} asistencia.fecha - Fecha (YYYY-MM-DD)
     * @param {string} asistencia.estado - Estado (Asistencia, Falta, Permiso, Retardo)
     * @param {boolean} skipValidation - Saltar validación (para objetos anidados)
     * @returns {Promise<Object>} Asistencia creada
     */
    async create(asistencia, skipValidation = false) {
        try {
            if (!skipValidation) {
                const validation = this.validate(asistencia);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }

            // El backend de Asistencias usa IDs simples, NO objetos anidados
            const payload = {
                idEstudiante: Number(asistencia.idEstudiante),
                idGrupo: Number(asistencia.idGrupo),
                fecha: asistencia.fecha,
                estado: asistencia.estado
            };

            console.log('📤 Enviando asistencia al backend:', payload);

            const response = await httpClient.post(API_CONFIG.ENDPOINTS.ASISTENCIA.CREATE, payload);
            if (response.success) {
                console.log('✅ Asistencia creada:', response.data);
                return this.normalizeAsistencia(response.data);
            }
            throw new Error(response.message || 'Error al crear asistencia');
        } catch (error) {
            console.error('Error al registrar asistencia:', error);
            throw error;
        }
    }

    /**
     * Registra asistencias masivas para un grupo
     * @param {number} idGrupo - ID del grupo
     * @param {string} fecha - Fecha de asistencia
     * @param {Array} estudiantes - Lista de estudiantes con su estado
     * @returns {Promise<Array>} Asistencias creadas
     */
    async createBulk(idGrupo, fecha, estudiantes) {
        try {
            const asistencias = estudiantes.map(estudiante => ({
                idEstudiante: estudiante.id_usuario,
                idGrupo: idGrupo,
                fecha: fecha,
                estado: estudiante.estado || 'Asistencia'
            }));

            const promises = asistencias.map(asistencia => this.create(asistencia));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error al registrar asistencias masivas:', error);
            throw error;
        }
    }

    /**
     * Actualiza una asistencia existente
     * @param {number} id - ID de la asistencia
     * @param {Object} asistencia - Datos actualizados
     * @returns {Promise<Object>} Asistencia actualizada
     */
    async update(id, asistencia) {
        try {
            // El backend de Asistencias usa IDs simples, NO objetos anidados
            const payload = {
                idEstudiante: Number(asistencia.idEstudiante),
                idGrupo: Number(asistencia.idGrupo),
                fecha: asistencia.fecha,
                estado: asistencia.estado
            };

            console.log('📤 Actualizando asistencia:', payload);

            const response = await httpClient.put(API_CONFIG.ENDPOINTS.ASISTENCIA.UPDATE(id), payload);
            if (response.success) {
                console.log('✅ Asistencia actualizada:', response.data);
                return this.normalizeAsistencia(response.data);
            }
            throw new Error(response.message || 'Error al actualizar asistencia');
        } catch (error) {
            console.error(`Error al actualizar asistencia ${id}:`, error);
            throw error;
        }
    }

    /**
     * Elimina una asistencia
     * @param {number} id - ID de la asistencia
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async delete(id) {
        try {
            const response = await httpClient.delete(API_CONFIG.ENDPOINTS.ASISTENCIA.DELETE(id));
            return response.success;
        } catch (error) {
            console.error(`Error al eliminar asistencia ${id}:`, error);
            throw error;
        }
    }

    /**
     * Valida los datos de una asistencia
     * @param {Object} asistencia - Datos de la asistencia
     * @returns {Object} Objeto con validación {isValid: boolean, errors: Array}
     */
    validate(asistencia) {
        const errors = [];
        // Backend solo acepta estos 3 estados (enum EstadoAsistencia)
        const estadosValidos = ['Asistencia', 'Falta', 'Permiso'];

        if (!asistencia.idEstudiante) {
            errors.push('El estudiante es requerido');
        }

        if (!asistencia.idGrupo) {
            errors.push('El grupo es requerido');
        }

        if (!asistencia.fecha) {
            errors.push('La fecha es requerida');
        } else {
            // Validar formato de fecha
            const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!fechaRegex.test(asistencia.fecha)) {
                errors.push('El formato de fecha debe ser YYYY-MM-DD');
            }
        }

        if (!asistencia.estado || !estadosValidos.includes(asistencia.estado)) {
            errors.push('El estado debe ser: Asistencia, Falta o Permiso');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calcula el porcentaje de asistencia de un estudiante en un grupo
     * GET /api/asistencias/porcentaje/{idEstudiante}/{idGrupo}
     * @param {number} idEstudiante - ID del estudiante
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<number>} Porcentaje de asistencia (0-100)
     */
    async getPorcentajeAsistencia(idEstudiante, idGrupo) {
        try {
            const response = await httpClient.get(
                API_CONFIG.ENDPOINTS.ASISTENCIA.PORCENTAJE(idEstudiante, idGrupo)
            );
            if (response.success) {
                // Backend puede retornar número directamente o en response.data
                return typeof response.data === 'number' ? response.data : parseFloat(response.data) || 0;
            }
            throw new Error(response.message || 'Error al calcular porcentaje');
        } catch (error) {
            console.warn(`⚠️ Error al calcular porcentaje de asistencia:`, error.message);
            return 0;
        }
    }

    /**
     * Calcula estadísticas de asistencia para un estudiante (local)
     * @param {Array} asistencias - Lista de asistencias
     * @returns {Object} Estadísticas calculadas
     */
    calcularEstadisticas(asistencias) {
        const total = asistencias.length;
        const porEstado = {
            Asistencia: 0,
            Falta: 0,
            Permiso: 0
        };

        asistencias.forEach(asistencia => {
            if (porEstado.hasOwnProperty(asistencia.estado)) {
                porEstado[asistencia.estado]++;
            }
        });

        return {
            total,
            asistencias: porEstado.Asistencia,
            faltas: porEstado.Falta,
            permisos: porEstado.Permiso,
            porcentajeAsistencia: total > 0 ? ((porEstado.Asistencia / total) * 100).toFixed(2) : 0
        };
    }
}

// Crear instancia global
const asistenciaService = new AsistenciaService();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsistenciaService, asistenciaService };
}
