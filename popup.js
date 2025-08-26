// popup.js (versão final com WhatsApp Web)

// --- SELEÇÃO DE TODOS OS BOTÕES ---
const openWhatsAppButton = document.getElementById('open-whatsapp');
const consultarCnpjButton = document.getElementById('consultar-cnpj');
const buscarGatewayButton = document.getElementById('buscar-gateway');
const buscarBillingButton = document.getElementById('buscar-billing');
const acToPipeButton = document.getElementById('ac-to-pipe');

// --- AÇÃO 1: ABRIR WHATSAPP (MODIFICADO) ---
openWhatsAppButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: getPhoneNumberFromPage,
    }, results => {
      if (chrome.runtime.lastError || !results || !results[0].result) {
        alert('Não foi possível encontrar um número de telefone nesta página do Pipedrive.');
        return;
      }
      const phone = results[0].result;
      // Troca o protocolo para a URL do WhatsApp Web
      const sendUrl = `https://web.whatsapp.com/send?phone=${phone}`;
      // Usa a API do Chrome para criar uma nova aba, que é mais confiável
      chrome.tabs.create({ url: sendUrl });
    });
  });
});

// --- AÇÃO 2: BUSCAR DEAL NO GATEWAY ---
buscarGatewayButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: getDealNameFromPage,
    }, results => {
      if (chrome.runtime.lastError || !results || !results[0].result) {
        alert('Não foi possível encontrar o nome do deal nesta página.');
        return;
      }
      const dealName = results[0].result;
      const encodedDealName = encodeURIComponent(dealName);
      const gatewayUrl = `https://api.focusnfe.com.br/admin/client_apps?utf8=%E2%9C%93&master=1&nome=${encodedDealName}&access_token=&commit=Buscar`;
      chrome.tabs.create({ url: gatewayUrl });
    });
  });
});

// --- AÇÃO 3: BUSCAR DEAL NO BILLING (CAPIVARA) ---
buscarBillingButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: getDealNameFromPage, // Reutiliza a mesma função
      }, results => {
        if (chrome.runtime.lastError || !results || !results[0].result) {
          alert('Não foi possível encontrar o nome do deal nesta página.');
          return;
        }
        const dealName = results[0].result;
        const encodedDealName = encodeURIComponent(dealName);
        const billingUrl = `https://capivara.focusnfe.com.br/admin/financeiro/clientes/?search_text=${encodedDealName}&page=1&incluir_inativos=false`;
        chrome.tabs.create({ url: billingUrl });
      });
    });
  });

// --- AÇÃO 4: CONSULTAR CNPJ ---
consultarCnpjButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: getCnpjFromPage,
    }, results => {
      if (chrome.runtime.lastError || !results || !results[0].result) {
        alert('Não foi possível encontrar um campo de CNPJ preenchido nesta página do Pipedrive.');
        return;
      }
      const cnpj = results[0].result;
      fetchCnpjData(cnpj);
    });
  });
});

// --- AÇÃO 5: AC TO PIPE ---
acToPipeButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const activeTabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: getDealIdFromUrl,
      }, results => {
        if (chrome.runtime.lastError || !results || !results[0].result) {
          alert('Não foi possível encontrar o ID do Deal. Certifique-se de que você está na página de um deal.');
          return;
        }
        const dealId = results[0].result;
        acToPipeButton.textContent = 'Buscando...';
        acToPipeButton.disabled = true;
        chrome.runtime.sendMessage({ 
            action: "acToPipe", 
            dealId: dealId,
            tabId: activeTabId
        });
      });
    });
});


// --- FUNÇÕES AUXILIARES (INJETADAS NA PÁGINA) ---

function getPhoneNumberFromPage() {
  const phoneElement = document.querySelector('[data-test="phone-number-button"]');
  if (!phoneElement) return null;
  let phone = phoneElement.innerText.replace(/\D/g, '');
  if (phone && !phone.startsWith('55')) {
    phone = '55' + phone;
  }
  return phone;
}

function getCnpjFromPage() {
  const allFieldRows = document.querySelectorAll('[data-testid="fields-list-row"]');
  let cnpjValue = null;
  for (const row of allFieldRows) {
    const labelElement = row.querySelector('[data-testid="field-name"]');
    if (labelElement && labelElement.innerText.trim().toLowerCase() === 'cnpj') {
      const valueContainer = row.querySelector('[data-testid="fields-list-row-field-components"]');
      if (valueContainer) {
        cnpjValue = valueContainer.innerText;
        break;
      }
    }
  }
  if (cnpjValue) {
    return cnpjValue.replace(/\D/g, '');
  }
  return null;
}

function getDealNameFromPage() {
  const dealNameElement = document.querySelector('[data-testid="header-title"] textarea.cui5-editable-text__input');
  if (dealNameElement) {
    return dealNameElement.value;
  }
  return null;
}

function getDealIdFromUrl() {
    const match = window.location.pathname.match(/\/deal\/(\d+)/);
    return match ? match[1] : null;
}

// --- FUNÇÃO AUXILIAR PARA O POPUP (NÃO INJETADA) ---
async function fetchCnpjData(cnpj) {
  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.status === 404) {
      alert(`Erro ao consultar o CNPJ: ${data.message}`);
      return;
    }
    let htmlResult = `
    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Consulta: ${data.razao_social||cnpj}</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;line-height:1.7;background-color:#f5f7fa;color:#333;margin:0;padding:20px;}.container{max-width:800px;margin:20px auto;background-color:#ffffff;padding:30px;border-radius:10px;box-shadow:0 5px 15px rgba(0,0,0,0.07);}h1{font-size:26px;color:#1c3d5a;border-bottom:2px solid #eef2f7;padding-bottom:15px;margin-top:0;}h2{font-size:20px;color:#0056b3;margin-top:35px;border-bottom:1px solid #eef2f7;padding-bottom:8px;}p,li{font-size:16px;}.label{font-weight:600;color:#444;}ul{list-style-type:none;padding-left:0;}li{background-color:#f9fafb;border:1px solid #e1e8ed;padding:15px;margin-bottom:10px;border-radius:6px;}</style></head><body><div class="container"><h1>${data.razao_social||'Dados da Empresa'}</h1><p><span class="label">CNPJ:</span> ${data.cnpj}</p><h2>Atividade Principal (CNAE)</h2><p>${data.cnae_fiscal_descricao||'Não informado'}</p><h2>Atividades Secundárias</h2>`;
    if (data.cnaes_secundarios && data.cnaes_secundarios.length > 0) {
      htmlResult += '<ul>';
      data.cnaes_secundarios.forEach(cnae => {
        htmlResult += `<li><span class="label">${cnae.codigo}</span>: ${cnae.descricao}</li>`;
      });
      htmlResult += '</ul>';
    } else {
      htmlResult += '<p>Nenhuma atividade secundária informada.</p>';
    }
    htmlResult += `</div></body></html>`;
    const newTab = window.open();
    newTab.document.open();
    newTab.document.write(htmlResult);
    newTab.document.close();
  } catch (error) {
    alert('Ocorreu um erro ao consultar a API: ' + error.message);
  }
}