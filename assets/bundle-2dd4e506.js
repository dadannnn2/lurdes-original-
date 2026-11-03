(function () {
  'use strict';

  var BUMP = 4.99;
  var MAX_VALOR = 7000;

  var janelaModal = document.getElementById('janela-pag');
  var btnFechar = document.getElementById('fechar-janela');
  var tituloModal = document.getElementById('titulo-modal');
  var passoRevisao = document.getElementById('passo-revisao');
  var passoPix = document.getElementById('passo-pix');
  var exibeValor = document.getElementById('exibe-quantia');
  var containerQr = document.getElementById('area-qrcode');
  var textoCopiavel = document.getElementById('texto-copiavel');
  var btnCopiar = document.getElementById('btn-copiar-chave');
  var statusPix = document.getElementById('status-pix');
  var checkBump = document.getElementById('check-bump');
  var btnGerarPix = document.getElementById('btn-gerar-pix');
  var doadorNome = document.getElementById('doador-nome');
  var doadorTelefone = document.getElementById('doador-telefone');
  var doadorAnonimo = document.getElementById('doador-anonimo');
  var camposDoador = document.getElementById('campos-doador');

  var streamSSE = null;
  var valorSelecionado = 0;

  function reaisDecimal(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function mascaraTelefone(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) d = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    else if (d.length > 2) d = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length > 0) d = '(' + d;
    return d;
  }
  function totalComBump() {
    var extra = checkBump && checkBump.checked ? BUMP : 0;
    return Number((valorSelecionado + extra).toFixed(2));
  }
  function atualizarExibicao() {
    if (exibeValor) exibeValor.textContent = reaisDecimal(totalComBump());
  }
  function atualizarCamposDoador() {
    var anon = !!(doadorAnonimo && doadorAnonimo.checked);
    if (camposDoador) camposDoador.style.display = anon ? 'none' : 'block';
  }

  function abrirModal() {
    janelaModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(function () { janelaModal.classList.add('mostrar-agora'); }, 12);
  }
  function fecharModal() {
    streamSSE && (streamSSE.close(), streamSSE = null);
    janelaModal.classList.remove('mostrar-agora');
    document.body.style.overflow = '';
    setTimeout(function () {
      janelaModal.style.display = 'none';
      passoPix.style.display = 'none';
      passoRevisao.style.display = 'block';
      if (tituloModal) tituloModal.textContent = 'Falta só confirmar';
      if (statusPix) statusPix.textContent = '';
      if (containerQr) containerQr.innerHTML = '';
      if (textoCopiavel) textoCopiavel.value = '';
      if (btnGerarPix) { btnGerarPix.disabled = false; btnGerarPix.textContent = 'Confirmar e gerar Pix'; }
      valorSelecionado = 0;
    }, 260);
  }
  function abrirCheckout(valor) {
    valorSelecionado = Math.round(valor);
    if (!valorSelecionado || valorSelecionado < 1) { alert('Informe um valor válido.'); return; }
    if (checkBump) checkBump.checked = false;
    if (doadorAnonimo) doadorAnonimo.checked = false;
    if (doadorNome) doadorNome.value = '';
    if (doadorTelefone) doadorTelefone.value = '';
    atualizarCamposDoador();
    atualizarExibicao();
    abrirModal();
  }

  btnFechar && btnFechar.addEventListener('click', fecharModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && janelaModal.classList.contains('mostrar-agora')) fecharModal();
  });

  var botoesOpcao = document.querySelectorAll('.opcao-rapida');
  for (var i = 0; i < botoesOpcao.length; i++) {
    botoesOpcao[i].addEventListener('click', function () {
      abrirCheckout(parseInt(this.getAttribute('data-indice'), 10));
    });
  }
  var btnCustom = document.getElementById('confirmar-personalizado');
  var campoCustom = document.getElementById('campo-quantia');
  btnCustom && btnCustom.addEventListener('click', function () {
    abrirCheckout(parseInt(campoCustom && campoCustom.value, 10));
  });

  checkBump && checkBump.addEventListener('change', atualizarExibicao);
  doadorAnonimo && doadorAnonimo.addEventListener('change', atualizarCamposDoador);
  doadorTelefone && doadorTelefone.addEventListener('input', function () { this.value = mascaraTelefone(this.value); });

  btnGerarPix && btnGerarPix.addEventListener('click', gerarPix);

  function gerarPix() {
    var total = totalComBump();
    if (!total || total < 1 || total > MAX_VALOR) { alert('Informe um valor entre R$ 1 e R$ 7.000.'); return; }
    var anonimo = !!(doadorAnonimo && doadorAnonimo.checked);
    var nome = anonimo ? '' : (doadorNome ? doadorNome.value.trim() : '');
    var telefone = anonimo ? '' : (doadorTelefone ? doadorTelefone.value : '');

    btnGerarPix.disabled = true;
    btnGerarPix.textContent = 'Gerando Pix…';

    var params = (window.getUtmParameters && window.getUtmParameters()) || {};

    window.pixGuard('api/publi-gerador.json').then(function (extra) { return fetch('api/publi-gerador.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign(extra, {
        celula_financeira: Math.round(total * 100),
        nome: nome,
        telefone: telefone,
        anonimo: anonimo,
        utm_params: params
      }))
    }); })
      .then(function (resp) {
        return resp.json().then(function (dados) {
          if (!resp.ok) throw new Error(dados.message || dados.error || 'HTTP ' + resp.status);
          return dados;
        });
      })
      .then(function (dados) {
        if (!dados.transaction_id || !dados.qrcode_text) throw new Error('Servidor não respondeu corretamente.');
        if (dados.qrcode) containerQr.innerHTML = dados.qrcode;
        else containerQr.textContent = 'QR indisponível';
        textoCopiavel.value = dados.qrcode_text;
        if (tituloModal) tituloModal.textContent = 'Finalize seu Pix';
        passoRevisao.style.display = 'none';
        passoPix.style.display = 'block';
        statusPix.textContent = 'Aguardando pagamento…';
        iniciarMonitoramento(dados.transaction_id);
      })
      .catch(function (erro) {
        alert('Erro temporário · refaça: ' + erro.message);
        btnGerarPix.disabled = false;
        btnGerarPix.textContent = 'Confirmar e gerar Pix';
      });
  }

  function iniciarMonitoramento(tid) {
    streamSSE && streamSSE.close();
    streamSSE = new EventSource('api/publi-situacaoe796.html?tid=' + encodeURIComponent(tid));
    streamSSE.onmessage = function (evt) {
      try {
        var info = JSON.parse(evt.data);
        if (['refunded', 'refused', 'failed', 'cancelled', 'expired', 'chargeback'].indexOf(info.status) !== -1) {
          statusPix.textContent = 'Pagamento não concluído.';
          streamSSE && (streamSSE.close(), streamSSE = null);
          return;
        }
        if (info.status === 'paid') {
          statusPix.textContent = 'PIX recebido! Obrigado.';
          carregarMeta();
          streamSSE && (streamSSE.close(), streamSSE = null);
          setTimeout(fecharModal, 2600);
        }
      } catch (e) {}
    };
    streamSSE.onerror = function () {};
  }

  btnCopiar && btnCopiar.addEventListener('click', function () {
    var cod = textoCopiavel.value;
    if (!cod) { alert('Aguarde o Pix antes de copiar.'); return; }
    var done = function () {
      var original = btnCopiar.innerHTML;
      btnCopiar.innerHTML = '✓ COPIADO COM SUCESSO';
      setTimeout(function () { btnCopiar.innerHTML = original; }, 2100);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cod).then(done).catch(function () { textoCopiavel.select(); done(); });
    } else {
      textoCopiavel.select();
      document.execCommand('copy');
      done();
    }
  });

  var linksInternos = document.querySelectorAll('a[href^="#"]');
  for (var m = 0; m < linksInternos.length; m++) {
    linksInternos[m].addEventListener('click', function (e) {
      e.preventDefault();
      var alvo = document.querySelector(this.getAttribute('href'));
      alvo && alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function reaisInteiro(v) {
    return 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
  }
  function minutoAtras(createdAt) {
    if (!createdAt) return null;
    var t = Date.parse(String(createdAt).replace(' ', 'T') + 'Z');
    if (isNaN(t)) return null;
    return Math.max(1, Math.floor((Date.now() - t) / 60000));
  }
  function tempoLegivel(mins) {
    if (mins === null) return '';
    if (mins < 60) return 'há ' + mins + ' min';
    if (mins < 1440) return 'há ' + Math.floor(mins / 60) + ' h';
    return 'há ' + Math.floor(mins / 1440) + ' d';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function renderMeta(dados) {
    var numAtual = document.getElementById('num-atual');
    var numObjetivo = document.getElementById('num-objetivo');
    var barra = document.getElementById('fill-barra');
    var contagem = document.getElementById('contagem-doadores');
    if (numAtual) numAtual.textContent = reaisInteiro(dados.current_amount);
    if (numObjetivo) numObjetivo.textContent = 'de ' + reaisInteiro(dados.target_amount);
    if (barra) barra.style.width = (dados.percent || 0).toFixed(1) + '%';
    if (contagem) contagem.textContent = (dados.donor_count || 0).toLocaleString('pt-BR') + ' pessoas';
  }
  function renderRecentes(recentes) {
    var lista = document.getElementById('lista-recentes');
    if (!lista || !recentes || !recentes.length) return;
    var html = '';
    for (var i = 0; i < recentes.length; i++) {
      var r = recentes[i];
      var nome = (r.name && r.name !== 'Anônimo') ? r.name : 'Doador';
      var mins = minutoAtras(r.created_at);
      html += '<div class="doacao-item">' +
        '<span class="doacao-ini">' + escapeHtml(nome.trim().charAt(0).toUpperCase()) + '</span>' +
        '<div class="doacao-dados">' +
        '<span class="doacao-nome">' + escapeHtml(nome) + '</span>' +
        '<span class="doacao-tempo">' + tempoLegivel(mins) + '</span>' +
        '</div>' +
        '<span class="doacao-valor">R$ ' + Math.round(Number(r.amount) || 0) + '</span>' +
        '</div>';
    }
    lista.innerHTML = html;
  }
  function girarLista() {
    var lista = document.getElementById('lista-recentes');
    if (!lista) return;
    var itens = lista.querySelectorAll('.doacao-item');
    if (itens.length > 1) lista.appendChild(itens[0]);
  }
  function carregarMeta() {
    fetch('api/meta.php', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        if (!dados || !dados.success) return;
        renderMeta(dados);
        renderRecentes(dados.recent);
      })
      .catch(function () {});
  }
  carregarMeta();
  setInterval(carregarMeta, 45000);
  setInterval(girarLista, 4000);
})();
