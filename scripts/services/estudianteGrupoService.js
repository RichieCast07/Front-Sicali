class EstudianteGrupoService {
    /**
     * Obtiene todas las inscripciones
     * @returns {Promise<Array>} Lista de inscripciones
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ESTUDIANTE_GRUPO.LIST);
            if (response.success) {
                return Array.isArray(response.data) 
                    ? response.data.map(normalizeEstudianteGrupo)
                    : [];
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener inscripciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene inscripciones por estudiante
     * @param {number} idEstudiante - ID del estudiante
     * @returns {Promise<Array>} Lista de grupos del estudiante
     */
    async getByEstudiante(idEstudiante) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ESTUDIANTE_GRUPO.BY_ESTUDIANTE(idEstudiante));
            if (response.success) {
                return Array.isArray(response.data)
                    ? response.data.map(normalizeEstudianteGrupo)
                    : [];
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener inscripciones del estudiante ${idEstudiante}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene estudiantes por grupo
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<Array>} Lista de estudiantes del grupo
     */
    async getByGrupo(idGrupo) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ESTUDIANTE_GRUPO.BY_GRUPO(idGrupo));
            if (response.success) {
                return Array.isArray(response.data)
                    ? response.data.map(normalizeEstudianteGrupo)
                    : [];
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener estudiantes del grupo ${idGrupo}:`, error);
            throw error;
        }
    }

    /**
     * Inscribe un estudiante en un grupo
     * @param {Object} inscripcion - Datos de la inscripción
     * @param {number} inscripcion.idEstudiante - ID del estudiante
     * @param {number} inscripcion.idGrupo - ID del grupo
     * @param {string} inscripcion.fechaInscripcion - Fecha de inscripción (YYYY-MM-DD)
     * @param {string} inscripcion.estado - Estado (Activo, Inactivo)
     * @returns {Promise<Object>} Inscripción creada
     */
    async create(inscripcion) {
        try {
            // El backend espera objetos anidados, no IDs directos
            const payload = {
                estudiante: {
                    id_usuario: Number(inscripcion.idEstudiante)
                },
                grupo: {
                    idGrupo: Number(inscripcion.idGrupo)
                },
                fechaInscripcion: typeof inscripcion.fechaInscripcion === 'string' ? inscripcion.fechaInscripcion.trim() : inscripcion.fechaInscripcion,
                estado: typeof inscripcion.estado === 'string' ? inscripcion.estado.trim() : inscripcion.estado
            };

            // Validar IDs antes de enviar
            if (!payload.estudiante.id_usuario || payload.estudiante.id_usuario <= 0) {
                throw new Error('ID de estudiante inválido');
            }
            if (!payload.grupo.idGrupo || payload.grupo.idGrupo <= 0) {
                throw new Error('ID de grupo inválido');
            }
            if (!payload.fechaInscripcion) {
                throw new Error('Fecha de inscripción requerida');
            }
            if (!payload.estado) {
                throw new Error('Estado requerido');
            }

            const response = await httpClient.post(API_CONFIG.ENDPOINTS.ESTUDIANTE_GRUPO.CREATE, payload);
            if (response.success) {
                return normalizeEstudianteGrupo(response.data);
            }

            // Surface conflict errors (e.g., duplicate enrollment)
            if (response.status === 409 && response.data && response.data.error) {
                throw new Error(response.data.error);
            }

            throw new Error(response.message);
        } catch (error) {
            console.error('Error al inscribir estudiante:', error);
            throw error;
        }
    }

    /**
     * Inscribe múltiples estudiantes en un grupo
     * @param {number} idGrupo - ID del grupo
     * @param {Array<number>} estudiantes - IDs de estudiantes
     * @param {string} fechaInscripcion - Fecha de inscripción
     * @returns {Promise<Array>} Inscripciones creadas
     */
    async enrollMultiple(idGrupo, estudiantes, fechaInscripcion) {
        try {
            const inscripciones = estudiantes.map(idEstudiante => ({
                idEstudiante,
                idGrupo,
                fechaInscripcion,
                estado: 'Activo'
            }));

            const promises = inscripciones.map(inscripcion => this.create(inscripcion));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error al inscribir múltiples estudiantes:', error);
            throw error;
        }
    }

    /**
     * Da de baja a un estudiante de un grupo
     * @param {number} idEstudiante - ID del estudiante
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async delete(idEstudiante, idGrupo) {
        try {
            const response = await httpClient.delete(
                API_CONFIG.ENDPOINTS.ESTUDIANTE_GRUPO.DELETE(idEstudiante, idGrupo)
            );
            return response.success;
        } catch (error) {
            console.error(`Error al dar de baja estudiante ${idEstudiante} del grupo ${idGrupo}:`, error);
            throw error;
        }
    }

    /**
     * Valida los datos de una inscripción
     * @param {Object} inscripcion - Datos de la inscripción
     * @returns {Object} Objeto con validación {isValid: boolean, errors: Array}
     */
    validate(inscripcion) {
        const errors = [];

        if (!inscripcion.idEstudiante) {
            errors.push('El estudiante es requerido');
        }

        if (!inscripcion.idGrupo) {
            errors.push('El grupo es requerido');
        }

        if (!inscripcion.fechaInscripcion) {
            errors.push('La fecha de inscripción es requerida');
        }

        if (!inscripcion.estado || !['Activo', 'Inactivo'].includes(inscripcion.estado)) {
            errors.push('El estado debe ser Activo o Inactivo');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Verifica si un estudiante ya está inscrito en un grupo
     * @param {number} idEstudiante - ID del estudiante
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<boolean>} True si ya está inscrito
     */
    async isEnrolled(idEstudiante, idGrupo) {
        try {
            const inscripciones = await this.getByEstudiante(idEstudiante);
            return inscripciones.some(insc => 
                insc.grupo.idGrupo === idGrupo && insc.estado === 'Activo'
            );
        } catch (error) {
            console.error('Error al verificar inscripción:', error);
            return false;
        }
    }

    /**
     * Obtiene el conteo de estudiantes por grupo
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<number>} Cantidad de estudiantes activos
     */
    async countByGrupo(idGrupo) {
        try {
            const estudiantes = await this.getByGrupo(idGrupo);
            return estudiantes.filter(e => e.estado === 'Activo').length;
        } catch (error) {
            console.error('Error al contar estudiantes del grupo:', error);
            return 0;
        }
    }
}

// Crear instancia global
const estudianteGrupoService = new EstudianteGrupoService();

// Helper: normaliza la estructura de una inscripción recibida desde la API
function normalizeEstudianteGrupo(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const out = { ...obj };

    // estudiante puede venir como { id_usuario, nombre }
    if (out.estudiante && typeof out.estudiante === 'object') {
        const est = { ...out.estudiante };
        if (est.id_usuario && !est.id) est.id = est.id_usuario;
        out.estudiante = est;
        // Extraer idEstudiante para fácil acceso
        if (est.id_usuario && !out.idEstudiante) {
            out.idEstudiante = est.id_usuario;
        }
    }

    // grupo puede venir como { idGrupo, nombre }
    if (out.grupo && typeof out.grupo === 'object') {
        const g = { ...out.grupo };
        if (g.idGrupo && !g.id) g.id = g.idGrupo;
        out.grupo = g;
        // Extraer idGrupo para fácil acceso
        if (g.idGrupo && !out.idGrupo) {
            out.idGrupo = g.idGrupo;
        }
    }

    return out;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EstudianteGrupoService, estudianteGrupoService };
}
