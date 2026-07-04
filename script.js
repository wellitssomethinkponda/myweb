let currentScreen = 'main-screen';
let selectedBankName = 'МБанк';

document.addEventListener('DOMContentLoaded', () => {
  showScreen('main-screen');
  renderBanks();
});

// --- НАВИГАЦИЯ ---
function showScreen(id) {
  currentScreen = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const targetScreen = document.getElementById(id);
  if (targetScreen) targetScreen.classList.add('active');
}

function goToTransfers() { showScreen('transfers-screen'); }
function goBackToMain() { 
  document.getElementById('receipt-header').style.display = 'flex';
  document.getElementById('receipt-actions').style.display = 'block';
  document.body.style.background = '#0a0a0a';
  showScreen('main-screen'); 
}
function goToOtherBanks() { showScreen('banks-screen'); }
function goBackToBanks() { showScreen('banks-screen'); }
function goToHistory() { showScreen('history-screen'); renderHistory(); }

// --- БАНКИ ---
function renderBanks(filtered = banks) {
  const container = document.getElementById('banks-list');
  if (!container) return;
  container.innerHTML = '';
  filtered.forEach(bank => {
    const div = document.createElement('div');
    div.className = 'bank-item';
    div.innerHTML = `<span style="font-size:24px">${bank.logo}</span><span>${bank.name}</span>`;
    div.onclick = () => selectBank(bank);
    container.appendChild(div);
  });
}

function filterBanks() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = banks.filter(b => b.name.toLowerCase().includes(query));
  renderBanks(filtered);
}

function selectBank(bank) {
  selectedBankName = bank.name;
  document.getElementById('bank-title').textContent = bank.name;
  resetTransferForm();
  showScreen('transfer-form-screen');
}

// --- ФОРМА ВВОДА ---
function resetTransferForm() {
  document.getElementById('phone-input').value = '';
  document.getElementById('name-input').value = '';
  document.getElementById('amount-input').value = '';
  document.getElementById('continue-btn').disabled = true;
}

function checkFormValid() {
  const phoneInput = document.getElementById('phone-input');
  phoneInput.value = phoneInput.value.replace(/\D/g, ''); 

  const phoneLen = phoneInput.value.length;
  const nameLen = document.getElementById('name-input').value.trim().length;
  const amount = parseFloat(document.getElementById('amount-input').value || 0);

  document.getElementById('continue-btn').disabled = !(phoneLen === 9 && nameLen > 0 && amount > 0);
}

// --- ОТПРАВКА И ЧЕК ---
function makeTransfer() {
  const amount = parseFloat(document.getElementById('amount-input').value);
  const phone = '+996 ' + document.getElementById('phone-input').value;
  const name = document.getElementById('name-input').value.trim().toUpperCase(); 
  const txId = Math.floor(100000000 + Math.random() * 900000000);
  const now = new Date();

  history.unshift({
    date: now,
    recipient: name,
    amount: amount,
    bank: selectedBankName
  });

  document.getElementById('rec-name').textContent = name;
  document.getElementById('rec-phone').textContent = phone;
  document.getElementById('rec-amount').textContent = amount.toFixed(2);
  document.getElementById('receipt-date').textContent = now.toLocaleString('ru-RU');
  document.getElementById('tx-id').textContent = txId;
  document.getElementById('rec-description').textContent = `${selectedBankName} - пополнение по номеру телефона`;

  document.getElementById('receipt-header').style.display = 'flex';
  document.getElementById('receipt-actions').style.display = 'block';
  document.body.style.background = '#0a0a0a';

  showScreen('receipt-screen');
  generateQR(phone, amount, name);
}

function generateQR(phone, amount, name) {
  const container = document.getElementById('qr-code');
  container.innerHTML = '';
  const text = `DemirBank|${selectedBankName}|${phone}|${amount} KGS|${name}`;
  new QRCode(container, { text: text, width: 150, height: 150 });
}

// --- ФИЧА: ОТПРАВИТЬ ЧЕК ЧЕРЕЗ МЕНЮ ТЕЛЕФОНА ---
function shareReceipt() {
  const txId = document.getElementById('tx-id').textContent;
  const name = document.getElementById('rec-name').textContent;
  const phone = document.getElementById('rec-phone').textContent;
  const amount = document.getElementById('rec-amount').textContent;
  const date = document.getElementById('receipt-date').textContent;

  // Формируем красивый текстовый вид чека, который отправится в мессенджер
  const shareText = `🧾 Квитанция DemirBank №${txId}\n` +
                    `----------------------------------------\n` +
                    `📅 Дата: ${date}\n` +
                    `🏦 Банк получателя: ${selectedBankName}\n` +
                    `👤 Получатель: ${name}\n` +
                    `📱 Номер: ${phone}\n` +
                    `💰 Сумма: ${amount} KGS\n` +
                    `✅ Статус: Успешно проведено\n` +
                    `----------------------------------------\n` +
                    `🔗 Проверить на официальном сайте: ${window.location.href}`;

  // Проверяем, поддерживает ли телефон функцию "Поделиться"
  if (navigator.share) {
    navigator.share({
      title: `Чек DemirBank №${txId}`,
      text: shareText
    })
    .then(() => console.log('Чек успешно отправлен!'))
    .catch((error) => console.log('Ошибка отправки:', error));
  } else {
    // Запасной вариант, если браузер совсем древний — копируем текст в буфер обмена
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Текст чека скопирован в буфер обмена! Теперь вы можете просто вставить (вложить) его в чат WhatsApp или Telegram.');
    }).catch(() => {
      // Если даже буфер заблокирован, открываем экран для скриншота
      prepareForScreenshot();
    });
  }
}

// --- РЕЖИМ СКРИНШОТА ---
function prepareForScreenshot() {
  document.getElementById('receipt-header').style.display = 'none';
  document.getElementById('receipt-actions').style.display = 'none';
  document.body.style.background = '#f5f5f5';
  
  setTimeout(() => {
    alert('Экран готов! Сделайте скриншот кнопками телефона.\n\nЧтобы вернуться назад, просто нажмите в любое место экрана.');
    
    const exitScreenshot = () => {
      document.getElementById('receipt-header').style.display = 'flex';
      document.getElementById('receipt-actions').style.display = 'block';
      document.body.style.background = '#0a0a0a';
      document.removeEventListener('click', exitScreenshot);
    };
    
    setTimeout(() => {
      document.addEventListener('click', exitScreenshot);
    }, 300);
  }, 100);
}

// --- ОТРИСОВКА ИСТОРИИ ---
function renderHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = '';
  
  if (history.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">История операций пуста</p>';
    return;
  }

  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.style.display = 'flex';
    div.style.justify = 'space-between';
    div.style.alignItems = 'center';
    
    div.innerHTML = `
      <div style="flex: 1;">
        <small style="color: #888;">${item.date.toLocaleString('ru-RU')}</small>
        <p style="margin-top: 5px; font-weight: bold;">${item.bank} → ${item.recipient}</p>
      </div>
      <div style="color: #00ff9d; font-weight: bold;">-${item.amount.toFixed(2)} KGS</div>
    `;
    container.appendChild(div);
  });
}
