const LS_INVOICES = 'invoices_v1_enter';
const LS_COUNTER = 'vat_counter_enter';
let items = [];
let logoAvailable = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('invDate').value = formatDate(new Date());
  document.getElementById('invNumber').value = generateInvoiceNumber();
  document.getElementById('addItemBtn').addEventListener('click', addItem);
  document.getElementById('generatePdf').addEventListener('click', onGeneratePdf);
  document.getElementById('printBtn').addEventListener('click', onPrint);
  document.getElementById('saveRecord').addEventListener('click', saveToHistory);
  document.getElementById('loadHistory').addEventListener('click', showHistory);
  document.getElementById('clearAll').addEventListener('click', clearForm);

  const img = document.getElementById('brandLogo');
  img.onerror = () => { logoAvailable = false; };
  img.onload = () => { logoAvailable = true; };

  if (localStorage.getItem(LS_INVOICES)) showHistory();
});

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function generateInvoiceNumber() {
  const key = LS_COUNTER;
  let cnt = Number(localStorage.getItem(key) || 0);
  cnt++;
  localStorage.setItem(key, String(cnt));
  const year = new Date().getFullYear();
  return `${year}/${String(cnt).padStart(4, '0')}`;
}

function addItem() {
  const code = document.getElementById('itemCode').value.trim();
  const name = document.getElementById('itemName').value.trim();
  const uom = document.getElementById('itemUom').value.trim();
  const qty = Number(document.getElementById('itemQty').value);
  const inv = document.getElementById('itemInv').value.trim();
  const note = document.getElementById('itemNote').value.trim();
  if (!name || !qty) return alert('Введите наименование и количество');
  const it = { id: 'i_' + Date.now(), code, name, uom, qty, inv, note };
  items.push(it);
  renderItems();
  ['itemCode','itemName','itemUom','itemQty','itemInv','itemNote'].forEach(id => document.getElementById(id).value = '');
}

function renderItems() {
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  items.forEach((it, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(it.code)}</td><td>${escapeHtml(it.name)}</td><td>${escapeHtml(it.uom)}</td><td style="text-align:right">${it.qty}</td><td>${escapeHtml(it.inv)}</td><td>${escapeHtml(it.note)}</td><td><button class="ghost" onclick="removeItem('${it.id}')">Удал</button></td>`;
    tbody.appendChild(tr);
  });
}

function removeItem(id) { items = items.filter(i => i.id !== id); renderItems(); }
function escapeHtml(s) { return s ? s.replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c])) : ''; }

function collectForm() {
  const ids = ['invNumber','invDate','organization','fromWarehouse','toWarehouse','viaPerson','driverPhone','vehicle','basis','responsible','releasedBy','receivedForTransport','receivedBy','operator','storekeeper'];
  return Object.fromEntries(ids.map(id => [id, document.getElementById(id).value || '']));
}

function buildSingleInvoice(data, items) {
  const rows = items.map((it, idx) => `
    <tr>
      <td style="border:1px solid #000;padding:4px">${idx+1}</td>
      <td style="border:1px solid #000;padding:4px">${escapeHtml(it.code)}</td>
      <td style="border:1px solid #000;padding:4px">${escapeHtml(it.name)}</td>
      <td style="border:1px solid #000;padding:4px">${escapeHtml(it.uom)}</td>
      <td style="border:1px solid #000;padding:4px;text-align:right">${it.qty}</td>
      <td style="border:1px solid #000;padding:4px">${escapeHtml(it.inv)}</td>
      <td style="border:1px solid #000;padding:4px">${escapeHtml(it.note)}</td>
    </tr>`).join('');

  const logoTag = logoAvailable
    ? `<img src="logo.png" style="max-width:150px;max-height:60px" />`
    : `<div style="width:150px;height:60px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd">LOGO</div>`;

  // строки для подписи с именами из формы
  const line = (label, name) => `
    <div style="flex:1 1 30%;margin-top:4px">
      <strong>${label}:</strong>
      <span style="display:inline-block;border-bottom:1px solid #000;width:70px;"></span>
      ${name ? escapeHtml(name) : ''}
    </div>`;

  return `
    <div style="width:800px;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:12px;page-break-inside:avoid">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:160px;height:60px;display:flex;align-items:center;justify-content:center">${logoTag}</div>
        <div style="flex:1;text-align:center">
          <div style="font-size:18px;font-weight:700">Товарная накладная</div>
          <div style="font-size:12px">на внутреннее перемещение</div>
          <div style="margin-top:6px;font-size:12px">№ ${escapeHtml(data.invNumber)} от ${escapeHtml(data.invDate)}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px">
        <tr>
          <td style="padding:4px;border:1px solid #000;width:33%"><strong>Организация</strong><br>${escapeHtml(data.organization)}</td>
          <td style="padding:4px;border:1px solid #000;width:33%"><strong>Со склада</strong><br>${escapeHtml(data.fromWarehouse)}</td>
          <td style="padding:4px;border:1px solid #000;width:33%"><strong>На склад</strong><br>${escapeHtml(data.toWarehouse)}</td>
        </tr>
        <tr>
          <td style="padding:4px;border:1px solid #000"><strong>Через кого</strong><br>${escapeHtml(data.viaPerson)}</td>
          <td style="padding:4px;border:1px solid #000"><strong>Тел. водителя</strong><br>${escapeHtml(data.driverPhone)}</td>
          <td style="padding:4px;border:1px solid #000"><strong>Авто</strong><br>${escapeHtml(data.vehicle)}</td>
        </tr>
        <tr>
          <td style="padding:4px;border:1px solid #000" colspan="3"><strong>На основании</strong><br>${escapeHtml(data.basis)}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:11px">
        <thead><tr>
          <th style="border:1px solid #000;padding:4px">№</th>
          <th style="border:1px solid #000;padding:4px">Код</th>
          <th style="border:1px solid #000;padding:4px">Наименование</th>
          <th style="border:1px solid #000;padding:4px">Ед.</th>
          <th style="border:1px solid #000;padding:4px">Кол-во</th>
          <th style="border:1px solid #000;padding:4px">Инвойс</th>
          <th style="border:1px solid #000;padding:4px">Примечание</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;gap:8px;margin-top:10px;font-size:11px;flex-wrap:wrap">
        ${line('Отпустил', data.releasedBy)}
        ${line('Получил к перевозке', data.receivedForTransport)}
        ${line('Получил', data.receivedBy)}
        ${line('Оператор', data.operator)}
        ${line('Кладовщик', data.storekeeper)}
      </div>

      <div style="margin-top:12px;font-size:10px;color:#444">
        Погрузка производилась в моём присутствии сотрудниками склада, к качеству и количеству претензий не имею.
      </div>
    </div>`;
}

function buildInvoiceHtml(data, items) {
  const single = buildSingleInvoice(data, items);
  return `<div id="pageWrap" style="transform-origin:top left;display:flex;flex-direction:column;align-items:center;gap:20px">${single}${single}</div>`;
}

// авто-масштабирование
async function fitToPage(container) {
  const a4Height = 1122;
  const wrap = container.querySelector('#pageWrap');
  const totalHeight = wrap.scrollHeight;
  if (totalHeight > a4Height) {
    const scale = a4Height / totalHeight * 0.95;
    wrap.style.transform = `scale(${scale})`;
  }
}

async function onGeneratePdf() {
  if (!items.length) return alert('Добавьте хотя бы один товар');
  const data = collectForm();
  const html = buildInvoiceHtml(data, items);
  const container = document.getElementById('printContainer');
  container.hidden = false;
  container.innerHTML = html;
  await waitForImages(container);
  await fitToPage(container);
  const canvas = await html2canvas(container, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = canvas.height * (pageWidth / canvas.width);
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
  pdf.save(`${data.invNumber}_${data.invDate}.pdf`);
  container.hidden = true;
}

async function onPrint() {
  if (!items.length) return alert('Добавьте товары перед печатью');
  const data = collectForm();
  const html = buildInvoiceHtml(data, items);
  const w = window.open('', '_blank');
  w.document.write('<!doctype html><html><head><title>Печать накладной</title><style>body{margin:10px}</style></head><body>' + html + '</body></html>');
  w.document.close(); w.focus();
  await new Promise(r => setTimeout(r, 700));
  await fitToPage(w.document.body);
  setTimeout(() => { w.print(); }, 500);
}

function waitForImages(container) {
  const imgs = container.querySelectorAll('img');
  return Promise.all(Array.from(imgs).map(img => new Promise(res => { if (img.complete) res(); else { img.onload = res; img.onerror = res; } })));
}

function clearForm() {
  if (!confirm('Очистить форму?')) return;
  document.getElementById('mainForm').reset();
  items = []; renderItems();
  document.getElementById('invDate').value = formatDate(new Date());
  document.getElementById('invNumber').value = generateInvoiceNumber();
}

function saveToHistory() {
  if (!items.length) return alert('Нечего сохранять');
  const data = collectForm();
  const rec = { id: 'r_' + Date.now(), data, items };
  const all = JSON.parse(localStorage.getItem(LS_INVOICES) || '[]');
  all.unshift(rec);
  localStorage.setItem(LS_INVOICES, JSON.stringify(all));
  alert('Сохранено в историю');
  showHistory();
}

function showHistory() {
  const all = JSON.parse(localStorage.getItem(LS_INVOICES) || '[]');
  const p = document.getElementById('historyPanel');
  p.innerHTML = '<strong>История накладных</strong>';
  if (!all.length) { p.innerHTML += '<div class="muted">Пусто</div>'; return; }
  all.forEach(r => {
    const d = document.createElement('div');
    d.className = 'hist-row';
    d.style.padding = '8px';
    d.style.borderBottom = '1px solid #eee';
    d.innerHTML = `<strong>${r.data.invNumber}</strong> — ${r.data.invDate}
      <button class="ghost" onclick="loadFromHistory('${r.id}')">Загрузить</button>
      <button class="ghost" onclick="deleteHistory('${r.id}')">Удалить</button>`;
    p.appendChild(d);
  });
}

window.loadFromHistory = function(id) {
  const all = JSON.parse(localStorage.getItem(LS_INVOICES) || '[]');
  const rec = all.find(r => r.id === id);
  if (!rec) return alert('Не найдено');
  const d = rec.data;
  for (const k in d) if (document.getElementById(k)) document.getElementById(k).value = d[k];
  items = rec.items; renderItems();
  alert('Запись загружена');
};

window.deleteHistory = function(id) {
  if (!confirm('Удалить запись?')) return;
  const all = JSON.parse(localStorage.getItem(LS_INVOICES) || '[]');
  localStorage.setItem(LS_INVOICES, JSON.stringify(all.filter(r => r.id !== id)));
  showHistory();
};
