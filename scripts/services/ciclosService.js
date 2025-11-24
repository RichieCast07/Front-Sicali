
class CiclosService {
    /**
     * Obtiene todos los ciclos
     * @returns {Promise<Array>} Lista de ciclos
     */
    async getAll() {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.CICLOS.LIST);
            if (response.success) {
                // Normalizar idCiclo -> id para compatibilidad con la UI
                if (Array.isArray(response.data)) {
                    return response.data.map(item => {
                        if (item && item.idCiclo && !item.id) item.id = item.idCiclo;
                        return item;
                    });
                }
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al obtener ciclos:', error);
            throw error;
        }
    }

    /**
     * Obtiene un ciclo por ID
     * @param {number} id - ID del ciclo
     * @returns {Promise<Object>} Ciclo encontrado
     */
    async getById(id) {
        try {
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.CICLOS.GET_BY_ID(id));
            if (response.success) {
                // Normalizar respuesta -> id
                if (response.data && response.data.idCiclo && !response.data.id) {
                    response.data.id = response.data.idCiclo;
                }
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al obtener ciclo ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crea un nuevo ciclo
     * @param {Object} ciclo - Datos del ciclo
     * @param {string} ciclo.nombre - Nombre del ciclo
     * @param {string} ciclo.fechaInicio - Fecha de inicio (YYYY-MM-DD)
     * @param {string} ciclo.fechaFin - Fecha de fin (YYYY-MM-DD)
     * @returns {Promise<Object>} Ciclo creado
     */
    async create(ciclo) {
        try {
            const response = await httpClient.post(API_CONFIG.ENDPOINTS.CICLOS.CREATE, ciclo);
            if (response.success) {
                // Normalizar idCiclo -> id
                if (response.data && response.data.idCiclo && !response.data.id) {
                    response.data.id = response.data.idCiclo;
                }
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error('Error al crear ciclo:', error);
            throw error;
        }
    }

    /**
     * Actualiza un ciclo existente
     * @param {number} id - ID del ciclo
     * @param {Object} ciclo - Datos actualizados
     * @returns {Promise<Object>} Ciclo actualizado
     */
    async update(id, ciclo) {
        try {
            const response = await httpClient.put(API_CONFIG.ENDPOINTS.CICLOS.UPDATE(id), ciclo);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            console.error(`Error al actualizar ciclo ${id}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un ciclo
     * @param {number} id - ID del ciclo
     * @returns {Promise<boolean>} Resultado de la operación
     */
    async delete(id) {
        try {
            const response = await httpClient.delete(API_CONFIG.ENDPOINTS.CICLOS.DELETE(id));
            return response.success;
        } catch (error) {
            console.error(`Error al eliminar ciclo ${id}:`, error);
            throw error;
        }
    }

    /**
     * Valida los datos de un ciclo
     * @param {Object} ciclo - Datos del ciclo
     * @returns {Object} Objeto con validación {isValid: boolean, errors: Array}
     */
    validate(ciclo) {
        const errors = [];

        if (!ciclo.nombre || ciclo.nombre.trim() === '') {
            errors.push('El nombre del ciclo es requerido');
        }

        if (!ciclo.fechaInicio) {
            errors.push('La fecha de inicio es requerida');
        }

        if (!ciclo.fechaFin) {
            errors.push('La fecha de fin es requerida');
        }

        if (ciclo.fechaInicio && ciclo.fechaFin) {
            const inicio = new Date(ciclo.fechaInicio);
            const fin = new Date(ciclo.fechaFin);
            
            if (inicio >= fin) {
                errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Crear instancia global
const ciclosService = new CiclosService();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CiclosService, ciclosService };
}