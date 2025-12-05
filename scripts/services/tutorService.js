const tutorService = {
  async create(tutor) {
    const payload = Object.assign({}, tutor, { rol: 'tutor', habilitado: true });
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

  async getByEstudiante(idEstudiante) {
    try {
      // Obtener todos los tutores
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USUARIOS.BY_ROL('tutor'));
      
      if (!response.success || !response.data) {
        console.warn('No tutors found');
        return [];
      }

      // Normalizar respuesta (puede ser array o objeto con array)
      let tutores = Array.isArray(response.data) ? response.data : 
                   (response.data.tutores || response.data.data || []);

      // Filtrar por id_usuario que coincida con el estudiante o por relación directa
      // Aquí ajustar según tu estructura de datos
      const tutoresDelEstudiante = tutores.filter(t => 
        t.idEstudiante === idEstudiante || 
        (t.estudiante && t.estudiante.id_usuario === idEstudiante)
      );

      console.log(`📍 Buscando tutores para estudiante ${idEstudiante}, encontrados:`, tutoresDelEstudiante.length);
      return tutoresDelEstudiante;
    } catch (error) {
      console.error('Error al obtener tutores del estudiante:', error);
      return [];
    }
  },

  async createOrUpdate(idEstudiante, tutor) {
    try {
      const payload = Object.assign({}, tutor, { 
        idEstudiante, 
        rol: 'tutor', 
        habilitado: true 
      });
      
      // Buscar si ya existe un tutor para este estudiante
      const tutoresExistentes = await this.getByEstudiante(idEstudiante);
      
      if (tutoresExistentes && tutoresExistentes.length > 0) {
        // Actualizar el tutor existente
        const tutorExistente = tutoresExistentes[0];
        return this.update(tutorExistente.id_usuario || tutorExistente.id, payload);
      } else {
        // Crear nuevo tutor
        return this.create(payload);
      }
    } catch (error) {
      console.error('Error en createOrUpdate tutor:', error);
      throw error;
    }
  },
  
  async delete(id) {
    return httpClient.delete(API_CONFIG.ENDPOINTS.USUARIOS.DELETE(id));
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = tutorService;