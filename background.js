// background.js (versão com tratamento especial para o erro 'Não Encontrado')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const senderTabId = request.tabId; 

    if (request.action === "acToPipe") {
        if (!senderTabId) {
            console.error("Não foi possível obter o ID da aba para enviar a resposta.");
            return;
        }

        const VERCEL_API_URL = "https://pipedrive-proxy-api.vercel.app/api/acToPipe"; // <-- MUDE A URL
        fetch(VERCEL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dealId: request.dealId })
        })
        .then(response => response.json())
        .then(data => {
            // --- LÓGICA ATUALIZADA PARA TRATAR O ERRO 'NÃO ENCONTRADO' ---

            if (data.success) {
                // Caso de Sucesso: Mostra o modal com os dados encontrados
                chrome.tabs.sendMessage(senderTabId, {
                    action: "showResultModal",
                    data: data.data
                });
            } else {
                // Caso de Erro: Verifica qual foi o erro
                const notFoundError = "Nenhum histórico de navegação (Tracking Log) encontrado para este contato no ActiveCampaign.";

                if (data.error === notFoundError) {
                    // Se o erro for o de "não encontrado", mostra o modal com a mensagem customizada
                    chrome.tabs.sendMessage(senderTabId, {
                        action: "showResultModal",
                        data: {
                            url: "Não identificado",
                            conversao: "Não identificado",
                            grupo: "" // Deixa o grupo vazio
                        }
                    });
                } else {
                    // Para todos os outros erros, mostra o alert padrão
                    chrome.tabs.sendMessage(senderTabId, {
                        action: "showErrorModal",
                        error: data.error
                    });
                }
            }
        })
        .catch(error => {
            // Para erros de conexão, também mostra o alert padrão
            chrome.tabs.sendMessage(senderTabId, {
                action: "showErrorModal",
                error: `Erro de conexão: ${error.message}`
            });
        });
        
        return true;
    }
});