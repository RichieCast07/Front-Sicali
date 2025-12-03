/**
 * Servicio para manejo de calificaciones
 */
class CalificacionesService {
    constructor() {
        this.endpoints = API_CONFIG.ENDPOINTS.CALIFICACIONES;
        this.asignaturasCache = null; // Caché de asignaturas
    }

    /**
     * Obtiene y cachea todas las asignaturas
     * @private
     * @returns {Promise<Object>} Mapa de idAsignatura -> nombre
     */
    async obtenerAsignaturas() {
        if (this.asignaturasCache !== null) {
            return this.asignaturasCache;
        }

        try {
            console.log('[CalificacionesService] Obteniendo asignaturas...');
            const response = await httpClient.get(API_CONFIG.ENDPOINTS.ASIGNATURAS.LIST);
            
            let asignaturas = [];
            if (response.data) {
                asignaturas = Array.isArray(response.data) ? response.data : [response.data];
            } else if (Array.isArray(response)) {
                asignaturas = response;
            }

            // Crear mapa: idAsignatura -> nombre
            this.asignaturasCache = {};
            asignaturas.forEach(asig => {
                const id = asig.idAsignatura || asig.id;
                const nombre = asig.nombre || asig.name || 'Sin nombre';
                if (id) {
                    this.asignaturasCache[id] = nombre;
                }
            });

            console.log('[CalificacionesService] Asignaturas en caché:', this.asignaturasCache);
            return this.asignaturasCache;
        } catch (error) {
            console.error('[CalificacionesService] Error al obtener asignaturas:', error);
            return {};
        }
    }

    /**
     * Normaliza datos de calificación del backend
     * @private
     */
    normalizeCalificacion(data) {
        if (!data) return null;
        
        return {
            idCalificacion: data.idCalificacion || data.id,
            idEstudiante: data.idEstudiante || data.estudiante?.id_usuario,
            idGrupo: data.idGrupo || data.grupo?.idGrupo,
            idAsignatura: data.idAsignatura || data.asignatura?.idAsignatura,
            calificacion1: data.calificacion1,
            calificacion2: data.calificacion2,
            calificacion3: data.calificacion3,
            calificacion4: data.calificacion4,
            promedio: data.promedio,
            // Datos adicionales del estudiante (si vienen del backend)
            nombreEstudiante: data.estudiante?.nombre,
            apellidosEstudiante: data.estudiante?.apellidos,
            // Datos adicionales del grupo
            nombreGrupo: data.grupo?.nombre,
            // Datos adicionales de la asignatura
            nombreAsignatura: data.asignatura?.nombre
        };
    }

    /**
     * Valida una calificación
     * @private
     */
    validateCalificacion(calificacion) {
        const califs = [
            calificacion.calificacion1,
            calificacion.calificacion2,
            calificacion.calificacion3,
            calificacion.calificacion4
        ];

        for (let i = 0; i < califs.length; i++) {
            const calif = califs[i];
            if (calif !== null && calif !== undefined) {
                const num = Number(calif);
                if (isNaN(num) || num < 0 || num > 10) {
                    throw new Error(`Calificación ${i + 1} debe estar entre 0 y 10`);
                }
            }
        }
    }

    /**
     * Calcula el promedio de las calificaciones
     * @private
     */
    calcularPromedio(calificacion) {
        const califs = [
            calificacion.calificacion1,
            calificacion.calificacion2,
            calificacion.calificacion3,
            calificacion.calificacion4
        ].filter(c => c !== null && c !== undefined).map(Number);

        if (califs.length === 0) return null;
        
        const suma = califs.reduce((acc, c) => acc + c, 0);
        return Math.round((suma / califs.length) * 100) / 100; // 2 decimales
    }

    /**
     * Obtiene todas las calificaciones
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            console.log('[CalificacionesService] Llamando a:', this.endpoints.LIST);
            const response = await httpClient.get(this.endpoints.LIST);
            
            console.log('[CalificacionesService] Respuesta recibida:', {
                tieneSuccess: response && typeof response.success !== 'undefined',
                success: response?.success,
                tieneData: response && typeof response.data !== 'undefined',
                dataEsArray: Array.isArray(response?.data),
                datos: response
            });
            
            // Verificar que la respuesta fue exitosa
            if (!response) {
                console.warn('[CalificacionesService] Respuesta vacía');
                return [];
            }
            
            // Extraer datos de la respuesta
            let datos = [];
            
            // Si viene con estructura { data: [], success: true }
            if (response.data !== undefined) {
                if (Array.isArray(response.data)) {
                    datos = response.data;
                } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
                    datos = response.data.data;
                }
            }
            // Si viene como array directo
            else if (Array.isArray(response)) {
                datos = response;
            }
            
            console.log('[CalificacionesService] Datos a procesar:', datos.length, 'registros');
            
            const resultado = datos.map(c => this.normalizeCalificacion(c)).filter(c => c !== null);
            console.log('[CalificacionesService] Datos normalizados:', resultado.length, 'registros');
            
            // Enriquecer con nombres de asignaturas
            const asignaturasMap = await this.obtenerAsignaturas();
            resultado.forEach(cal => {
                if (cal.idAsignatura && asignaturasMap[cal.idAsignatura]) {
                    cal.nombreAsignatura = asignaturasMap[cal.idAsignatura];
                }
            });
            
            console.log('[CalificacionesService] Datos enriquecidos con asignaturas');
            
            return resultado;
        } catch (error) {
            console.error('[CalificacionesService] Error al obtener calificaciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene una calificación por ID
     * @param {number} id - ID de la calificación
     * @returns {Promise<Object>}
     */
    async getById(id) {
        try {
            const response = await httpClient.get(this.endpoints.GET_BY_ID(id));
            
            if (!response || !response.success) {
                throw new Error(response?.message || 'Error al obtener calificación');
            }
            
            const resultado = this.normalizeCalificacion(response.data);
            
            // Enriquecer con nombre de asignatura
            if (resultado && resultado.idAsignatura) {
                const asignaturasMap = await this.obtenerAsignaturas();
                if (asignaturasMap[resultado.idAsignatura]) {
                    resultado.nombreAsignatura = asignaturasMap[resultado.idAsignatura];
                }
            }
            
            return resultado;
        } catch (error) {
            console.error(`Error al obtener calificación ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene calificaciones de un estudiante
     * @param {number} idEstudiante - ID del estudiante
     * @returns {Promise<Array>}
     */
    async getByEstudiante(idEstudiante) {
        try {
            console.log('[CalificacionesService] Obteniendo calificaciones para estudiante:', idEstudiante);
            const response = await httpClient.get(this.endpoints.BY_ESTUDIANTE(idEstudiante));
            
            console.log('[CalificacionesService] Respuesta para estudiante:', {
                tieneSuccess: response && typeof response.success !== 'undefined',
                success: response?.success,
                dataEsArray: Array.isArray(response?.data),
                cantidad: Array.isArray(response?.data) ? response.data.length : 0
            });
            
            if (!response || !response.success) {
                console.warn('[CalificacionesService] Respuesta no exitosa para estudiante:', response?.message);
                return [];
            }
            
            // Extraer datos de la respuesta
            let datos = [];
            if (Array.isArray(response.data)) {
                datos = response.data;
            }
            
            const resultado = datos.map(c => this.normalizeCalificacion(c));
            
            // Enriquecer con nombres de asignaturas
            const asignaturasMap = await this.obtenerAsignaturas();
            resultado.forEach(cal => {
                if (cal.idAsignatura && asignaturasMap[cal.idAsignatura]) {
                    cal.nombreAsignatura = asignaturasMap[cal.idAsignatura];
                }
            });
            
            return resultado;
        } catch (error) {
            console.error(`[CalificacionesService] Error al obtener calificaciones del estudiante ${idEstudiante}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene calificaciones de un grupo
     * @param {number} idGrupo - ID del grupo
     * @returns {Promise<Array>}
     */
    async getByGrupo(idGrupo) {
        try {
            console.log('[CalificacionesService] Obteniendo calificaciones para grupo:', idGrupo);
            const response = await httpClient.get(this.endpoints.BY_GRUPO(idGrupo));
            
            if (!response || !response.success) {
                console.warn('[CalificacionesService] Respuesta no exitosa para grupo:', response?.message);
                return [];
            }
            
            // Extraer datos de la respuesta
            let datos = [];
            if (Array.isArray(response.data)) {
                datos = response.data;
            }
            
            const resultado = datos.map(c => this.normalizeCalificacion(c));
            
            // Enriquecer con nombres de asignaturas
            const asignaturasMap = await this.obtenerAsignaturas();
            resultado.forEach(cal => {
                if (cal.idAsignatura && asignaturasMap[cal.idAsignatura]) {
                    cal.nombreAsignatura = asignaturasMap[cal.idAsignatura];
                }
            });
            
            return resultado;
        } catch (error) {
            console.error(`[CalificacionesService] Error al obtener calificaciones del grupo ${idGrupo}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene calificaciones de una asignatura
     * @param {number} idAsignatura - ID de la asignatura
     * @returns {Promise<Array>}
     */
    async getByAsignatura(idAsignatura) {
        try {
            const response = await httpClient.get(this.endpoints.BY_ASIGNATURA(idAsignatura));
            
            if (!response || !response.success) {
                console.warn('[CalificacionesService] Respuesta no exitosa para asignatura:', response?.message);
                return [];
            }
            
            // Extraer datos de la respuesta
            let datos = [];
            if (Array.isArray(response.data)) {
                datos = response.data;
            }
            
            const resultado = datos.map(c => this.normalizeCalificacion(c));
            
            // Enriquecer con nombres de asignaturas
            const asignaturasMap = await this.obtenerAsignaturas();
            resultado.forEach(cal => {
                if (cal.idAsignatura && asignaturasMap[cal.idAsignatura]) {
                    cal.nombreAsignatura = asignaturasMap[cal.idAsignatura];
                }
            });
            
            return resultado;
        } catch (error) {
            console.error(`Error al obtener calificaciones de asignatura ${idAsignatura}:`, error);
            throw error;
        }
    }

    /**
     * Crea una nueva calificación
     * @param {Object} calificacion - Datos de la calificación
     * @param {number} calificacion.idEstudiante - ID del estudiante
     * @param {number} calificacion.idGrupo - ID del grupo
     * @param {number} calificacion.idAsignatura - ID de la asignatura
     * @param {number} calificacion.calificacion1 - Calificación del parcial 1 (0-10)
     * @param {number} calificacion.calificacion2 - Calificación del parcial 2 (0-10)
     * @param {number} calificacion.calificacion3 - Calificación del parcial 3 (0-10)
     * @param {number} calificacion.calificacion4 - Calificación del parcial 4 (0-10)
     * @returns {Promise<Object>}
     */
    async create(calificacion) {
        try {
            // Validar calificaciones
            this.validateCalificacion(calificacion);

            // El backend de calificaciones usa IDs simples (como asistencias)
            // NO usa objetos anidados como estudiante-grupo
            const payload = {
                idEstudiante: Number(calificacion.idEstudiante),
                idGrupo: Number(calificacion.idGrupo),
                idAsignatura: Number(calificacion.idAsignatura),
                calificacion1: calificacion.calificacion1 !== null && calificacion.calificacion1 !== undefined 
                    ? Number(calificacion.calificacion1) 
                    : null,
                calificacion2: calificacion.calificacion2 !== null && calificacion.calificacion2 !== undefined 
                    ? Number(calificacion.calificacion2) 
                    : null,
                calificacion3: calificacion.calificacion3 !== null && calificacion.calificacion3 !== undefined 
                    ? Number(calificacion.calificacion3) 
                    : null,
                calificacion4: calificacion.calificacion4 !== null && calificacion.calificacion4 !== undefined 
                    ? Number(calificacion.calificacion4) 
                    : null
            };

            // Validar IDs requeridos
            if (!payload.idEstudiante || payload.idEstudiante <= 0) {
                throw new Error('ID de estudiante inválido');
            }
            if (!payload.idGrupo || payload.idGrupo <= 0) {
                throw new Error('ID de grupo inválido');
            }
            if (!payload.idAsignatura || payload.idAsignatura <= 0) {
                throw new Error('ID de asignatura inválido');
            }

            console.log('Creando calificación con payload:', payload);

            const response = await httpClient.post(this.endpoints.CREATE, payload);
            return this.normalizeCalificacion(response);
        } catch (error) {
            console.error('Error al crear calificación:', error);
            throw error;
        }
    }

    /**
     * Actualiza una calificación existente
     * @param {number} id - ID de la calificación
     * @param {Object} calificacion - Datos actualizados
     * @returns {Promise<Object>}
     */
    async update(id, calificacion) {
        try {
            // Validar calificaciones
            this.validateCalificacion(calificacion);

            const payload = {
                calificacion1: calificacion.calificacion1 !== null && calificacion.calificacion1 !== undefined 
                    ? Number(calificacion.calificacion1) 
                    : null,
                calificacion2: calificacion.calificacion2 !== null && calificacion.calificacion2 !== undefined 
                    ? Number(calificacion.calificacion2) 
                    : null,
                calificacion3: calificacion.calificacion3 !== null && calificacion.calificacion3 !== undefined 
                    ? Number(calificacion.calificacion3) 
                    : null,
                calificacion4: calificacion.calificacion4 !== null && calificacion.calificacion4 !== undefined 
                    ? Number(calificacion.calificacion4) 
                    : null
            };

            console.log(`Actualizando calificación ${id} con payload:`, payload);

            const response = await httpClient.put(this.endpoints.UPDATE(id), payload);
            return this.normalizeCalificacion(response);
        } catch (error) {
            console.error(`Error al actualizar calificación ${id}:`, error);
            throw error;
        }
    }

    /**
     * Elimina una calificación
     * @param {number} id - ID de la calificación
     * @returns {Promise<void>}
     */
    async delete(id) {
        try {
            await httpClient.delete(this.endpoints.DELETE(id));
            console.log(`Calificación ${id} eliminada exitosamente`);
        } catch (error) {
            console.error(`Error al eliminar calificación ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crea calificaciones para todos los estudiantes de un grupo en una asignatura
     * @param {number} idGrupo - ID del grupo
     * @param {number} idAsignatura - ID de la asignatura
     * @param {Array<number>} estudiantes - IDs de estudiantes
     * @returns {Promise<Array>}
     */
    async createBulk(idGrupo, idAsignatura, estudiantes) {
        try {
            const calificaciones = estudiantes.map(idEstudiante => ({
                idEstudiante,
                idGrupo,
                idAsignatura,
                calificacion1: null,
                calificacion2: null,
                calificacion3: null,
                calificacion4: null
            }));

            const promises = calificaciones.map(c => this.create(c));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error al crear calificaciones en lote:', error);
            throw error;
        }
    }

    /**
     * Actualiza múltiples calificaciones de un parcial
     * @param {Array<Object>} calificaciones - Array de {idCalificacion, valor}
     * @param {number} parcial - Número de parcial (1-4)
     * @returns {Promise<Array>}
     */
    async updateParcial(calificaciones, parcial) {
        try {
            if (parcial < 1 || parcial > 4) {
                throw new Error('El parcial debe estar entre 1 y 4');
            }

            const campo = `calificacion${parcial}`;
            const promises = calificaciones.map(c => {
                const update = {
                    calificacion1: null,
                    calificacion2: null,
                    calificacion3: null,
                    calificacion4: null
                };
                update[campo] = c.valor;
                return this.update(c.idCalificacion, update);
            });

            return await Promise.all(promises);
        } catch (error) {
            console.error(`Error al actualizar parcial ${parcial}:`, error);
            throw error;
        }
    }
}

// Instancia global (compatible con global scope)
const calificacionesService = new CalificacionesService();
