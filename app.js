// CONFIG ITEM PAKAIAN (SESUAI HEADER TABEL GOOGLE SHEET)
const itemFields = [
  { id: 'gamis_putih', label: 'Gamis Putih' },
  { id: 'gamis_abu', label: 'Gamis Abu' },
  { id: 'gamis_hitam', label: 'Gamis Hitam' },
  { id: 'gamis_berwarna', label: 'Gamis Berwarna' },
  { id: 'kemeja', label: 'Kemeja' },
  { id: 'celana_panjang', label: 'Celana Panjang' },
  { id: 'celana_training', label: 'Celana Training' },
  { id: 'kaos_lengan_panjang', label: 'Kaos Lgn Panjang' },
  { id: 'kaos_lengan_pendek', label: 'Kaos Lgn Pendek' },
  { id: 'selimut', label: 'Selimut' },
  { id: 'sprei_kasur', label: 'Sprei Kasur' },
  { id: 'jaket', label: 'Jaket' },
  { id: 'handuk', label: 'Handuk' },
  { id: 'celana_dalam', label: 'Celana Dalam' },
  { id: 'kaos_kaki', label: 'Kaos Kaki' },
  { id: 'peci', label: 'Peci' },
  { id: 'kaos_dalam', label: 'Kaos Dalam' },
  { id: 'sarung_batik', label: 'Sarung / Batik' }
];

let supabaseClient = null;
let localLogs = [];

// DOM READY
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('inputTanggal').valueAsDate = new Date();
  renderItemInputs();
  initSupabase();
  loadSantriOptions();
  fetchDataFromSupabase();
  lucide.createIcons();
});

// GENERATE GRID ITEM UTAMA
function renderItemInputs() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = itemFields.map(item => `
    <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
      <label class="text-xs font-semibold text-slate-700 select-none pr-1">${item.label}</label>
      <div class="flex items-center space-x-1 shrink-0">
        <button type="button" onclick="adjustValue('item_${item.id}', -1)" class="stepper-btn w-7 h-7 bg-white active:bg-slate-200 text-slate-700 rounded-md font-bold flex items-center justify-center border text-base shadow-sm">-</button>
        <input type="number" min="0" id="item_${item.id}" value="0" class="w-10 text-center py-1 font-bold text-slate-800 text-sm bg-transparent outline-none">
        <button type="button" onclick="adjustValue('item_${item.id}', 1)" class="stepper-btn w-7 h-7 bg-white active:bg-slate-200 text-slate-700 rounded-md font-bold flex items-center justify-center border text-base shadow-sm">+</button>
      </div>
    </div>
  `).join('');
}

// LOGIKA STEPPER (+/-)
function adjustValue(elementId, delta, isFloat = false) {
  const el = document.getElementById(elementId);
  let val = isFloat ? parseFloat(el.value || 0) : parseInt(el.value || 0);
  val = isNaN(val) ? 0 : val + delta;
  if (val < 0) val = 0;
  el.value = isFloat ? val.toFixed(1) : val;
  if (elementId === 'inputBeratWajib' || elementId === 'inputBeratTambahan') calcTotalBerat();
}

function calcTotalBerat() {
  const bw = parseFloat(document.getElementById('inputBeratWajib').value) || 0;
  const bt = parseFloat(document.getElementById('inputBeratTambahan').value) || 0;
  document.getElementById('lblTotalBerat').innerText = (bw + bt).toFixed(1);
}

// INISIALISASI SUPABASE
function initSupabase() {
  // Masukkan URL dan Key default Supabase milik Anda di sini agar otomatis terkoneksi:
  const defaultUrl = "https://ijipnnhgbzwatdzbdlek.supabase.co/rest/v1/"; 
  const defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";

  const savedUrl = localStorage.getItem('laundry_supabase_url') || defaultUrl;
  const savedKey = localStorage.getItem('laundry_supabase_key') || defaultKey;

  if (savedUrl && savedKey) {
    try {
      supabaseClient = supabase.createClient(savedUrl, savedKey);
      document.getElementById('supabaseUrlInput').value = savedUrl;
      document.getElementById('supabaseKeyInput').value = savedKey;
      document.getElementById('dbStatusBadge').className = "flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30";
      document.getElementById('dbStatusBadge').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span><span>Supabase Terhubung</span>`;
    } catch (e) {
      console.error("Inisialisasi Supabase Gagal", e);
    }
  }
}

function toggleConfigModal() {
  document.getElementById('configModal').classList.toggle('hidden');
}

function saveSupabaseConfig() {
  const url = document.getElementById('supabaseUrlInput').value.trim();
  const key = document.getElementById('supabaseKeyInput').value.trim();
  if (!url || !key) return alert("Silakan isi URL dan Key Supabase!");

  localStorage.setItem('laundry_supabase_url', url);
  localStorage.setItem('laundry_supabase_key', key);
  initSupabase();
  toggleConfigModal();
  loadSantriOptions();
  fetchDataFromSupabase();
}

// LOAD LIST SANTRI DARI TABEL 'santri' SUPABASE
async function loadSantriOptions() {
  const kamar = document.getElementById('inputKamar').value;
  const select = document.getElementById('inputNamaSelect');
  const customInput = document.getElementById('inputNamaCustom');

  select.innerHTML = '<option value="">-- Memuat Santri... --</option>';

  if (kamar === 'Lainnya') {
    select.classList.add('hidden');
    customInput.classList.remove('hidden');
    return;
  } else {
    select.classList.remove('hidden');
    customInput.classList.add('hidden');
  }

  let namesList = [];
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('santri')
        .select('nama')
        .eq('kamar', kamar)
        .order('nama', { ascending: true });

      if (!error && data) {
        namesList = data.map(item => item.nama);
      }
    } catch (err) {
      console.error("Fetch santri dari Supabase gagal", err);
    }
  }

  select.innerHTML = '<option value="">-- Pilih Nama Santri --</option>';
  if (namesList.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.textContent = "(Tidak ada santri di DB / Setting Supabase Belum Diisi)";
    select.appendChild(opt);
  } else {
    namesList.forEach(nama => {
      const opt = document.createElement('option');
      opt.value = nama;
      opt.textContent = nama;
      select.appendChild(opt);
    });
  }

  const optCustom = document.createElement('option');
  optCustom.value = "__CUSTOM__";
  optCustom.textContent = "+ Input Nama Lain...";
  select.appendChild(optCustom);

  document.getElementById('statTotalSantri').innerText = namesList.length;
}

function handleNamaSelectChange() {
  const select = document.getElementById('inputNamaSelect');
  const customInput = document.getElementById('inputNamaCustom');
  if (select.value === '__CUSTOM__') {
    customInput.classList.remove('hidden');
    customInput.focus();
  } else {
    customInput.classList.add('hidden');
  }
}

// SIMPAN FORM KE TABEL 'laundry_logs'
async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  const kamar = document.getElementById('inputKamar').value;
  const selectNama = document.getElementById('inputNamaSelect').value;
  const customNama = document.getElementById('inputNamaCustom').value.trim();
  let namaFinal = selectNama === '__CUSTOM__' || kamar === 'Lainnya' ? customNama : selectNama;

  if (!namaFinal) {
    alert("Pilih atau ketik nama santri terlebih dahulu!");
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Simpan Data Laundry`;
    lucide.createIcons();
    return;
  }

  const bw = parseFloat(document.getElementById('inputBeratWajib').value) || 0;
  const bt = parseFloat(document.getElementById('inputBeratTambahan').value) || 0;

  const record = {
    tanggal: document.getElementById('inputTanggal').value,
    kamar: kamar,
    kategori: document.getElementById('inputKategori').value,
    nama: namaFinal,
    berat_wajib: bw,
    berat_tambahan: bt,
    total_berat: bw + bt,
    rincian_cuci: document.getElementById('inputRincianCuci').value,
    total_biaya: parseFloat(document.getElementById('inputTotalBiaya').value) || 0,
    catatan: document.getElementById('inputCatatan').value
  };

  itemFields.forEach(item => {
    record[item.id] = parseInt(document.getElementById(`item_${item.id}`).value) || 0;
  });

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('laundry_logs').insert([record]);
      if (error) throw error;
      alert("Berhasil disimpan ke tabel laundry_logs Supabase!");
    } catch (err) {
      alert("Gagal konek Supabase. Disimpan ke Lokal: " + err.message);
      saveToLocalStorage(record);
    }
  } else {
    saveToLocalStorage(record);
    alert("Disimpan ke lokal browser!");
  }

  resetForm();
  fetchDataFromSupabase();
  btn.disabled = false;
  btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Simpan Data Laundry`;
  lucide.createIcons();
}

function saveToLocalStorage(record) {
  record.id = "local_" + Date.now();
  let logs = JSON.parse(localStorage.getItem('local_laundry_logs') || '[]');
  logs.unshift(record);
  localStorage.setItem('local_laundry_logs', JSON.stringify(logs));
}

// FETCH RIWAYAT LAUNDRY DARI SUPABASE
async function fetchDataFromSupabase() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('laundry_logs').select('*').order('tanggal', { ascending: false });
      if (!error && data) localLogs = data;
    } catch (e) {
      localLogs = JSON.parse(localStorage.getItem('local_laundry_logs') || '[]');
    }
  } else {
    localLogs = JSON.parse(localStorage.getItem('local_laundry_logs') || '[]');
  }
  renderTable();
}

// RENDER TABEL & STATISTIK
function renderTable() {
  const tbody = document.getElementById('laundryTableBody');
  const keyword = document.getElementById('searchKeyword').value.toLowerCase();
  const filterKamar = document.getElementById('filterKamar').value;
  const filterTanggal = document.getElementById('filterTanggal').value;

  let filtered = localLogs.filter(row => {
    const matchName = row.nama ? row.nama.toLowerCase().includes(keyword) : false;
    const matchKamar = filterKamar ? row.kamar === filterKamar : true;
    const matchTanggal = filterTanggal ? row.tanggal === filterTanggal : true;
    return matchName && matchKamar && matchTanggal;
  });

  let grandTotalBerat = 0;
  let grandTotalPakaian = 0;

  tbody.innerHTML = filtered.map((row, idx) => {
    grandTotalBerat += parseFloat(row.total_berat || 0);

    let itemsSummary = [];
    let rowPakaianCount = 0;
    itemFields.forEach(item => {
      const qty = row[item.id] || 0;
      if (qty > 0) {
        itemsSummary.push(`${item.label}: <b>${qty}</b>`);
        rowPakaianCount += qty;
      }
    });

    grandTotalPakaian += rowPakaianCount;

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-3 text-center font-bold text-slate-400">${idx + 1}</td>
        <td class="p-3 whitespace-nowrap font-medium text-slate-700">${row.tanggal || '-'}</td>
        <td class="p-3 whitespace-nowrap font-semibold text-indigo-700">${row.kamar || '-'}</td>
        <td class="p-3 font-bold text-slate-800">${row.nama || '-'}</td>
        <td class="p-3 text-center font-black text-amber-700 bg-amber-50/40">${row.total_berat || 0} Kg</td>
        <td class="p-3 text-center font-bold text-emerald-600">${rowPakaianCount} pcs</td>
        <td class="p-3 text-xs leading-relaxed text-slate-600 min-w-[220px]">
          ${itemsSummary.length > 0 ? itemsSummary.join(', ') : '<span class="text-slate-300 italic">Tidak ada item</span>'}
        </td>
        <td class="p-3 whitespace-nowrap font-medium text-slate-700">Rp ${Number(row.total_biaya || 0).toLocaleString('id-ID')}</td>
        <td class="p-3 text-slate-500 italic max-w-[150px] truncate">${row.catatan || '-'}</td>
        <td class="p-3 text-center">
          <button onclick="deleteRecord('${row.id}')" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition" title="Hapus">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('statTotalRows').innerText = filtered.length;
  document.getElementById('statTotalBerat').innerHTML = `${grandTotalBerat.toFixed(1)} <span class="text-xs font-normal">kg</span>`;
  document.getElementById('statTotalPakaian').innerHTML = `${grandTotalPakaian} <span class="text-xs font-normal">pcs</span>`;
  lucide.createIcons();
}

async function deleteRecord(id) {
  if (!confirm("Hapus data laundry ini?")) return;
  if (supabaseClient && !id.startsWith('local_')) {
    await supabaseClient.from('laundry_logs').delete().eq('id', id);
  } else {
    let logs = JSON.parse(localStorage.getItem('local_laundry_logs') || '[]');
    logs = logs.filter(item => item.id !== id);
    localStorage.setItem('local_laundry_logs', JSON.stringify(logs));
  }
  fetchDataFromSupabase();
}

function resetForm() {
  document.getElementById('laundryForm').reset();
  document.getElementById('inputTanggal').valueAsDate = new Date();
  document.getElementById('lblTotalBerat').innerText = '0.0';
  loadSantriOptions();
}

function switchTab(tab) {
  if (tab === 'form') {
    document.getElementById('tabForm').classList.remove('hidden');
    document.getElementById('tabData').classList.add('hidden');
    document.getElementById('tabFormBtn').className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow-sm flex items-center gap-1.5";
    document.getElementById('tabDataBtn').className = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-600 hover:bg-slate-200/60 flex items-center gap-1.5";
  } else {
    document.getElementById('tabForm').classList.add('hidden');
    document.getElementById('tabData').classList.remove('hidden');
    document.getElementById('tabDataBtn').className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-indigo-600 text-white shadow-sm flex items-center gap-1.5";
    document.getElementById('tabFormBtn').className = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-600 hover:bg-slate-200/60 flex items-center gap-1.5";
  }
}

function exportToCSV() {
  if (localLogs.length === 0) return alert("Belum ada data!");
  const headers = ["Tanggal", "Kamar", "Kategori", "Nama Santri", "Berat Wajib", "Berat Tambahan", "Total Berat", "Rincian Cuci", "Total Biaya", "Catatan"];
  const rows = localLogs.map(r => [r.tanggal, r.kamar, r.kategori, `"${r.nama}"`, r.berat_wajib, r.berat_tambahan, r.total_berat, `"${r.rincian_cuci}"`, r.total_biaya, `"${r.catatan}"`]);
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `Laundry_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
