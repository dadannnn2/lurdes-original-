// Script de liberação do botão PIX travado
document.addEventListener("DOMContentLoaded", function() {
    const botaoGerar = document.querySelector("#btn-gerar-pix, .btn-gerar, button.gerar-pix, .modal button");
    
    // Intercepta cliques em botões de carregamento para evitar o travamento eterno
    document.querySelectorAll("button").forEach(btn => {
        if (btn.innerText.includes("Gerando") || btn.innerText.includes("PIX")) {
            btn.addEventListener("click", function() {
                setTimeout(() => {
                    if (btn.innerText.includes("Gerando")) {
                        btn.innerText = "A Gerar Pix...";
                        // Libera o botão após 3 segundos se a API falhar, evitando o travamento da imagem
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.innerText = "Gerar PIX";
                        }, 3000);
                    }
                }, 1000);
            });
        }
    });
});
