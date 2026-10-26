/**
 * Jardim Ciranda — configuração central (edite apenas este arquivo).
 * Objeto congelado: não pode ser alterado por outros scripts em tempo de execução.
 */
(function () {
  'use strict';

  window.CIRANDA_CONFIG = Object.freeze({
    /** WhatsApp da secretaria: DDI + DDD + número, só dígitos. */
    whatsappNumber: '5547988916765',

    /** Mensagem usada pelos botões genéricos de WhatsApp (flutuante, rodapé). */
    whatsappDefaultMessage: 'Olá! Vim pelo site do Jardim Ciranda e gostaria de saber mais sobre uma visita pedagógica. 🌻',

    /**
     * Envio por e-mail (alternativo):
     *   'web3forms' → https://web3forms.com  (gratuito, sem cadastro de cartão)
     *   'formspree' → https://formspree.io
     *   ''          → desativa o envio por e-mail (só WhatsApp)
     */
    emailProvider: 'web3forms',

    /** Chave PÚBLICA do Web3Forms (é feita para ficar no front-end). Restrinja o domínio no painel. */
    web3formsAccessKey: '0b811835-ebb6-4576-9d59-e49eecf11194',

    /** ID do formulário Formspree, ex.: 'xyzabcd' (usado só se emailProvider = 'formspree'). */
    formspreeFormId: '',

    /** Intervalo mínimo entre envios por e-mail no mesmo navegador (anti-flood de UX). */
    emailCooldownSeconds: 60,

    /** Tempo mínimo (ms) entre exibir o formulário e enviar — bots costumam ser instantâneos. */
    minFillTimeMs: 2500,

    /** Mapa (OpenStreetMap) — sem cookies de rastreamento. */
    map: {
      lat: -26.2799649,
      lng: -48.8545398,
      bbox: '-48.8585,-26.2825,-48.8505,-26.2775',
    },

    /** Versão do aviso de privacidade: incremente para pedir nova escolha aos visitantes. */
    consentVersion: 1,
  });
})();
