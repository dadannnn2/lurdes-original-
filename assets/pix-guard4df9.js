document.addEventListener('click', function (evento) {
    const alvo = evento.target;
    
    // Verifica se o utilizador clicou no botão de gerar ou continuar
    if (alvo && (alvo.innerText.includes('Continuar') || alvo.innerText.includes('Contribuir') || alvo.innerText.includes('Gerar Pix'))) {
        evento.preventDefault();
        
        const botao = alvo;
        botao.innerText = "A processar PIX...";
        botao.disabled = true;

        // Simula a resposta imediata para destravamento e teste visual do fluxo
        setTimeout(() => {
            alert("⚠️ Sistema configurado com sucesso!\n\nPara pagamentos reais automatizados via Omegapay num site estático na Vercel, o ideal é direcionar o botão para o link de checkout direto gerado na sua conta da Omegapay.");
            
            botao.innerText = "Gerar PIX";
            botao.disabled = false;
        }, 1500);
    }
});
