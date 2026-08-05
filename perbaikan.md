# 🗺️ Project Planning: Electra Tech Ecosystem

Dokumen ini berisi peta jalan pengembangan (*development roadmap*), arsitektur sistem, dan manajemen tugas untuk menyukseskan proyek **Electra Tech**. 

---

## 1. Visi & Cakupan Proyek (Project Vision)
Electra Tech adalah platform manajemen rantai pasok (*supply chain*) dan otomatisasi perbenihan tanaman terintegrasi. Proyek ini memadukan pencatatan fase hulu, pemantauan & kontrol lingkungan berbasis **SmartLink IoT**, serta pengamanan data logistik anti-manipulasi berbasis **TraceChain Blockchain**.

---

## 2. Arsitektur Multi-Role & Fitur Utama

Sistem dikunci menggunakan *Role-Based Access Control* (RBAC) dengan 2 aktor internal utama dan 1 asisten cerdas:

### A. Penakar Benih (Produsen / Hulu)
*   **Modul Batch Pemeliharaan:** Pencatatan fase penanaman tumbuh bibit, tanggal semai, pemberian nutrisi, dan status kesehatan tanaman.
*   **Modul Pemantauan & Kontrol IoT:** Grafik real-time sensor lingkungan (Suhu, Kelembapan, Cahaya) dan tombol kendali jarak jauh (saklar pompa air/kipas).

### B. Kurir (Logistik / Hilir)
*   **Modul Pesanan & Logistik:** Antarmuka ramah seluler (*mobile-friendly*) untuk melakukan *check-in* status perjalanan paket bibit, nomor resi, koordinat, dan kondisi fisik muatan.


# Perbaikan Halaman Dashboard

Perbaiki halaman dashboard untuk masing masing user yang mana ketika sudah dipilih usernya di awal maka