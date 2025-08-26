// content_script.js

function createModal() {
    if (document.getElementById('ac-result-modal')) return; // Evita criar o modal múltiplas vezes

    const modalHTML = `
        <div id="ac-result-modal-overlay" class="hidden">
            <div id="ac-result-modal">
                <div id="ac-result-modal-header">
                    <h2>Resultado da Busca</h2>
                    <button id="ac-result-modal-close">&times;</button>
                </div>
                <div id="ac-result-modal-content">
                    <p><strong>URL:</strong> <span id="modal-url"></span></p>
                    <p><strong>Conversão:</strong> <span id="modal-conversao"></span></p>
                    <p><strong>Grupo:</strong> <span id="modal-grupo"></span></p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Adiciona evento para fechar o modal
    document.getElementById('ac-result-modal-close').addEventListener('click', () => {
        document.getElementById('ac-result-modal-overlay').classList.add('hidden');
    });
    document.getElementById('ac-result-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'ac-result-modal-overlay') {
            document.getElementById('ac-result-modal-overlay').classList.add('hidden');
        }
    });
}

// Escuta por mensagens vindas do background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showResultModal") {
        const data = request.data;
        
        // Preenche o modal com os dados
        document.getElementById('modal-url').textContent = data.url;
        document.getElementById('modal-conversao').textContent = data.conversao;
        document.getElementById('modal-grupo').textContent = data.grupo || 'N/A';
        
        // Exibe o modal
        document.getElementById('ac-result-modal-overlay').classList.remove('hidden');
    } else if (request.action === "showErrorModal") {
        alert("Erro: " + request.error); // Para erros, um alert simples ainda é eficaz
    }
});

// Garante que o modal seja criado quando a página carregar
createModal();