// Integração oficial da Omegapay para o projeto doacao irma lurdes
document.addEventListener('click', function (evento) {
    const alvo = evento.target;
    
    // Deteta o clique no botão de gerar ou continuar a doação
    if (alvo && (alvo.innerText.includes('Continuar') || alvo.innerText.includes('Contribuir') || alvo.innerText.includes('Gerar'))) {
        
        // Pega o valor selecionado na tela
        const valorSelecionado = document.querySelector('.valor-selecionado, [data-valor], input[type="number"]');
        let valorEmCentavos = 3000; // Valor padrão de R$ 30,00 caso não localize
        
        if (valorSelecionado) {
            let numeroLimpo = valorSelecionado.innerText.replace('R$', '').replace(',', '.').trim();
            if (!isNaN(numeroLimpo) && numeroLimpo > 0) {
                valorEmCentavos = Math.round(parseFloat(numeroLimpo) * 100);
            }
        }

        evento.preventDefault();
        
        const botao = alvo;
        const textoOriginal = botao.innerText;
        botao.innerText = "Gerando Pix...";
        botao.disabled = true;

        // Suas credenciais da Omegapay extraídas do painel
        const clientId = "danilolintz1_h433cjjzcd0l6swe";
        const clientSecret = "fne4xv7eqge2wdsatljmrtpe1hq86xoxg4hnffnwser1c3y1lbfrv2ilr85025jn";

        // Requisição para a API da Omegapay
        fetch('https://api.omegapay.com/v1/transactions', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Id': clientId,
                'X-Client-Secret': clientSecret
            },
            body: JSON.stringify({
                amount: valorEmCentavos,
                payment_method: 'pix',
                description: 'Doação - Irmã Lurdes'
            })
        })
        .then(async response => {
            const text = await response.text();
            if (!text) throw new Error("Resposta vazia da Omegapay.");
            return JSON.parse(text);
        })
        .then(data => {
            botao.innerText = "PIX Gerado com Sucesso!";
            
            // Se a API retornar o link de pagamento ou QR Code, redireciona o doador
            if(data.payment_url || data.pix_qr_code) {
                window.location.href = data.payment_url || data.pix_qr_code;
            } else {
                alert("PIX gerado com sucesso, mas nenhum link de redirecionamento foi retornado.");
            }
        })
        .catch(error => {
            console.error("Erro na Omegapay:", error);
            botao.innerText = textoOriginal;
            botao.disabled = false;
            alert("Erro ao gerar o PIX. Por favor, tente novamente.");
        });
    }
});
