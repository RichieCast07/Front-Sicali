const API_CONFIG = {
    // URL base de la API (ajustar según ambiente)
    // En desarrollo local podemos apuntar a un proxy para evitar CORS
    BASE_URL: 'https://sicalibackend.mangelg.space/api',
    
    // Timeout para peticiones (ms)
    TIMEOUT: 30000,
    
    // Headers por defecto
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    
    // Endpoints
    ENDPOINTS: {
        // Ciclos
        CICLOS: {
            LIST: '/ciclos',
            CREATE: '/ciclos',
            GET_BY_ID: (id) => `/ciclos/${id}`,
            UPDATE: (id) => `/ciclos/${id}`,
            DELETE: (id) => `/ciclos/${id}`
        },
        
        // Usuarios
        USUARIOS: {
            LIST: '/usuarios',
            CREATE: '/usuarios',
            GET_BY_ID: (id) => `/usuarios/${id}`,
            UPDATE: (id) => `/usuarios/${id}`,
            DELETE: (id) => `/usuarios/${id}`,
            BY_ROL: (rol) => `/usuarios/rol/${rol}`
        },
        
        // Grupos
        GRUPOS: {
            LIST: '/grupos',
            CREATE: '/grupos',
            GET_BY_ID: (id) => `/grupos/${id}`,
            UPDATE: (id) => `/grupos/${id}`,
            DELETE: (id) => `/grupos/${id}`,
            BY_DOCENTE: (idDocente) => `/grupos/docente/${idDocente}`,
            BY_PERIODO: (idPeriodo) => `/grupos/periodo/${idPeriodo}`
        },
        
        // Grupo-Asignatura
        GRUPO_ASIGNATURA: {
            LIST: '/grupo-asignatura',
            CREATE: '/grupo-asignatura',
            GET_BY_ID: (id) => `/grupo-asignatura/${id}`,
            BY_GRUPO: (idGrupo) => `/grupo-asignatura/grupo/${idGrupo}`,
            DELETE: (id) => `/grupo-asignatura/${id}`
        },
        
        // Estudiante-Grupo (Inscripciones)
        ESTUDIANTE_GRUPO: {
            LIST: '/estudiante-grupos',
            CREATE: '/estudiante-grupos',
            BY_ESTUDIANTE: (idEstudiante) => `/estudiante-grupos/estudiante/${idEstudiante}`,
            BY_GRUPO: (idGrupo) => `/estudiante-grupos/grupo/${idGrupo}`,
            DELETE: (idEstudiante, idGrupo) => `/estudiante-grupos/${idEstudiante}/${idGrupo}`
        },
        
        // Asistencia (backend usa plural 'asistencias')
        ASISTENCIA: {
            LIST: '/asistencias',
            CREATE: '/asistencias',
            GET_BY_ID: (id) => `/asistencias/${id}`,
            BY_ESTUDIANTE: (idEstudiante) => `/asistencias/estudiante/${idEstudiante}`,
            BY_GRUPO: (idGrupo) => `/asistencias/grupo/${idGrupo}`,
            BY_FECHA: (fecha) => `/asistencias/fecha/${fecha}`,
            UPDATE: (id) => `/asistencias/${id}`,
            DELETE: (id) => `/asistencias/${id}`
        },
        
        // Asignaturas (si existen endpoints adicionales)
        ASIGNATURAS: {
            LIST: '/asignaturas',
            CREATE: '/asignaturas',
            GET_BY_ID: (id) => `/asignaturas/${id}`,
            UPDATE: (id) => `/asignaturas/${id}`,
            DELETE: (id) => `/asignaturas/${id}`
        },
        
        // Calificaciones
        CALIFICACIONES: {
            LIST: '/calificaciones',
            CREATE: '/calificaciones',
            GET_BY_ID: (id) => `/calificaciones/${id}`,
            BY_ESTUDIANTE: (idEstudiante) => `/calificaciones/estudiante/${idEstudiante}`,
            BY_GRUPO: (idGrupo) => `/calificaciones/grupo/${idGrupo}`,
            BY_ASIGNATURA: (idAsignatura) => `/calificaciones/asignatura/${idAsignatura}`,
            UPDATE: (id) => `/calificaciones/${id}`,
            DELETE: (id) => `/calificaciones/${id}`
        },
        
        // Autenticación
        AUTH: {
            LOGIN: '/auth/login'
        }
    },
    
    // Códigos HTTP esperados
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}