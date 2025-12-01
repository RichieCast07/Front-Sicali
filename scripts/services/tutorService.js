const tutorService = {
  async create(tutor) {
    const payload = Object.assign({}, tutor, { rol: 'tutor', estado: 'Activo' });
    return httpClient.post(API_CONFIG.ENDPOINTS.USUARIOS.CREATE, payload);
  },

  async update(id, tutor) {
    const payload = Object.assign({}, tutor);
    return httpClient.put(API_CONFIG.ENDPOINTS.USUARIOS.UPDATE(id), payload);
  },

  async getAll() {
    // ✅ CORRECCIÓN: Usar el endpoint de API_CONFIG en lugar de hardcoded
    return httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.BY_ROL('tutor'));
  },

  async getById(id) {
    return httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.GET_BY_ID(id));
  },
  
  async delete(id) {
    return httpClient.delete(API_CONFIG.ENDPOINTS.USUARIOS.DELETE(id));
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = tutorService;