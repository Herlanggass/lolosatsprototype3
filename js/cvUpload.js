// js/cvUpload.js

async function uploadAndScanCV(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files[0];

    if (!file) {
        alert("Silakan pilih file CV terlebih dahulu!");
        return;
    }

    // Validasi Format (.pdf / .docx)
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        alert("Format file tidak valid! Harap unggah file berformat .pdf atau .docx");
        fileInput.value = "";
        return;
    }

    // Validasi Ukuran (Maksimal 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("Ukuran file terlalu besar! Maksimal 5 MB.");
        fileInput.value = "";
        return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('cv-bucket')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient.storage
            .from('cv-bucket')
            .getPublicUrl(filePath);

        console.log("File berhasil diunggah:", publicUrlData.publicUrl);
        alert("CV berhasil diunggah ke Supabase Storage!");

    } catch (error) {
        console.error("Gagal mengunggah file:", error.message);
        alert("Terjadi kesalahan saat mengunggah file.");
    }
}

// ===== Loading state: jembatan antara halaman upload dan halaman hasil =====
const HASIL_URL = "CV_Analysis_Results.html";
const MIN_LOADING_MS = 3000;    // loading tampil minimal segini supaya tidak berkedip
const REDIRECT_DELAY_MS = 500;  // jeda singkat di 100% sebelum pindah halaman

const LANGKAH_LOADING = [
    { batas: 30,  teks: "Mengunggah CV-mu..." },
    { batas: 60,  teks: "Membaca struktur dokumen..." },
    { batas: 90,  teks: "Mencocokkan kata kunci dengan posisi target..." },
    { batas: 100, teks: "Menyusun hasil analisis..." }
];

let loadingTimer = null;

function jeda(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function setProgress(persen) {
    const nilai = Math.round(persen);
    const langkah = LANGKAH_LOADING.find((l) => nilai <= l.batas) || LANGKAH_LOADING[LANGKAH_LOADING.length - 1];
    const teksLangkah = document.getElementById('loading-langkah');

    document.getElementById('loading-bar').style.width = nilai + '%';
    document.getElementById('loading-persen').textContent = nilai + '%';
    document.getElementById('loading-track').setAttribute('aria-valuenow', nilai);

    // Teks hanya diganti jika berubah, agar pembaca layar tidak membacakan ulang terus-menerus
    if (teksLangkah.textContent !== langkah.teks) {
        teksLangkah.textContent = langkah.teks;
    }
}

function tampilkanLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    overlay.focus();

    let progres = 0;
    setProgress(progres);

    // Progres berjalan melambat mendekati 90%. Sisanya diisi saat proses benar-benar selesai.
    clearInterval(loadingTimer);
    loadingTimer = setInterval(() => {
        progres += (90 - progres) * 0.09;
        setProgress(progres);
    }, 100);
}

function sembunyikanLoading() {
    clearInterval(loadingTimer);
    loadingTimer = null;
    document.getElementById('loading-overlay').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

async function selesaikanLoading(waktuMulai) {
    const sisa = MIN_LOADING_MS - (Date.now() - waktuMulai);
    if (sisa > 0) await jeda(sisa);

    clearInterval(loadingTimer);
    loadingTimer = null;
    setProgress(100);
    await jeda(REDIRECT_DELAY_MS);
}

function resetTombolAnalisis() {
    const tombol = document.getElementById('btn-mulai-analisis');
    tombol.disabled = false;
    tombol.textContent = "Mulai Analisis CV";
}

// Jika pengguna menekan tombol "back" dari halaman hasil, browser bisa memulihkan
// halaman ini dari cache (bfcache) dengan loading yang masih terbuka. Reset di sini.
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        sembunyikanLoading();
        resetTombolAnalisis();
    }
});

async function handleStartAnalysis() {
    const fileInput = document.getElementById('cv-upload');
    const file = fileInput.files[0];
    const posisiPekerjaan = document.getElementById('posisi-pekerjaan').value;
    const submitBtn = document.getElementById('btn-mulai-analisis');

    // 1. Validasi File
    if (!file) {
        alert("Silakan pilih atau unggah file CV terlebih dahulu!");
        return;
    }

    // 2. Validasi Posisi Pekerjaan
    if (!posisiPekerjaan.trim()) {
        alert("Harap isi posisi pekerjaan yang dituju terlebih dahulu!");
        return;
    }

    // 3. Validasi Format (.pdf / .docx)
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        alert("Format file tidak valid! Harap unggah file berformat .pdf atau .docx");
        return;
    }

    // 4. Validasi Ukuran (Maksimal 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("Ukuran file terlalu besar! Maksimal 5 MB.");
        return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;
    const waktuMulai = Date.now();

    try {
        // Cegah klik ganda, lalu tampilkan loading di atas halaman upload
        submitBtn.disabled = true;
        submitBtn.textContent = "Sedang Mengunggah & Menganalisis...";
        tampilkanLoading();

        // Proses Upload ke Supabase
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('cv-bucket')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient.storage
            .from('cv-bucket')
            .getPublicUrl(filePath);

        console.log("File berhasil diunggah:", publicUrlData.publicUrl);

        // Loading dituntaskan (100%) lalu pindah ke halaman hasil analisis
        await selesaikanLoading(waktuMulai);
        window.location.href = HASIL_URL;

    } catch (error) {
        console.error("Gagal mengunggah file:", error.message);

        // Tutup loading dan kembalikan tombol ke semula, baru tampilkan pesan error
        sembunyikanLoading();
        resetTombolAnalisis();
        alert("Gagal mengunggah file ke server: " + error.message);
    }
}
