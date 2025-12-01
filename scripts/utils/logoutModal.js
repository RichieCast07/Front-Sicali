/**
 * Inicializa la modal de logout en cualquier página
 * Uso: Incluir este script al final de la página y llamar initLogoutModal()
 */

function initLogoutModal() {
  // Buscar el avatar y agregar los atributos necesarios
  const avatar = document.querySelector('.avatar');
  if (!avatar) {
    console.warn('⚠️ No se encontró elemento con clase "avatar"');
    return;
  }

  // Agregar ID y estilo si no existe
  if (!avatar.id) {
    avatar.id = 'userAvatar';
  }
  avatar.style.cursor = 'pointer';

  // Crear la modal si no existe
  let logoutModal = document.getElementById('logoutModal');
  if (!logoutModal) {
    logoutModal = document.createElement('div');
    logoutModal.id = 'logoutModal';
    logoutModal.className = 'logout-modal';
    logoutModal.style.display = 'none';
    logoutModal.innerHTML = `
      <button id="logoutBtn" class="logout-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Cerrar Sesión
      </button>
    `;
    document.body.appendChild(logoutModal);
  }

  // Agregar estilos si no existen
  if (!document.getElementById('logoutModalStyles')) {
    const styles = document.createElement('style');
    styles.id = 'logoutModalStyles';
    styles.textContent = `
      #userAvatar {
        cursor: pointer !important;
        transition: opacity 0.2s;
      }

      #userAvatar:hover {
        opacity: 0.8;
      }

      .logout-modal {
        position: absolute;
        top: 65px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 8px;
        z-index: 1001;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .logout-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
        white-space: nowrap;
      }

      .logout-btn:hover {
        background: #cc0000;
      }
    `;
    document.head.appendChild(styles);
  }

  const logoutBtn = document.getElementById('logoutBtn');

  // Event: Click en avatar
  avatar.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = logoutModal.style.display === 'block';
    logoutModal.style.display = isVisible ? 'none' : 'block';
  });

  // Event: Click fuera de la modal
  document.addEventListener('click', (e) => {
    if (!logoutModal.contains(e.target) && e.target !== avatar && !avatar.contains(e.target)) {
      logoutModal.style.display = 'none';
    }
  });

  // Event: Click en botón logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = '../../index.html';
  });

  console.log('✅ Modal de logout inicializada');
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogoutModal);
} else {
  initLogoutModal();
}
