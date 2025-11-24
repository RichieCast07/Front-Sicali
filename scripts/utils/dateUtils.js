
const DateUtils = {
    /**
     * Formatea una fecha a YYYY-MM-DD
     * @param {Date|string} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    /**
     * Formatea una fecha a formato legible (DD/MM/YYYY)
     * @param {Date|string} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatDateReadable(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return `${day}/${month}/${year}`;
    },

    /**
     * Formatea un timestamp ISO 8601 a formato legible
     * @param {string} timestamp - Timestamp ISO 8601
     * @returns {string} Fecha y hora formateada
     */
    formatDateTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        
        const dateStr = this.formatDateReadable(date);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${dateStr} ${hours}:${minutes}`;
    },

    /**
     * Obtiene la fecha actual en formato YYYY-MM-DD
     * @returns {string} Fecha actual
     */
    getCurrentDate() {
        return this.formatDate(new Date());
    },

    /**
     * Obtiene el timestamp actual en formato ISO 8601
     * @returns {string} Timestamp actual
     */
    getCurrentDateTime() {
        return new Date().toISOString();
    },

    /**
     * Calcula la diferencia en días entre dos fechas
     * @param {Date|string} date1 - Primera fecha
     * @param {Date|string} date2 - Segunda fecha
     * @returns {number} Diferencia en días
     */
    getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
        
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    },

    /**
     * Verifica si una fecha es válida
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     * @returns {boolean} True si es válida
     */
    isValidDate(dateString) {
        if (!dateString) return false;
        
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    },

    /**
     * Convierte una fecha de DD/MM/YYYY a YYYY-MM-DD
     * @param {string} dateString - Fecha en formato DD/MM/YYYY
     * @returns {string} Fecha en formato YYYY-MM-DD
     */
    convertToISO(dateString) {
        if (!dateString) return '';
        
        const parts = dateString.split('/');
        if (parts.length !== 3) return '';
        
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    },

    /**
     * Convierte una fecha de YYYY-MM-DD a DD/MM/YYYY
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     * @returns {string} Fecha en formato DD/MM/YYYY
     */
    convertToReadable(dateString) {
        if (!dateString) return '';
        
        const parts = dateString.split('-');
        if (parts.length !== 3) return '';
        
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    },

    /**
     * Obtiene el nombre del mes en español
     * @param {number} monthIndex - Índice del mes (0-11)
     * @returns {string} Nombre del mes
     */
    getMonthName(monthIndex) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[monthIndex] || '';
    },

    /**
     * Obtiene el nombre del día en español
     * @param {number} dayIndex - Índice del día (0-6)
     * @returns {string} Nombre del día
     */
    getDayName(dayIndex) {
        const days = [
            'Domingo', 'Lunes', 'Martes', 'Miércoles', 
            'Jueves', 'Viernes', 'Sábado'
        ];
        return days[dayIndex] || '';
    },

    /**
     * Suma días a una fecha
     * @param {Date|string} date - Fecha base
     * @param {number} days - Días a sumar
     * @returns {string} Nueva fecha en formato YYYY-MM-DD
     */
    addDays(date, days) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        d.setDate(d.getDate() + days);
        return this.formatDate(d);
    },

    /**
     * Verifica si una fecha es anterior a otra
     * @param {Date|string} date1 - Primera fecha
     * @param {Date|string} date2 - Segunda fecha
     * @returns {boolean} True si date1 es anterior a date2
     */
    isBefore(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
        
        return d1 < d2;
    },

    /**
     * Verifica si una fecha es posterior a otra
     * @param {Date|string} date1 - Primera fecha
     * @param {Date|string} date2 - Segunda fecha
     * @returns {boolean} True si date1 es posterior a date2
     */
    isAfter(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
        
        return d1 > d2;
    }
};

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
}