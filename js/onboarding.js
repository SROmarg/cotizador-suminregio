/**
 * Componente de Onboarding para Vendedores Nuevos
 * Plataforma Suminregio Industrial
 *
 * Características:
 * - Detecta primer login del usuario
 * - Muestra overlay con 3 pasos de bienvenida
 * - Estilos inline con tema oscuro
 * - Compatible con ES5
 * - Función global: Onboarding.show()
 */

var Onboarding = (function() {
  'use strict';

  // Configuración
  var CONFIG = {
    storageKey: 'suminregio_onboarding_done',
    steps: [
      {
        id: 'welcome',
        title: 'Bienvenido a Suminregio',
        description: 'Suminregio Industrial es tu plataforma de herramientas integradas para gestionar cotizaciones, productos y servicios de distribución industrial de forma rápida y eficiente.'
      },
      {
        id: 'cotizador',
        title: 'Cotizador',
        description: 'Busca productos en nuestro catálogo, compara precios y especificaciones. Crea cotizaciones personalizadas para tus clientes en solo unos clics.'
      },
      {
        id: 'levantamiento',
        title: 'Levantamiento',
        description: 'Escanea formatos de mangueras y especificaciones técnicas. El sistema captura automáticamente los datos para facilitar la gestión de proyectos.'
      }
    ],
    colors: {
      overlayBg: 'rgba(0, 0, 0, 0.85)',
      cardBg: '#1a1a1a',
      border: '#333333',
      text: '#ffffff',
      primary: '#F5C518',
      secondary: '#666666'
    }
  };

  // Estado
  var state = {
    isVisible: false,
    currentStep: 0,
    overlay: null,
    card: null,
    dotsContainer: null
  };

  /**
   * Crea los estilos CSS para el overlay
   */
  function createStyles() {
    if (document.getElementById('onboarding-styles')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'onboarding-styles';
    style.textContent = [
      '#onboarding-overlay {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  width: 100%;',
      '  height: 100%;',
      '  background-color: ' + CONFIG.colors.overlayBg + ';',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  z-index: 9999;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
      '}',
      '',
      '#onboarding-card {',
      '  background-color: ' + CONFIG.colors.cardBg + ';',
      '  border: 1px solid ' + CONFIG.colors.border + ';',
      '  border-radius: 12px;',
      '  padding: 48px;',
      '  max-width: 500px;',
      '  width: 90%;',
      '  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);',
      '  animation: slideUp 0.3s ease-out;',
      '}',
      '',
      '@keyframes slideUp {',
      '  from {',
      '    opacity: 0;',
      '    transform: translateY(20px);',
      '  }',
      '  to {',
      '    opacity: 1;',
      '    transform: translateY(0);',
      '  }',
      '}',
      '',
      '#onboarding-title {',
      '  color: ' + CONFIG.colors.text + ';',
      '  font-size: 28px;',
      '  font-weight: 600;',
      '  margin: 0 0 16px 0;',
      '  line-height: 1.2;',
      '}',
      '',
      '#onboarding-description {',
      '  color: ' + CONFIG.colors.secondary + ';',
      '  font-size: 16px;',
      '  line-height: 1.6;',
      '  margin: 0 0 32px 0;',
      '}',
      '',
      '.onboarding-dots {',
      '  display: flex;',
      '  justify-content: center;',
      '  gap: 8px;',
      '  margin: 32px 0;',
      '}',
      '',
      '.onboarding-dot {',
      '  width: 8px;',
      '  height: 8px;',
      '  border-radius: 50%;',
      '  background-color: ' + CONFIG.colors.border + ';',
      '  cursor: pointer;',
      '  transition: all 0.3s ease;',
      '}',
      '',
      '.onboarding-dot.active {',
      '  background-color: ' + CONFIG.colors.primary + ';',
      '  width: 24px;',
      '  border-radius: 4px;',
      '}',
      '',
      '.onboarding-buttons {',
      '  display: flex;',
      '  gap: 12px;',
      '  justify-content: space-between;',
      '  margin-top: 32px;',
      '}',
      '',
      '.onboarding-btn {',
      '  padding: 12px 24px;',
      '  border: none;',
      '  border-radius: 6px;',
      '  font-size: 14px;',
      '  font-weight: 500;',
      '  cursor: pointer;',
      '  transition: all 0.2s ease;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.5px;',
      '}',
      '',
      '.onboarding-btn-primary {',
      '  background-color: ' + CONFIG.colors.primary + ';',
      '  color: #000000;',
      '  flex: 1;',
      '}',
      '',
      '.onboarding-btn-primary:hover {',
      '  background-color: #FFD700;',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 8px 16px rgba(245, 197, 24, 0.3);',
      '}',
      '',
      '.onboarding-btn-secondary {',
      '  background-color: transparent;',
      '  color: ' + CONFIG.colors.secondary + ';',
      '  border: 1px solid ' + CONFIG.colors.border + ';',
      '  flex: 0.5;',
      '}',
      '',
      '.onboarding-btn-secondary:hover {',
      '  border-color: ' + CONFIG.colors.primary + ';',
      '  color: ' + CONFIG.colors.primary + ';',
      '}',
      '',
      '.onboarding-step-counter {',
      '  color: ' + CONFIG.colors.secondary + ';',
      '  font-size: 12px;',
      '  margin-bottom: 16px;',
      '  text-transform: uppercase;',
      '  letter-spacing: 1px;',
      '}',
      '',
      '@media (max-width: 600px) {',
      '  #onboarding-card {',
      '    padding: 32px 24px;',
      '  }',
      '  ',
      '  #onboarding-title {',
      '    font-size: 24px;',
      '  }',
      '  ',
      '  #onboarding-description {',
      '    font-size: 14px;',
      '  }',
      '  ',
      '  .onboarding-buttons {',
      '    flex-direction: column-reverse;',
      '  }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  /**
   * Crea el contenedor principal del overlay
   */
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';

    var card = document.createElement('div');
    card.id = 'onboarding-card';

    overlay.appendChild(card);
    state.overlay = overlay;
    state.card = card;

    return overlay;
  }

  /**
   * Renderiza el contenido del paso actual
   */
  function renderStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= CONFIG.steps.length) {
      return;
    }

    var step = CONFIG.steps[stepIndex];
    var isLastStep = stepIndex === CONFIG.steps.length - 1;

    var html = [
      '<div class="onboarding-step-counter">Paso ' + (stepIndex + 1) + ' de ' + CONFIG.steps.length + '</div>',
      '<h2 id="onboarding-title">' + escapeHtml(step.title) + '</h2>',
      '<p id="onboarding-description">' + escapeHtml(step.description) + '</p>',
      '<div class="onboarding-dots">' + renderDots(stepIndex) + '</div>',
      '<div class="onboarding-buttons">'
    ];

    if (stepIndex > 0) {
      html.push('<button class="onboarding-btn onboarding-btn-secondary" onclick="Onboarding.previousStep()">Atrás</button>');
    }

    if (isLastStep) {
      html.push('<button class="onboarding-btn onboarding-btn-primary" onclick="Onboarding.complete()">Comenzar</button>');
    } else {
      html.push('<button class="onboarding-btn onboarding-btn-primary" onclick="Onboarding.nextStep()">Siguiente</button>');
    }

    html.push('</div>');

    state.card.innerHTML = html.join('');
  }

  /**
   * Renderiza los indicadores de paso (dots)
   */
  function renderDots(activeIndex) {
    var dots = [];
    for (var i = 0; i < CONFIG.steps.length; i++) {
      var dotClass = i === activeIndex ? 'onboarding-dot active' : 'onboarding-dot';
      dots.push(
        '<div class="' + dotClass + '" onclick="Onboarding.goToStep(' + i + ')"></div>'
      );
    }
    return dots.join('');
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   */
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(char) {
      return map[char];
    });
  }

  /**
   * Verifica si el onboarding ya fue completado
   */
  function isCompleted() {
    return localStorage.getItem(CONFIG.storageKey) === 'true';
  }

  /**
   * Marca el onboarding como completado
   */
  function markAsCompleted() {
    localStorage.setItem(CONFIG.storageKey, 'true');
  }

  /**
   * Abre el onboarding
   */
  function show() {
    if (state.isVisible) {
      return;
    }

    createStyles();
    var overlay = createOverlay();
    document.body.appendChild(overlay);

    state.isVisible = true;
    state.currentStep = 0;

    renderStep(0);

    // Deshabilitar scroll en el body
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cierra el onboarding
   */
  function close() {
    if (state.overlay && state.overlay.parentNode) {
      state.overlay.parentNode.removeChild(state.overlay);
    }

    state.isVisible = false;
    state.currentStep = 0;

    // Habilitar scroll en el body
    document.body.style.overflow = '';
  }

  /**
   * Avanza al siguiente paso
   */
  function nextStep() {
    if (state.currentStep < CONFIG.steps.length - 1) {
      state.currentStep++;
      renderStep(state.currentStep);
    }
  }

  /**
   * Retrocede al paso anterior
   */
  function previousStep() {
    if (state.currentStep > 0) {
      state.currentStep--;
      renderStep(state.currentStep);
    }
  }

  /**
   * Va a un paso específico
   */
  function goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < CONFIG.steps.length) {
      state.currentStep = stepIndex;
      renderStep(state.currentStep);
    }
  }

  /**
   * Completa el onboarding
   */
  function complete() {
    markAsCompleted();
    close();

    // Disparar evento personalizado para que otras partes de la app lo sepan
    var event = new CustomEvent('onboardingComplete');
    document.dispatchEvent(event);
  }

  /**
   * Reinicia el onboarding (borra el estado completado)
   */
  function reset() {
    localStorage.removeItem(CONFIG.storageKey);
  }

  /**
   * Inicializa el onboarding si es el primer login
   */
  function init() {
    if (!isCompleted()) {
      show();
    }
  }

  // API pública
  return {
    init: init,
    show: show,
    close: close,
    complete: complete,
    reset: reset,
    nextStep: nextStep,
    previousStep: previousStep,
    goToStep: goToStep,
    isCompleted: isCompleted
  };
})();

// Auto-inicializar cuando el documento esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    Onboarding.init();
  });
} else {
  Onboarding.init();
}
