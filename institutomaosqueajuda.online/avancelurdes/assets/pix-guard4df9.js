// Honeypot + Cloudflare Turnstile antes de gerar o Pix. Sem sitekey no servidor, segue sem captcha.
// Uso em fetch: pixGuard('api/create.php').then(function (extra) { /* junte extra ao corpo do POST */ });
// Uso em formulário: <script src="/pix-guard.js" data-endpoint="/olhar-guard.php" data-forms="checkout.php" defer>
// intercepta submit (nativo ou form.submit()) para checkout.php e anexa os campos captcha/website.
// Arquivo idêntico em todos os projetos: altere todos juntos.
(function () {
  var script = document.currentScript;
  var trap = document.createElement('input');
  trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off';
  trap.setAttribute('aria-hidden', 'true');
  trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
  if (document.body) document.body.appendChild(trap);
  else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(trap); });

  var ready = null, widget = null, waiting = null;
  function done(token) { if (waiting) { var w = waiting; waiting = null; w(token || ''); } }
  function load(endpoint) {
    if (ready) return ready;
    ready = fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (!cfg || !cfg.sitekey) return false;
        return new Promise(function (resolve) {
          var box = document.createElement('div');
          box.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:2147483647';
          document.body.appendChild(box);
          window.__pixTurnstile = function () {
            widget = window.turnstile.render(box, {
              sitekey: cfg.sitekey, execution: 'execute', appearance: 'interaction-only',
              callback: done, 'error-callback': function () { done(''); }, 'timeout-callback': function () { done(''); }
            });
            resolve(true);
          };
          var s = document.createElement('script');
          s.src = '../../challenges.cloudflare.com/turnstile/v0/g/5c2e6b612edd/api.js?render=explicit&onload=__pixTurnstile';
          s.async = true; s.onerror = function () { resolve(false); };
          document.head.appendChild(s);
        });
      })
      .catch(function () { ready = null; return false; });
    return ready;
  }
  window.pixGuard = function (endpoint) {
    return load(endpoint).then(function (on) {
      var extra = { website: trap.value };
      if (!on) return extra;
      return new Promise(function (resolve) {
        // Captcha travado não prende o doador: segue sem token e o servidor decide.
        var timer = setTimeout(function () { done(''); }, 15000);
        waiting = function (token) { clearTimeout(timer); extra.captcha = token; resolve(extra); };
        window.turnstile.reset(widget);
        window.turnstile.execute(widget);
      });
    });
  };

  var forms = script && script.getAttribute('data-forms');
  if (!forms) return;
  var endpoint = script.getAttribute('data-endpoint');
  var nativeSubmit = HTMLFormElement.prototype.submit;
  function guarded(form) {
    if (form.__pixGuarded) return false;
    var action = form.getAttribute('action') || '';
    return action.split('?')[0].split('/').pop() === forms;
  }
  function send(form) {
    form.__pixGuarded = true;
    window.pixGuard(endpoint).then(function (extra) {
      Object.keys(extra).forEach(function (key) {
        var input = document.createElement('input');
        input.type = 'hidden'; input.name = key; input.value = extra[key] || '';
        form.appendChild(input);
      });
      nativeSubmit.call(form);
    });
  }
  HTMLFormElement.prototype.submit = function () {
    if (!guarded(this)) return nativeSubmit.call(this);
    send(this);
  };
  // Bubble no document: roda depois das validações da página; submit já cancelado é ignorado.
  document.addEventListener('submit', function (e) {
    if (e.defaultPrevented || !guarded(e.target)) return;
    e.preventDefault();
    send(e.target);
  });
})();
