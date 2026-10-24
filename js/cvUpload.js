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

// js/cvUpload.js

async function handleStartAnalysis() {
    const fileInput = document.getElementById('cv-upload');
    const file = fileInput.files[0];
    const posisiPekerjaan = document.getElementById('posisi-pekerjaan').value;
    const submitBtn = event.target; // Mengambil elemen tombol yang diklik

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

    try {
        // Ubah teks tombol jadi indikator loading agar user tahu sistem sedang bekerja
        submitBtn.disabled = true;
        submitBtn.textContent = "Sedang Mengunggah & Menganalisis...";

        // Proses Upload ke Supabase
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('cv-bucket')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient.storage
            .from('cv-bucket')
            .getPublicUrl(filePath);

        console.log("File berhasil diunggah:", publicUrlData.publicUrl);
        
        // Notifikasi Berhasil sebelum pindah halaman
        alert("CV Berhasil Diunggah! Memulai analisis...");

        // Pindah ke halaman hasil analisis
        window.location.href = "CV_Analysis_Results.html";

    } catch (error) {
        console.error("Gagal mengunggah file:", error.message);
        alert("Gagal mengunggah file ke server: " + error.message);
        
        // Kembalikan tombol ke semula jika gagal
        submitBtn.disabled = false;
        submitBtn.textContent = "Mulai Analisis CV";
    }
}