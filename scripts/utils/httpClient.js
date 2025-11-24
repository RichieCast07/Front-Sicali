class HttpClient {
    constructor(baseURL = API_CONFIG.BASE_URL, defaultHeaders = API_CONFIG.DEFAULT_HEADERS) {
        this.baseURL = baseURL;
        this.defaultHeaders = defaultHeaders;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * Realiza una petición HTTP genérica
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de la petición
     * @returns {Promise} Respuesta de la API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        // Evitar enviar 'Content-Type: application/json' en peticiones sin body
        // porque provoca un preflight CORS innecesario en navegadores.
        try {
            const hasBody = !!options.body;
            if (!hasBody && config.headers) {
                // buscar la clave Content-Type de forma case-insensitive
                for (const k of Object.keys(config.headers)) {
                    if (k.toLowerCase() === 'content-type') {
                        delete config.headers[k];
                    }
                }
            }
        } catch (e) {
            // si algo falla, no bloquear la petición
            console.warn('No se pudo ajustar headers en httpClient.request', e);
        }

        // Agregar token JWT si existe
        const token = this.getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            // By default avoid returning cached 304 responses for GETs from the browser
            const fetchOptions = {
                ...config,
                signal: controller.signal
            };

            // If it's a GET request, instruct fetch to bypass the HTTP cache unless caller overrides
            if ((fetchOptions.method || 'GET').toUpperCase() === 'GET') {
                fetchOptions.cache = fetchOptions.cache || 'no-store';
            }

            const response = await fetch(url, fetchOptions);
            
            clearTimeout(timeoutId);

            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                return this.handleError(response);
            }

            // Si es 204 No Content, no hay cuerpo de respuesta
            if (response.status === 204) {
                return { success: true };
            }

            // Manejar respuestas que no devuelven JSON (por ejemplo: texto plano)
            const contentType = (response.headers && response.headers.get)
                ? (response.headers.get('content-type') || '')
                : '';

            if (contentType.includes('application/json')) {
                // Leer el cuerpo como texto UNA vez y luego intentar parsearlo a JSON.
                const raw = await response.text();
                try {
                    const data = JSON.parse(raw);
                    return { success: true, data, status: response.status };
                } catch (parseError) {
                    // Si no es JSON válido, devolver el texto crudo.
                    return { success: true, data: raw, status: response.status };
                }
            }

            // Si no es JSON, devolver el texto tal cual (leer una vez)
            const text = await response.text();
            return { success: true, data: text, status: response.status, contentType };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La petición excedió el tiempo de espera');
            }
            throw error;
        }
    }

    /**
     * Maneja errores de la API
     * @param {Response} response - Respuesta HTTP
     */
    async handleError(response) {
        let errorData;
        try {
            // Leer texto crudo primero (evita intentar leer stream dos veces)
            const raw = await response.text();
            try {
                errorData = JSON.parse(raw);
            } catch {
                errorData = { error: raw };
            }
        } catch {
            errorData = { error: 'Error desconocido' };
        }

        const error = {
            success: false,
            status: response.status,
            message: this.getErrorMessage(response.status),
            data: errorData
        };

        console.error('Error en la petición:', error);
        return error;
    }

    /**
     * Obtiene mensaje de error según código HTTP
     * @param {number} status - Código de estado HTTP
     * @returns {string} Mensaje de error
     */
    getErrorMessage(status) {
        const messages = {
            400: 'Solicitud inválida. Verifica los datos enviados.',
            401: 'No autorizado. Inicia sesión nuevamente.',
            403: 'No tienes permisos para realizar esta acción.',
            404: 'Recurso no encontrado.',
            409: 'Conflicto. El recurso ya existe.',
            500: 'Error interno del servidor. Intenta más tarde.'
        };
        return messages[status] || 'Error desconocido';
    }

    /**
     * GET Request
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} params - Parámetros de consulta
     * @returns {Promise} Respuesta de la API
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST Request
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @returns {Promise} Respuesta de la API
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT Request
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a actualizar
     * @returns {Promise} Respuesta de la API
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE Request
     * @param {string} endpoint - Endpoint de la API
     * @returns {Promise} Respuesta de la API
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Obtiene el token de autenticación del localStorage
     * @returns {string|null} Token JWT
     */
    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Establece el token de autenticación
     * @param {string} token - Token JWT
     */
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
    }

    /**
     * Elimina el token de autenticación
     */
    clearAuthToken() {
        localStorage.removeItem('authToken');
    }
}

// Crear instancia global
const httpClient = new HttpClient();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HttpClient, httpClient };
}