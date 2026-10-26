/**
 * Jardim Ciranda — video.js
 * Vídeos do YouTube sob demanda (facade): nenhum contato com o YouTube até o clique.
 * Usa o domínio youtube-nocookie.com e valida o ID do vídeo antes de montar a URL.
 */
(function () {
  'use strict';
  var ID_RE = /^[A-Za-z0-9_-]{11}$/;

  Array.prototype.forEach.call(document.querySelectorAll('.video-facade[data-video]'), function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-video') || '';
      if (!ID_RE.test(id)) return;
      var start = parseInt(btn.getAttribute('data-start') || '0', 10);
      var src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0' + (start > 0 ? '&start=' + start : '');

      var iframe = document.createElement('iframe');
      iframe.className = 'video-frame';
      iframe.src = src;
      iframe.title = btn.getAttribute('data-title') || 'Vídeo';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
      btn.replaceWith(iframe);
      iframe.focus();
    });
  });
})();
