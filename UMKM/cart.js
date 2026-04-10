// ── URL Google Apps Script ──
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3L8rMMTKko05P_A0vCDHf6jUU_UWl8ctobmAD0hRHiPh0eHI2I799DtCIXYUL7fqmdQ/exec';

// ── Category tabs ──
function showCat(id, btn) {
  document.querySelectorAll('.cat-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('cat-' + id).classList.add('active');
  btn.classList.add('active');
}

// ── Cart state ──
let cart = [];

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  updateFab();
  const btn = event.target;
  btn.textContent = '✓ Ditambahkan';
  btn.style.background = '#16a34a';
  setTimeout(() => { btn.textContent = '+ Keranjang'; btn.style.background = ''; }, 1200);
}

function updateFab() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const fab = document.getElementById('cart-fab');
  document.getElementById('cart-badge').textContent = total;
  fab.classList.toggle('hidden', total === 0);
}

function openCart() {
  renderCartItems();
  document.getElementById('cart-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  const totalRow = document.getElementById('cart-total-row');
  const form = document.getElementById('checkout-form');

  if (cart.length === 0) {
    list.innerHTML = '<p class="text-stone-400 text-sm text-center py-6">Keranjang masih kosong. Pilih menu dulu ya!</p>';
    totalRow.classList.add('hidden');
    totalRow.style.display = 'none';
    form.classList.add('hidden');
    return;
  }

  let html = '';
  let total = 0;
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    html += `
      <div class="cart-item-row">
        <div style="flex:1">
          <div class="font-medium text-sm" style="color:var(--brown)">${item.name}</div>
          <div class="text-xs text-stone-400">Rp ${item.price.toLocaleString('id-ID')} / pcs</div>
        </div>
        <div class="flex items-center gap-2 ml-3">
          <button class="qty-btn" onclick="changeQty(${idx},-1)">−</button>
          <span class="font-bold text-sm w-5 text-center">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${idx},1)">+</button>
          <span class="price-tag ml-2" style="font-size:0.85rem">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
        </div>
      </div>`;
  });

  list.innerHTML = html;
  document.getElementById('cart-total-text').textContent = 'Rp ' + total.toLocaleString('id-ID');
  totalRow.classList.remove('hidden');
  totalRow.style.display = 'flex';
  form.classList.remove('hidden');
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateFab();
  renderCartItems();
}

// ── Kirim pesanan ke Google Sheets ──
async function submitOrder() {
  const nama = document.getElementById('inp-nama').value.trim();
  const alamat = document.getElementById('inp-alamat').value.trim();
  const hp = document.getElementById('inp-hp').value.trim();

  if (!nama || !alamat || !hp) {
    alert('Mohon isi nama, alamat, dan nomor HP terlebih dahulu.');
    return;
  }
  if (cart.length === 0) {
    alert('Keranjang masih kosong!');
    return;
  }

  let total = 0;
  let itemsSummary = '';
  cart.forEach(item => {
    total += item.price * item.qty;
    itemsSummary += (itemsSummary ? ', ' : '') + `${item.name} x${item.qty}`;
  });

  const submitBtn = document.querySelector('#checkout-form button');
  submitBtn.textContent = '⏳ Mengirim...';
  submitBtn.disabled = true;

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama,
        alamat,
        hp,
        items: itemsSummary,
        total: `Rp ${total.toLocaleString('id-ID')}`
      })
    });

    alert('✅ Pesanan berhasil dikirim!');
    cart = [];
    updateFab();
    closeCart();
  } catch (err) {
    alert('❌ Gagal mengirim pesanan. Coba lagi.');
    console.error(err);
  } finally {
    submitBtn.textContent = '📤 Kirim Pesanan';
    submitBtn.disabled = false;
  }
}
