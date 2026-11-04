// Script de redirecionamento seguro para o PIX
document.addEventListener('click', function (evento) {
    const alvo = evento.target;
    
    // Deteta o clique no botão de gerar doação
    if (alvo && (alvo.innerText.includes('Continuar') || alvo.innerText.includes('Contribuir') || alvo.innerText.includes('Gerar'))) {
        evento.preventDefault();
        
        const botao = alvo;
        botao.innerText = "A redirecionar para o pagamento...";
        botao.disabled = true;

        // Como alternativa segura para sites estáticos, simulamos a abertura imediata do checkout
        setTimeout(() => {
            alert("Redirecionando para o ambiente de pagamento seguro Omegapay...");
            // Substitua abaixo pelo link direto do seu painel da Omegapay se desejar, ou reative o botão
            botao.innerText = "Gerar PIX";
            botao.disabled = false;
        }, 1500);
    }
});
