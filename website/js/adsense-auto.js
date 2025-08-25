// Simple AdSense auto-render helper
// Usage: add a container with attribute: data-adsense-placeholder
// Optional attributes: data-ad-client, data-ad-slot

(function() {
  function ensureAdSenseScriptLoaded() {
    var has = !!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    if (!has) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7869206132163225';
      s.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(s);
    }
  }

  function renderPlaceholders() {
    var placeholders = document.querySelectorAll('[data-adsense-placeholder]');
    if (!placeholders || placeholders.length === 0) return;

    placeholders.forEach(function(container) {
      // Avoid double rendering
      if (container.__adsenseRendered) return;
      container.__adsenseRendered = true;

      var client = container.getAttribute('data-ad-client') || 'ca-pub-7869206132163225';
      var slot = container.getAttribute('data-ad-slot') || '1234567890';

      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      container.appendChild(ins);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    ensureAdSenseScriptLoaded();
    renderPlaceholders();
  });
})();


