let currentScreen = 'main-screen';
let selectedBankName = 'МБанк';

document.addEventListener('DOMContentLoaded', () => {
  showScreen('main-screen');
  renderBanks();
});

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
  new QRCode(container, { text: text, width: 100, height: 100 }); // Уменьшили до 100px, чтобы не растягивать экран
}

// ЖЕЛЕЗОБЕТОННЫЙ МЕТОД ДЛЯ АЙФОНА 15 (ЧЕРЕЗ КАНВАС БЕЗ СБОЙНЫХ БИБЛИОТЕК)
function shareReceiptOnIphone() {
  const txId = document.getElementById('tx-id').textContent;
  const date = document.getElementById('receipt-date').textContent;
  const name = document.getElementById('rec-name').textContent;
  const phone = document.getElementById('rec-phone').textContent;
  const amount = document.getElementById('rec-amount').textContent;
  const desc = document.getElementById('rec-description').textContent;

  // Рисуем чек "вслепую" прямо в памяти через стандартный быстрый Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Идеальный размер под экран Айфона (пропорции 1 к 1.5)
  canvas.width = 500;
  canvas.height = 760;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Шапка чека
  ctx.fillStyle = '#e30613';
  ctx.fillRect(25, 80, 450, 2);

  ctx.fillStyle = '#e30613';
  ctx.font = 'bold 38px Arial';
  ctx.fillText('db', 30, 60);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('DemirBank', 85, 45);
  ctx.fillStyle = '#555555';
  ctx.font = '11px Arial';
  ctx.fillText('bank for your life', 85, 62);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`№ ${txId}`, 470, 52);
  ctx.textAlign = 'left';

  // Отрисовка полей чека (компактная высота)
  let currentY = 120;
  function addCheckLine(label, value, isSum = false) {
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText(label, 30, currentY);
    
    currentY += 18;
    ctx.fillStyle = '#000000';
    ctx.font = isSum ? 'bold 16px Arial' : '14px Arial';
    ctx.fillText(value, 30, currentY);
    
    currentY += 10;
    ctx.strokeStyle = '#e0e0e0';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(30, currentY);
    ctx.lineTo(470, currentY);
    ctx.stroke();
    currentY += 24;
  }

  addCheckLine('Дата и время транзакции', date);
  addCheckLine('Способ отправки', 'Smart payments');
  addCheckLine('Плательщик', 'Махмуджанов Азиз Абдуллаевич');
  addCheckLine('Реквизиты плательщика', '1180000048110691');
  addCheckLine('Банк плательщика', 'ЗАО "Демир Кыргыз Интернэшнл Банк"');
  addCheckLine('Получатель', name);
  addCheckLine('Реквизиты получателя', phone);
  addCheckLine('Сумма', `${amount} KGS`, true);
  addCheckLine('Комиссия', '0,00 KGS');
  addCheckLine('Описание', desc);

  // Печать (аккуратная синяя)
  ctx.save();
  ctx.translate(350, 420);
  ctx.rotate(-10 * Math.PI / 180);
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(0, 0, 120, 42);
  ctx.fillStyle = '#00aaff';
  ctx.font = 'bold 9px Arial';
  ctx.fillText('ЗАО «ДЕМИР КЫРГЫЗ', 10, 18);
  ctx.fillText('ИНТЕРНЭШНЛ БАНК»', 10, 31);
  ctx.restore();

  // Нижний колонтитул
  ctx.fillStyle = '#777777';
  ctx.font = '11px Arial';
  ctx.fillText('Лицензия НБКР № 035', 30, 730);
  ctx.textAlign = 'right';
  ctx.fillText('+996 (312) 610 610, 2222', 470, 730);

  // Превращаем в картинку и сразу шлем в меню Айфона
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `Receipt_${txId}.png`, { type: 'image/png' });

    // Родной, вот это меню Айфон откроет МГНОВЕННО и без ошибок:
    if (navigator.share) {
      navigator.share({
        files: [file],
        title: `Чек №${txId}`
      }).catch(e => console.log('Отмена отправки'));
    } else {
      // На случай если открыто внутри какого-то совсем кривого приложения
      alert('Ваш браузер заблокировал шторку. Пожалуйста, удерживайте палец на чеке для сохранения.');
    }
  }, 'image/png');
}

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
