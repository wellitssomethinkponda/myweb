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
function goBackToMain() { showScreen('main-screen'); }
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

  showScreen('receipt-screen');
  generateQR(phone, amount, name);
}

function generateQR(phone, amount, name) {
  const container = document.getElementById('qr-code');
  container.innerHTML = '';
  const text = `DemirBank|${selectedBankName}|${phone}|${amount} KGS|${name}`;
  new QRCode(container, { text: text, width: 150, height: 150 });
}

// --- СТОПРОЦЕНТНАЯ ГЕНЕРАЦИЯ КАРТИНКИ ЧЕКА ДЛЯ ЛЮБЫХ ТЕЛЕФОНОВ ---
function createReceiptPhoto() {
  const targetElement = document.querySelector('.receipt');
  
  if (!targetElement) {
    alert('Чек не найден в системе!');
    return;
  }

  if (typeof html2canvas === 'undefined') {
    alert('Ошибка: Скрипт генерации картинок не загрузился. Попробуйте обновить страницу.');
    return;
  }

  // Временно отключаем тень, чтобы она не раздваивалась на готовой картинке
  const originalBoxShadow = targetElement.style.boxShadow;
  targetElement.style.boxShadow = 'none';

  // Настройки скриншотера для мобильных движков браузеров
  const options = {
    scale: 2,                     // Высокое качество картинки (HD)
    useCORS: true,                // Обход блокировок хостинга
    allowTaint: true,             // Корректный перенос стилей чека
    backgroundColor: '#ffffff'    // Чистый белый фон у картинки чека
  };

  html2canvas(targetElement, options).then(canvas => {
    // Возвращаем тень обратно на сайт
    targetElement.style.style = originalBoxShadow;

    // Конвертируем холст в обычное фото формата PNG (строка base64)
    const imgDataUrl = canvas.toDataURL('image/png');

    // Находим контейнер в модальном окне и вставляем туда картинку как реальный элемент <img>
    const imgContainer = document.getElementById('overlay-img-container');
    imgContainer.innerHTML = `<img src="${imgDataUrl}" class="generated-receipt-photo" alt="Чек">`;

    // Показываем модальное окно на весь экран телефона
    document.getElementById('mobile-receipt-overlay').style.display = 'flex';
  }).catch(err => {
    targetElement.style.boxShadow = originalBoxShadow;
    console.error(err);
    alert('Не удалось автоматически сгенерировать фото. Пожалуйста, сделайте обычный скриншот экрана кнопками вашего смартфона.');
  });
}

// Закрытие модального окна
function closeOverlay() {
  document.getElementById('mobile-receipt-overlay').style.display = 'none';
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