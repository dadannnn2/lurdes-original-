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

// --- INTEGRAÇÃO OMEGAPAY (ADICIONADA AQUI) ---
document.addEventListener('DOMContentLoaded', function() {
  var btnGerar = document.getElementById('btn-gerar-pix');
  if (!btnGerar) return;

  btnGerar.addEventListener('click', async function () {
    var valorInput = document.getElementById('campo-quantia');
    var valorBase = parseFloat(valorInput ? valorInput.value : 30) || 30;
    
    var bumpElem = document.getElementById('check-bump');
    var isBump = bumpElem ? bumpElem.checked : false;
    var valorFinal = isBump ? valorBase + 4.99 : valorBase;

    var nomeElem = document.getElementById('doador-nome');
    var telElem = document.getElementById('doador-telefone');
    var anonElem = document.getElementById('doador-anonimo');

    var nome = (nomeElem && nomeElem.value) ? nomeElem.value : 'Doador';
    var telefone = (telElem && telElem.value) ? telElem.value : '';
    var isAnonimo = anonElem ? anonElem.checked : false;

    btnGerar.disabled = true;
    btnGerar.textContent = 'A gerar PIX...';

    try {
      var response = await fetch('https://api.omegapayments.com.br/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'danilolintz1_h433cjjzcd0l6swe',
          'x-client-secret': 'fne4xv7eqge2wdsatljmrtpe1hq86xoxg4hnffnwser1c3y1lbfrv2ilr85025jn'
        },
        body: JSON.stringify({
          amount: Math.round(valorFinal * 100),
          payment_method: 'pix',
          customer: {
            name: isAnonimo ? 'Anónimo' : nome,
            phone: telefone
          }
        })
      });

      var data = await response.json();

      if (data && (data.pix_code || data.qrcode)) {
        var campoTexto = document.getElementById('texto-copiavel');
        var areaQr = document.getElementById('area-qrcode');

        if (campoTexto) campoTexto.value = data.pix_code || data.qrcode_text || '';
        if (areaQr) areaQr.innerHTML = '<img src="' + (data.qrcode_base64 || data.qrcode_url) + '" style="width:100%;height:100%" />';

        var passoRev = document.getElementById('passo-revisao');
        var passoPix = document.getElementById('passo-pix');
        if (passoRev) passoRev.style.display = 'none';
        if (passoPix) passoPix.style.display = 'block';
      } else {
        alert('Erro ao gerar o PIX. Verifique as credenciais da OmegaPay.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Não foi possível conectar à gateway.');
    } finally {
      btnGerar.disabled = false;
      btnGerar.textContent = 'Confirmar e gerar Pix';
    }
  });
});