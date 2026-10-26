/**
 * Jardim Ciranda — form.js
 * Formulário de visita pedagógica 100% estático (zero backend):
 *   (a) WhatsApp — monta link wa.me com mensagem sanitizada (canal principal);
 *   (b) E-mail   — envia via fetch() para Web3Forms ou Formspree, sem recarregar.
 *
 * Segurança:
 *   - Validação estrita (lista de valores permitidos, regex, limites de tamanho).
 *   - Sanitização de todo texto livre antes de usar em URL ou JSON.
 *   - Nunca usa innerHTML: mensagens são criadas com textContent/createElement.
 *   - Honeypot (botcheck) + tempo mínimo de preenchimento + cooldown entre envios.
 *   - Nenhum dado é salvo no navegador nem enviado a analytics.
 */
(function () {
  'use strict';

  var CFG = window.CIRANDA_CONFIG || {};
  var form = document.getElementById('form-visita');
  if (!form) return;

  // Com JS ativo, assumimos a validação (mensagens acessíveis em pt-BR)
  form.noValidate = true;

  var statusBox = document.getElementById('form-status');
  var startedAt = Date.now();
  var COOLDOWN_KEY = 'ciranda-ultimo-envio';

  var AGES = ['1 a 2 anos', '2 a 3 anos', '3 a 4 anos', '4 a 5 anos', '5 a 6 anos'];
  var SHIFTS = ['Matutino', 'Vespertino', 'Semi-integral', 'Integral', 'Ainda não sei'];
  var NAME_RE = /^[\p{L}\p{M}' .-]{3,80}$/u;
  var EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;

  /* ---------------- Sanitização ---------------- */

  /** Remove caracteres de controle/invisíveis, sinais de tag e espaços excedentes. */
  function sanitize(value, max) {
    return String(value == null ? '' : value)
      .normalize('NFC')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/[<>]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, max);
  }

  var onlyDigits = function (v) { return String(v || '').replace(/\D/g, ''); };

  function formatPhone(digits) {
    var d = digits.replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  /* ---------------- Leitura + validação ---------------- */

  function readForm() {
    var fd = new FormData(form);
    return {
      nome: sanitize(fd.get('nome'), 80),
      idade: sanitize(fd.get('idade'), 20),
      turno: sanitize(fd.get('turno'), 20),
      telefone: onlyDigits(fd.get('telefone')).slice(0, 13),
      email: sanitize(fd.get('email'), 120).toLowerCase(),
      mensagem: sanitize(fd.get('mensagem'), 500),
      consentimento: fd.get('consentimento') === 'sim',
      botcheck: fd.get('botcheck') !== null,
    };
  }

  function validate(data, canal) {
    var errors = {};
    if (!NAME_RE.test(data.nome)) errors.nome = 'Informe seu nome (mínimo 3 letras, sem números).';
    if (AGES.indexOf(data.idade) === -1) errors.idade = 'Selecione a idade da criança.';
    if (SHIFTS.indexOf(data.turno) === -1) errors.turno = 'Selecione o turno de interesse.';

    if (data.telefone && !/^(55)?[1-9]{2}9?\d{8}$/.test(data.telefone)) {
      errors.telefone = 'Telefone inválido. Use DDD + número, ex.: (47) 99999-9999.';
    }
    if (canal === 'email') {
      if (!data.email) errors.email = 'Para envio por e-mail, informe seu e-mail.';
      else if (!EMAIL_RE.test(data.email)) errors.email = 'Informe um e-mail válido.';
    } else if (data.email && !EMAIL_RE.test(data.email)) {
      errors.email = 'Informe um e-mail válido (ou deixe em branco).';
    }
    if (!data.consentimento) errors.consentimento = 'É preciso aceitar a Política de Privacidade para continuar.';
    return errors;
  }

  function setFieldError(name, message) {
    var field = form.elements.namedItem(name);
    var slot = document.getElementById(name + '-erro');
    if (field && field.setAttribute) {
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
    if (slot) slot.textContent = message || '';
  }

  function showErrors(errors) {
    ['nome', 'idade', 'turno', 'telefone', 'email', 'consentimento'].forEach(function (n) {
      setFieldError(n, errors[n]);
    });
    var first = Object.keys(errors)[0];
    if (first) {
      var el = form.elements.namedItem(first);
      if (el && el.focus) el.focus();
    }
  }

  /* ---------------- Mensagens de status (sem innerHTML) ---------------- */

  function setStatus(type, text, link) {
    if (!statusBox) return;
    statusBox.textContent = '';
    statusBox.className = 'form-status ' + (type === 'ok' ? 'form-status--ok' : 'form-status--err');
    var p = document.createElement('p');
    p.textContent = text;
    p.style.margin = '0'; // CSSOM (permitido pela CSP), não é atributo inline no HTML
    statusBox.appendChild(p);
    if (link) {
      var a = document.createElement('a');
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.label;
      var p2 = document.createElement('p');
      p2.style.margin = '0.5rem 0 0';
      p2.appendChild(a);
      statusBox.appendChild(p2);
    }
    statusBox.hidden = false;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setBusy(button, busy) {
    if (!button) return;
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
  }

  /* ---------------- (a) WhatsApp ---------------- */

  function buildWhatsAppMessage(d) {
    var lines = [
      'Olá! Gostaria de agendar uma visita pedagógica no Jardim Ciranda. 🌻',
      '',
      '• Responsável: ' + d.nome,
      '• Idade da criança: ' + d.idade,
      '• Turno de interesse: ' + d.turno,
    ];
    if (d.telefone) lines.push('• WhatsApp: ' + formatPhone(d.telefone));
    if (d.email) lines.push('• E-mail: ' + d.email);
    if (d.mensagem) lines.push('', 'Mensagem: ' + d.mensagem);
    return lines.join('\n');
  }

  function waUrl(message) {
    if (typeof window.CIRANDA_buildWaUrl === 'function') return window.CIRANDA_buildWaUrl(message);
    return 'https://wa.me/' + onlyDigits(CFG.whatsappNumber) + '?text=' + encodeURIComponent(message);
  }

  function openExternal(url) {
    // Âncora temporária: mantém o gesto do usuário (evita bloqueio de pop-up) e garante noopener.
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function sendWhatsApp(data) {
    var url = waUrl(buildWhatsAppMessage(data));
    openExternal(url);
    setStatus('ok', 'Pronto! Abrimos o WhatsApp com sua mensagem — é só tocar em “Enviar”. 💛', {
      href: url,
      label: 'O WhatsApp não abriu? Toque aqui.',
    });
  }

  /* ---------------- (b) E-mail (Web3Forms / Formspree) ---------------- */

  function emailEndpoint() {
    if (CFG.emailProvider === 'web3forms' && CFG.web3formsAccessKey && !/SUA_CHAVE/.test(CFG.web3formsAccessKey)) {
      return { url: 'https://api.web3forms.com/submit', provider: 'web3forms' };
    }
    if (CFG.emailProvider === 'formspree' && /^[A-Za-z0-9]{4,20}$/.test(CFG.formspreeFormId || '')) {
      return { url: 'https://formspree.io/f/' + CFG.formspreeFormId, provider: 'formspree' };
    }
    return null;
  }

  function cooldownLeft() {
    try {
      var last = Number(window.sessionStorage.getItem(COOLDOWN_KEY) || 0);
      var left = Math.ceil(((CFG.emailCooldownSeconds || 60) * 1000 - (Date.now() - last)) / 1000);
      return left > 0 ? left : 0;
    } catch (e) { return 0; }
  }

  function sendEmail(data, button) {
    var endpoint = emailEndpoint();
    var waFallback = { href: waUrl(buildWhatsAppMessage(data)), label: 'Prefere? Envie pelo WhatsApp →' };

    if (!endpoint) {
      setStatus('err', 'O envio por e-mail está temporariamente indisponível. Fale conosco pelo WhatsApp:', waFallback);
      return;
    }
    var wait = cooldownLeft();
    if (wait) {
      setStatus('err', 'Recebemos um envio há pouco. Aguarde ' + wait + 's para enviar novamente.', null);
      return;
    }

    var payload = {
      subject: 'Novo pedido de visita pedagógica — ' + data.nome,
      from_name: 'Site Jardim Ciranda',
      name: data.nome,
      email: data.email,
      replyto: data.email,
      telefone: data.telefone ? formatPhone(data.telefone) : '—',
      idade_crianca: data.idade,
      turno: data.turno,
      mensagem: data.mensagem || '—',
      consentimento_lgpd: 'Sim — ' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };
    if (endpoint.provider === 'web3forms') {
      payload.access_key = CFG.web3formsAccessKey;
      payload.botcheck = false;
    } else {
      payload._replyto = data.email;
      payload._subject = payload.subject;
    }

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, 12000) : null;

    setBusy(button, true);
    fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          var ok = res.ok && (endpoint.provider !== 'web3forms' || body.success === true);
          if (!ok) throw new Error('send-failed');
        });
      })
      .then(function () {
        try { window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch (e) { /* ignore */ }
        form.reset();
        updateCounter();
        startedAt = Date.now();
        setStatus('ok', 'Recebemos seu pedido! Em breve a secretaria entrará em contato para combinar a visita. 🌻', null);
      })
      .catch(function () {
        setStatus('err', 'Não conseguimos enviar agora. Por favor, tente o WhatsApp:', waFallback);
      })
      .finally(function () {
        if (timer) window.clearTimeout(timer);
        setBusy(button, false);
      });
  }

  /* ---------------- Eventos ---------------- */

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var button = event.submitter || null;
    var canal = button && button.value === 'email' ? 'email' : 'whatsapp';
    var data = readForm();

    // Honeypot: bots recebem "sucesso" silencioso e nada é enviado.
    if (data.botcheck) {
      setStatus('ok', 'Obrigado! Recebemos seu pedido.', null);
      form.reset();
      return;
    }

    var errors = validate(data, canal);
    showErrors(errors);
    if (Object.keys(errors).length) {
      setStatus('err', 'Quase lá! Verifique os campos destacados.', null);
      return;
    }

    if (canal === 'email' && Date.now() - startedAt < (CFG.minFillTimeMs || 2500)) {
      setStatus('ok', 'Obrigado! Recebemos seu pedido.', null); // provável bot
      return;
    }

    if (canal === 'whatsapp') sendWhatsApp(data);
    else sendEmail(data, button);
  });

  // Validação ao sair do campo (feedback gentil, não intrusivo)
  ['nome', 'idade', 'turno', 'telefone', 'email', 'consentimento'].forEach(function (name) {
    var el = form.elements.namedItem(name);
    if (!el || !el.addEventListener) return;
    el.addEventListener('blur', function () {
      if (!el.value && el.type !== 'checkbox') return;
      var errs = validate(readForm(), 'whatsapp');
      setFieldError(name, errs[name]);
    });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') {
        var errs = validate(readForm(), 'whatsapp');
        setFieldError(name, errs[name]);
      }
    });
  });

  // Máscara de telefone
  var phone = form.elements.namedItem('telefone');
  if (phone) {
    phone.addEventListener('input', function () {
      phone.value = formatPhone(onlyDigits(phone.value));
    });
  }

  // Contador de caracteres
  var msg = form.elements.namedItem('mensagem');
  var counter = form.querySelector('[data-counter="mensagem"]');
  function updateCounter() {
    if (msg && counter) counter.textContent = String(msg.value.length);
  }
  if (msg) msg.addEventListener('input', updateCounter);
})();
