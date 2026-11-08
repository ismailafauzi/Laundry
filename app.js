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
    <div class="bg-[#FBF9F4] p-2.5 rounded-xl border border-[#E8E2CE] flex items-center justify-between">
      <label class="text-xs font-semibold text-[#0B3C2D] select-none pr-1">${item.label}</label>
      <div class="flex items-center space-x-1 shrink-0">
        <button type="button" onclick="adjustValue('item_${item.id}', -1)" class="w-7 h-7 bg-white active:bg-slate-200 text-[#0B3C2D] rounded-md font-bold flex items-center justify-center border border-[#E8E2CE] text-base shadow-sm">-</button>
        <input type="number" min="0" id="item_${item.id}" value="0" class="w-9 text-center py-0.5 font-bold text-[#0B3C2D] text-xs bg-transparent outline-none">
        <button type="button" onclick="adjustValue('item_${item.id}', 1)" class="w-7 h-7 bg-white active:bg-slate-200 text-[#0B3C2D] rounded-md font-bold flex items-center justify-center border border-[#E8E2CE] text-base shadow-sm">+</button>
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

// SANITASI & INISIALISASI SUPABASE (BERSIH DARI /rest/v1/)
function initSupabase() {
  let defaultUrl = "https://ijipnnhgbzwatdzbdlek.supabase.co";
  let defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXBubmhnYnp3YXRkemJkbGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjc3NDIsImV4cCI6MjEwMzkwMzc0Mn0.TviHZ5O25ZSif9DawhcywKD9c3d4bv3yGnLPGk6iMAU";

  let savedUrl = localStorage.getItem('laundry_supabase_url') || defaultUrl;
  let savedKey = localStorage.getItem('laundry_supabase_key') || defaultKey;

  // Bersihkan URL jika mengandung /rest/v1/
  if (savedUrl.includes('/rest/v1')) {
    savedUrl = savedUrl.replace(/\/rest\/v1\/?$/, '').trim();
    localStorage.setItem('laundry_supabase_url', savedUrl);
  }

  if (savedUrl && savedKey) {
    try {
      supabaseClient = supabase.createClient(savedUrl, savedKey);
      document.getElementById('supabaseUrlInput').value = savedUrl;
      document.getElementById('supabaseKeyInput').value = savedKey;
      document.getElementById('dbStatusBadge').className = "flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#0B3C2D] border border-emerald-300";
      document.getElementById('dbStatusBadge').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600 mr-2 animate-pulse"></span><span>Supabase Terhubung</span>`;
    } catch (e) {
      console.error("Inisialisasi Supabase Gagal", e);
    }
  }
}

function toggleConfigModal() {
  document.getElementById('configModal').classList.toggle('hidden');
}

function saveSupabaseConfig() {
  let url = document.getElementById('supabaseUrlInput').value.trim();
  const key = document.getElementById('supabaseKeyInput').value.trim();

  if (url.includes('/rest/v1')) {
    url = url.replace(/\/rest\/v1\/?$/, '').trim();
  }

  if (!url || !key) return alert("Silakan isi URL dan Key Supabase!");

  localStorage.setItem('laundry_supabase_url', url);
  localStorage.setItem('laundry_supabase_key', key);
  initSupabase();
  toggleConfigModal();
  loadSantriOptions();
  fetchDataFromSupabase();
}

// LOAD SANTRI DARI TABEL 'santri' SUPABASE
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
      console.error("Fetch santri gagal", err);
    }
  }

  select.innerHTML = '<option value="">-- Pilih Nama Santri --</option>';
  if (namesList.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.textContent = "(Tabel 'santri' kosong / Belum dibuat di Supabase)";
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
    btn.innerHTML = `<i data-lucide="save" class="w-4 h-4 text-[#D4AF37]"></i> Simpan Data Laundry`;
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
      alert("Alhamdulillah! Data laundry berhasil disimpan ke Supabase.");
    } catch (err) {
      alert("Gagal konek Supabase. Data disimpan ke Lokal browser: " + err.message);
      saveToLocalStorage(record);
    }
  } else {
    saveToLocalStorage(record);
    alert("Data berhasil disimpan di penyimpanan lokal browser!");
  }

  resetForm();
  fetchDataFromSupabase();
  btn.disabled = false;
  btn.innerHTML = `<i data-lucide="save" class="w-4 h-4 text-[#D4AF37]"></i> Simpan Data Laundry`;
  lucide.createIcons();
}

function saveToLocalStorage(record) {
  record.id = "local_" + Date.now();
  let logs = JSON.parse(localStorage.getItem('local_laundry_logs') || '[]');
  logs.unshift(record);
  localStorage.setItem('local_laundry_logs', JSON.stringify(logs));
}

// FETCH TRANSAKSI LAUNDRY
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

// FILTER RENTANG TANGGAL
function getFilteredData() {
  const keyword = document.getElementById('searchKeyword').value.toLowerCase();
  const filterKamar = document.getElementById('filterKamar').value;
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  return localLogs.filter(row => {
    const matchName = row.nama ? row.nama.toLowerCase().includes(keyword) : false;
    const matchKamar = filterKamar ? row.kamar === filterKamar : true;
    
    let matchDate = true;
    if (startDate && row.tanggal < startDate) matchDate = false;
    if (endDate && row.tanggal > endDate) matchDate = false;

    return matchName && matchKamar && matchDate;
  });
}

// RENDER TABEL RIWAYAT
function renderTable() {
  const tbody = document.getElementById('laundryTableBody');
  let filtered = getFilteredData();

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
      <tr class="hover:bg-[#FBF9F4] border-b border-[#E8E2CE]">
        <td class="p-3 text-center font-bold text-slate-400">${idx + 1}</td>
        <td class="p-3 whitespace-nowrap font-medium text-slate-700">${row.tanggal || '-'}</td>
        <td class="p-3 whitespace-nowrap font-bold text-[#0B3C2D]">${row.kamar || '-'}</td>
        <td class="p-3 font-bold text-slate-800">${row.nama || '-'}</td>
        <td class="p-3 text-center font-extrabold text-[#D4AF37] bg-[#F7F5EE]">${row.total_berat || 0} Kg</td>
        <td class="p-3 text-center font-bold text-emerald-700">${rowPakaianCount} pcs</td>
        <td class="p-3 text-xs leading-relaxed text-slate-600 min-w-[200px]">
          ${itemsSummary.length > 0 ? itemsSummary.join(', ') : '<span class="text-slate-300 italic">Tanpa item</span>'}
        </td>
        <td class="p-3 whitespace-nowrap font-semibold text-slate-700">Rp ${Number(row.total_biaya || 0).toLocaleString('id-ID')}</td>
        <td class="p-3 text-slate-500 italic max-w-[140px] truncate">${row.catatan || '-'}</td>
        <td class="p-3 text-center">
          <button onclick="deleteRecord('${row.id}')" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition" title="Hapus">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('statTotalRows').innerText = filtered.length;
  document.getElementById('statTotalBerat').innerHTML = `${grandTotalBerat.toFixed(1)} <span class="text-xs font-normal text-slate-500">kg</span>`;
  document.getElementById('statTotalPakaian').innerHTML = `${grandTotalPakaian} <span class="text-xs font-normal text-slate-500">pcs</span>`;
  lucide.createIcons();
}

async function deleteRecord(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus catatan laundry ini?")) return;
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
    document.getElementById('tabFormBtn').className = "flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition bg-[#0B3C2D] text-white shadow-sm flex items-center justify-center gap-2";
    document.getElementById('tabDataBtn').className = "flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition text-slate-600 hover:bg-white flex items-center justify-center gap-2";
  } else {
    document.getElementById('tabForm').classList.add('hidden');
    document.getElementById('tabData').classList.remove('hidden');
    document.getElementById('tabDataBtn').className = "flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition bg-[#0B3C2D] text-white shadow-sm flex items-center justify-center gap-2";
    document.getElementById('tabFormBtn').className = "flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition text-slate-600 hover:bg-white flex items-center justify-center gap-2";
  }
}

// EKSPOR CSV FILTERED (BERDASARKAN RENTANG TANGGAL)
function exportToCSV() {
  let exportData = getFilteredData();
  if (exportData.length === 0) return alert("Tidak ada data dalam rentang tanggal filter tersebut untuk diekspor!");

  const headers = [
    "Tanggal", "Kamar", "Kategori", "Nama Santri", "Berat Wajib (Kg)", "Berat Tambahan (Kg)", "Total Berat (Kg)",
    "Gamis Putih", "Gamis Abu", "Gamis Hitam", "Gamis Berwarna", "Kemeja", "Celana Panjang", "Celana Training",
    "Kaos Lgn Panjang", "Kaos Lgn Pendek", "Selimut", "Sprei Kasur", "Jaket", "Handuk", "Celana Dalam",
    "Kaos Kaki", "Peci", "Kaos Dalam", "Sarung Batik", "Rincian Cuci", "Total Biaya", "Catatan"
  ];

  const rows = exportData.map(r => [
    r.tanggal || '', r.kamar || '', r.kategori || '', `"${r.nama || ''}"`,
    r.berat_wajib || 0, r.berat_tambahan || 0, r.total_berat || 0,
    r.gamis_putih || 0, r.gamis_abu || 0, r.gamis_hitam || 0, r.gamis_berwarna || 0,
    r.kemeja || 0, r.celana_panjang || 0, r.celana_training || 0, r.kaos_lengan_panjang || 0,
    r.kaos_lengan_pendek || 0, r.selimut || 0, r.sprei_kasur || 0, r.jaket || 0,
    r.handuk || 0, r.celana_dalam || 0, r.kaos_kaki || 0, r.peci || 0,
    r.kaos_dalam || 0, r.sarung_batik || 0, `"${r.rincian_cuci || ''}"`, r.total_biaya || 0, `"${r.catatan || ''}"`
  ]);

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Laporan_Laundry_AlBashiroh_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
