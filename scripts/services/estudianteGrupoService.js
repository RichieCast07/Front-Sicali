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
     * @param {string} inscripcion.fechaInscripcion - Fecha de inscripción (YYYY-MM-DD) (opcional)
     * @returns {Promise<Object>} Inscripción creada
     */
    async create(inscripcion) {
        try {
            const idEstudiante = Number(inscripcion.idEstudiante);
            const idGrupo = Number(inscripcion.idGrupo);

            // Validar IDs antes de continuar
            if (!idEstudiante || idEstudiante <= 0) {
                throw new Error('ID de estudiante inválido');
            }
            if (!idGrupo || idGrupo <= 0) {
                throw new Error('ID de grupo inválido');
            }

            // ⚠️ VALIDACIÓN: Un estudiante solo puede estar en un grupo activo
            // Si ya está inscrito en otro grupo, se permite el CAMBIO DE SALÓN
            console.log(`🔍 Verificando si estudiante ${idEstudiante} ya está inscrito en algún grupo...`);
            const inscripcionesActuales = await this.getByEstudiante(idEstudiante);
            const gruposActivos = inscripcionesActuales.filter(ins => ins.estado === 'Activo');
            
            if (gruposActivos.length > 0) {
                const grupoAnterior = gruposActivos[0].grupo;
                const idGrupoAnterior = grupoAnterior.idGrupo;
                
                // Si es el mismo grupo, no hacer nada (evitar duplicados)
                if (Number(idGrupoAnterior) === Number(idGrupo)) {
                    console.warn(`⚠️ El estudiante ya está inscrito en el grupo ${idGrupo}`);
                    throw new Error(`El estudiante ya está inscrito en el grupo "${grupoAnterior.nombre}"`);
                }
                
                // CAMBIO DE SALÓN: Dar de baja del grupo anterior
                console.log(`🔄 Cambiando estudiante del grupo "${grupoAnterior.nombre}" (${idGrupoAnterior}) al nuevo grupo (${idGrupo})...`);
                try {
                    await this.delete(idEstudiante, idGrupoAnterior);
                    console.log(`✅ Estudiante dado de baja del grupo anterior: "${grupoAnterior.nombre}"`);
                } catch (deleteError) {
                    console.error('❌ Error al dar de baja del grupo anterior:', deleteError);
                    throw new Error(`No se pudo cambiar de grupo. Error al dar de baja del grupo anterior: ${deleteError.message}`);
                }
            }

            // El backend espera objetos anidados con estado
            const payload = {
                estudiante: {
                    id_usuario: idEstudiante
                },
                grupo: {
                    idGrupo: idGrupo
                },
                estado: inscripcion.estado || 'Activo'
            };

            // Fecha de inscripción es opcional (tiene default CURRENT_TIMESTAMP)
            if (inscripcion.fechaInscripcion) {
                payload.fechaInscripcion = typeof inscripcion.fechaInscripcion === 'string' 
                    ? inscripcion.fechaInscripcion.trim() 
                    : inscripcion.fechaInscripcion;
            }

            console.log('📤 Enviando inscripción:', payload);

            const response = await httpClient.post(API_CONFIG.ENDPOINTS.ESTUDIANTE_GRUPO.CREATE, payload);
            if (response.success) {
                console.log('✅ Estudiante inscrito correctamente en el grupo');
                return normalizeEstudianteGrupo(response.data);
            }

            // Surface conflict errors (e.g., duplicate enrollment)
            if (response.status === 409 && response.data && response.data.error) {
                throw new Error(response.data.error);
            }

            throw new Error(response.message);
        } catch (error) {
            console.error('❌ Error al inscribir estudiante:', error);
            throw error;
        }
    }

    /**
     * Inscribe múltiples estudiantes en un grupo
     * @param {number} idGrupo - ID del grupo
     * @param {Array<number>} estudiantes - IDs de estudiantes
     * @param {string} fechaInscripcion - Fecha de inscripción (opcional)
     * @param {string} estado - Estado de la inscripción (por defecto 'Activo')
     * @returns {Promise<Object>} Resultado con estudiantes inscritos y rechazados
     */
    async enrollMultiple(idGrupo, estudiantes, fechaInscripcion, estado = 'Activo') {
        try {
            const resultados = {
                exitosos: [],
                rechazados: []
            };

            for (const idEstudiante of estudiantes) {
                try {
                    const inscripcion = {
                        idEstudiante,
                        idGrupo,
                        fechaInscripcion,
                        estado
                    };
                    const resultado = await this.create(inscripcion);
                    resultados.exitosos.push({
                        idEstudiante,
                        inscripcion: resultado
                    });
                } catch (error) {
                    console.warn(`⚠️ Estudiante ${idEstudiante} no pudo ser inscrito:`, error.message);
                    resultados.rechazados.push({
                        idEstudiante,
                        razon: error.message
                    });
                }
            }

            console.log(`✅ Inscritos: ${resultados.exitosos.length}, ⚠️ Rechazados: ${resultados.rechazados.length}`);
            
            if (resultados.rechazados.length > 0) {
                console.warn('Estudiantes rechazados:', resultados.rechazados);
            }

            return resultados;
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
