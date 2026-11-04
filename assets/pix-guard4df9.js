// Script para destravar o botão de PIX caso o servidor falhe
document.addEventListener('click', function (evento) {
    const alvo = evento.target;
    if (alvo && (alvo.innerText.includes('Continuar') || alvo.innerText.includes('Contribuir') || alvo.innerText.includes('Gerar') || alvo.tagName === 'BUTTON')) {
        setTimeout(() => {
            const botoes = document.querySelectorAll('button');
            botoes.forEach(btn => {
                if (btn.innerText.includes('Gerando') || btn.innerText.includes('A gerarn')) {
                    setTimeout(() => {
                        btn.innerText = 'Erro ao conectar com o pagamento';
                        btn.disabled = false;
                        alert('O sistema de pagamento está temporariamente indisponível. Verifique se o servidor de retaguarda está ativo.');
                    }, 3000);
                }
            });
        }, 500);
    }
});
