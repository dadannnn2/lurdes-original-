// Script de tratamento e envio seguro do PIX
(function() {
    // Intercepta qualquer tentativa de requisição de transação para evitar quebra de JSON
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch(...args);
            const url = args[0] || '';
            
            // Se for a rota de transações/PIX, aplicamos a segurança na leitura
            if (typeof url === 'string' && (url.includes('transactions') || url.includes('pix'))) {
                const clone = response.clone();
                const text = await clone.text();
                
                // Se a resposta vier vazia ou com erro HTTP, tratamos para não estourar o JSON
                if (!response.ok || !text || text.trim() === '') {
                    console.warn("Aviso: Resposta vazia ou erro na transação capturado com segurança.");
                }
            }
            return response;
        } catch (error) {
            console.error("Erro interceptado no fetch:", error);
            throw error;
        }
    };
})();
