class AsistenciaService {
    /**
     * Obtiene todas las asistencias
     * @returns {Promise<Array>} Lista de asistencias
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASISTENCIA.LIST);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener asistencias:', error);
            throw error;
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
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener asistencias del grupo ${idGrupo}:`, error);
            throw error;
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
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener asistencias de la fecha ${fecha}:`, error);
            throw error;
        }
    }

    /**
     * Registra una nueva asistencia
     * @param {Object} asistencia - Datos de la asistencia
     * @param {number} asistencia.idEstudiante - ID del estudiante
     * @param {number} asistencia.idGrupo - ID del grupo
     * @param {string} asistencia.fecha - Fecha (YYYY-MM-DD)
     * @param {string} asistencia.estado - Estado (Asistencia, Falta, Retardo, Justificada)
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

            const response = await httpClient.post(API_CONFIG.ENDPOINTS.ASISTENCIA.CREATE, asistencia);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message);
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
            const response = await httpClient.put(API_CONFIG.ENDPOINTS.ASISTENCIA.UPDATE(id), asistencia);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message);
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
        const estadosValidos = ['Asistencia', 'Falta', 'Retardo', 'Justificada'];

        if (!asistencia.idEstudiante) {
            errors.push('El estudiante es requerido');
        }

        if (!asistencia.idGrupo) {
            errors.push('El grupo es requerido');
        }

        if (!asistencia.fecha) {
            errors.push('La fecha es requerida');
        } else {
            const fecha = new Date(asistencia.fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            if (fecha > hoy) {
                errors.push('No se puede registrar asistencia de fechas futuras');
            }
        }

        if (!asistencia.estado || !estadosValidos.includes(asistencia.estado)) {
            errors.push('El estado debe ser: Asistencia, Falta, Retardo o Justificada');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calcula estadísticas de asistencia para un estudiante
     * @param {Array} asistencias - Lista de asistencias
     * @returns {Object} Estadísticas calculadas
     */
    calcularEstadisticas(asistencias) {
        const total = asistencias.length;
        const porEstado = {
            Asistencia: 0,
            Falta: 0,
            Retardo: 0,
            Justificada: 0
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
            retardos: porEstado.Retardo,
            justificadas: porEstado.Justificada,
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
