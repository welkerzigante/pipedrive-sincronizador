const saveButton = document.getElementById('save');
const tokenInput = document.getElementById('token');
const statusDiv = document.getElementById('status');

// Função para salvar o token
function saveToken() {
  const apiToken = tokenInput.value;
  if (!apiToken) {
    statusDiv.textContent = 'Erro: O campo do token não pode estar vazio.';
    statusDiv.style.color = 'red';
    return;
  }
  
  chrome.storage.local.set({ focusNfeToken: apiToken }, () => {
    statusDiv.textContent = 'Token salvo com sucesso!';
    statusDiv.style.color = 'green';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 3000); // Limpa a mensagem após 3 segundos
  });
}

// Função para carregar o token salvo quando a página abrir
function loadToken() {
  chrome.storage.local.get(['focusNfeToken'], (result) => {
    if (result.focusNfeToken) {
      tokenInput.value = result.focusNfeToken;
    }
  });
}

// Adiciona os eventos
document.addEventListener('DOMContentLoaded', loadToken);
saveButton.addEventListener('click', saveToken);