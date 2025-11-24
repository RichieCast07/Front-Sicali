const UIUtils = {
    /**
     * Muestra una notificación de éxito
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en milisegundos (default: 3000)
     */
    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    },

    /**
     * Muestra una notificación de error
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en milisegundos (default: 5000)
     */
    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    },

    /**
     * Muestra una notificación de información
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en milisegundos (default: 3000)
     */
    showInfo(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    },

    /**
     * Muestra una notificación de advertencia
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en milisegundos (default: 4000)
     */
    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    },

    /**
     * Muestra una notificación genérica
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo (success, error, info, warning)
     * @param {number} duration - Duración en milisegundos
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Buscar contenedor de notificaciones o crearlo
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 300px;
            max-width: 500px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
            background-color: ${this.getNotificationColor(type)};
        `;

        // Agregar ícono
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <span style="font-size: 20px;">${icon}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                line-height: 1;
            ">&times;</button>
        `;

        container.appendChild(notification);

        // Auto-eliminar después de la duración especificada
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    /**
     * Obtiene el color según el tipo de notificación
     * @param {string} type - Tipo de notificación
     * @returns {string} Color en hexadecimal
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    },

    /**
     * Obtiene el ícono según el tipo de notificación
     * @param {string} type - Tipo de notificación
     * @returns {string} Ícono emoji
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    },

    /**
     * Muestra un loader en pantalla
     * @param {string} message - Mensaje opcional a mostrar
     * @returns {HTMLElement} Elemento del loader
     */
    showLoader(message = 'Cargando...') {
        // Remover loader existente
        this.hideLoader();

        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        loader.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                text-align: center;
            ">
                <div class="spinner" style="
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <p style="margin: 0; color: #333; font-size: 16px;">${message}</p>
            </div>
        `;

        // Agregar animación de spinner
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(loader);
        return loader;
    },

    /**
     * Oculta el loader
     */
    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.remove();
        }
    },

    /**
     * Muestra un diálogo de confirmación
     * @param {string} message - Mensaje a mostrar
     * @param {Function} onConfirm - Callback al confirmar
     * @param {Function} onCancel - Callback al cancelar
     */
    showConfirm(message, onConfirm, onCancel = null) {
        const confirmed = window.confirm(message);
        if (confirmed && typeof onConfirm === 'function') {
            onConfirm();
        } else if (!confirmed && typeof onCancel === 'function') {
            onCancel();
        }
    },

    /**
     * Deshabilita un botón y muestra texto de carga
     * @param {HTMLElement} button - Botón a deshabilitar
     * @param {string} loadingText - Texto durante la carga
     * @returns {Object} Objeto con método restore()
     */
    disableButton(button, loadingText = 'Cargando...') {
        if (!button) return { restore: () => {} };

        const originalText = button.textContent;
        const originalDisabled = button.disabled;

        button.disabled = true;
        button.textContent = loadingText;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';

        return {
            restore: () => {
                button.disabled = originalDisabled;
                button.textContent = originalText;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        };
    },

    /**
     * Formatea un número como moneda mexicana
     * @param {number} amount - Cantidad a formatear
     * @returns {string} Cantidad formateada
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    },

    /**
     * Capitaliza la primera letra de un string
     * @param {string} str - String a capitalizar
     * @returns {string} String capitalizado
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean} True si es válido
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
};

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
}