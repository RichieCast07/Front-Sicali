
class GrupoAsignaturaService {
    /**
     * Obtiene todas las asignaciones grupo-asignatura
     * @returns {Promise<Array>} Lista de asignaciones
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPO_ASIGNATURA.LIST);
            if (response.success) {
                if (Array.isArray(response.data)) return response.data.map(a => normalizeGrupoAsignatura(a));
                return normalizeGrupoAsignatura(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener asignaciones grupo-asignatura:', error);
            throw error;
        }
    }

    /**
     * Obtiene una asignación por ID
     * @param {number} id - ID de la asignación
     * @returns {Promise<Object>} Asignación encontrada
     */
    async getById(id) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPO_ASIGNATURA.GET_BY_ID(id));
            if (response.success) {
                return normalizeGrupoAsignatura(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener asignación ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene asignaturas por grupo
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<Array>} Lista de asignaturas del grupo
     */
    async getByGrupo(idGrupo) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.GRUPO_ASIGNATURA.BY_GRUPO(idGrupo));
            if (response.success) {
                if (Array.isArray(response.data)) return response.data.map(a => normalizeGrupoAsignatura(a));
                return normalizeGrupoAsignatura(response.data);
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener asignaturas del grupo ${idGrupo}:`, error);
            throw error;
        }
    }

    /**
     * Asigna una asignatura a un grupo
     * @param {Object} asignacion - Datos de la asignación
     * @param {number} asignacion.idGrupo - ID del grupo
     * @param {number} asignacion.idAsignatura - ID de la asignatura
     * @returns {Promise<Object>} Asignación creada
     */
    async create(asignacion) {
        try {
            // sanitize and coerce
            const payload = {
                idGrupo: Number(asignacion.idGrupo),
                idAsignatura: Number(asignacion.idAsignatura)
            };

            const validation = this.validate(payload);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            const response = await httpClient.post(API_CONFIG.ENDPOINTS.GRUPO_ASIGNATURA.CREATE, payload);
            if (response.success) {
                return normalizeGrupoAsignatura(response.data);
            }

            if (response.status === 409 && response.data && response.data.error) {
                throw new Error(response.data.error);
            }

            throw new Error(response.message);
        } catch (error) {
            console.error('Error al asignar asignatura a grupo:', error);
            throw error;
        }
    }

    /**
     * Asigna múltiples asignaturas a un grupo
     * @param {number} idGrupo - ID del grupo
     * @param {Array<number>} asignaturas - IDs de asignaturas
     * @returns {Promise<Array>} Asignaciones creadas
     */
    async assignMultiple(idGrupo, asignaturas) {
        try {
            const asignaciones = asignaturas.map(idAsignatura => ({
                idGrupo,
                idAsignatura
            }));

            const promises = asignaciones.map(asignacion => this.create(asignacion));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error al asignar múltiples asignaturas:', error);
            throw error;
        }
    }

    /**
     * Elimina una asignación de asignatura de un grupo
     * @param {number} id - ID de la asignación
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async delete(id) {
        try {
            const response = await httpClient.delete(API_CONFIG.ENDPOINTS.GRUPO_ASIGNATURA.DELETE(id));
            return response.success;
        } catch (error) {
            console.error(`Error al eliminar asignación ${id}:`, error);
            throw error;
        }
    }

    /**
     * Valida los datos de una asignación
     * @param {Object} asignacion - Datos de la asignación
     * @returns {Object} Objeto con validación {isValid: boolean, errors: Array}
     */
    validate(asignacion) {
        const errors = [];

        if (!asignacion.idGrupo) {
            errors.push('El grupo es requerido');
        }

        if (!asignacion.idAsignatura) {
            errors.push('La asignatura es requerida');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Verifica si una asignatura ya está asignada a un grupo
     * @param {number} idGrupo - ID del grupo
     * @param {number} idAsignatura - ID de la asignatura
     * @returns {Promise<boolean>} True si ya está asignada
     */
    async isAssigned(idGrupo, idAsignatura) {
        try {
            const asignaciones = await this.getByGrupo(idGrupo);
            return asignaciones.some(asig => {
                const a = asig.idAsignatura;
                if (!a) return false;
                return Number(a.id || a.idAsignatura || a) === Number(idAsignatura);
            });
        } catch (error) {
            console.error('Error al verificar asignación:', error);
            return false;
        }
    }

    /**
     * Obtiene el conteo de asignaturas de un grupo
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<number>} Cantidad de asignaturas
     */
    async countByGrupo(idGrupo) {
        try {
            const asignaturas = await this.getByGrupo(idGrupo);
            return asignaturas.length;
        } catch (error) {
            console.error('Error al contar asignaturas del grupo:', error);
            return 0;
        }
    }
}

// Crear instancia global
const grupoAsignaturaService = new GrupoAsignaturaService();

// Helper: normaliza la estructura de una asignación grupo-asignatura recibida desde la API
function normalizeGrupoAsignatura(a) {
    if (!a || typeof a !== 'object') return a;

    const out = { ...a };

    // id normalization
    if (out.idGrupoAsignatura && !out.id) out.id = out.idGrupoAsignatura;

    if (out.idGrupo && typeof out.idGrupo === 'object') {
        // some APIs may return nested object, but examples show plain number
        out.idGrupo = out.idGrupo.idGrupo || out.idGrupo.id || out.idGrupo;
    }

    // idAsignatura may be nested object with idAsignatura
    if (out.idAsignatura && typeof out.idAsignatura === 'object') {
        const asig = { ...out.idAsignatura };
        if (asig.idAsignatura && !asig.id) asig.id = asig.idAsignatura;
        out.idAsignatura = asig;
    }

    return out;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GrupoAsignaturaService, grupoAsignaturaService };
}