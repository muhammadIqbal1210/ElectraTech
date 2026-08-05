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

---

## 3. Aturan Mutlak Pengembangan Frontend (Next.js)

Semua kontributor (termasuk AI Asisten) **WAJIB** mematuhi standar arsitektur berikut:
1.  **Routing:** Menggunakan **Next.js App Router** berbasis folder.
2.  **Route Groups:** Menggunakan folder bertanda kurung `(landingpage)` untuk halaman publik dan `(dashboard)` untuk halaman sistem internal.
3.  **Penaman File Halaman:** Semua file yang menjadi rute URL di browser **HARUS bernama `page.tsx`** (tidak boleh `dashboard.tsx` atau `create.tsx`).
4.  **Komponen UI:** Pecahan kode yang bisa dipakai berulang kali disimpan di folder `src/components/` (seperti `Navbar.tsx` dan `Sidebar.tsx`).
5.  **Desain Visual:** Tema gelap (*Dark Mode*) modern yang bersih menggunakan Tailwind CSS (Warna utama: `bg-slate-950` dengan aksen `emerald`, `purple`, dan `blue`).

---

## 4. Peta Jalan Pengembangan (Development Roadmap)

### ⏳ Fase 1: Fondasi Frontend & Integrasi UI (Sedang Berjalan)
*   [x] Setup Next.js 16+ dengan Turbopack dan Path Alias `@/*`
*   [x] Pembuatan Landing Page Utama di `src/app/(landingpage)/page.tsx`
*   [x] Perbaikan bug alias path `./srccomponents` dan instalasi `lucide-react`
*   [ ] Pembuatan Struktur Folder Multi-Aktor lengkap (`produsen`, `kurir`, `agen`)
*   [ ] Pembuatan Halaman Login Multi-Role di `src/app/login/page.tsx`
*   [ ] Slicing UI Dashboard Penakar Benih (Tabel Batch & Switcher IoT)
*   [ ] Slicing UI Dashboard Kurir (Form Check-in Perjalanan Paket)
*   [ ] Slicing UI Workspace AI Agent Chat Console

### ⚙️ Fase 2: Backend API Core & PostgreSQL
*   [ ] Perancangan Skema Database PostgreSQL (Tabel `users`, `batches`, `iot_logs`, `package_tracking`)
*   [ ] Pembuatan Modul Autentikasi Backend berbasis JWT dan Middleware Auth (RBAC)
*   [ ] Pembuatan API Endpoint untuk Log Batch Pemeliharaan Penakar Benih
*   [ ] Pembuatan API Endpoint untuk Update Perjalanan Paket oleh Kurir
*   [ ] Integrasi Frontend-Backend lewat fetch data (Mengubah komponen `use client` menjadi data dinamis asli)

### 🤖 Fase 3: Otomatisasi IoT & AI Agent
*   [ ] Integrasi server `2-electratech-iot` (MQTT/Websocket) untuk menangkap data sensor riil
*   [ ] Penghubungan tombol saklar di frontend untuk menembak relai/aktuator fisik IoT
*   [ ] Pembuatan modul `ai-agent` di backend yang terintegrasi dengan Gemini API / OpenAI API
*   [ ] Pengujian deteksi anomali otomatis oleh AI berdasarkan log database terbaru

### ⛓️ Fase 4: Integrasi Blockchain & Pengujian Akhir
*   [ ] Setup jaringan permissioned blockchain menggunakan Hyperledger Fabric (`1-electratech-blockchain`)
*   [ ] Penulisan Smart Contract (Chaincode) untuk fungsi `createBatch` dan `updateTracking`
*   [ ] Migrasi skema tabel simulasi database ke fungsi ledger asli lewat Fabric SDK
*   [ ] Pengujian menyeluruh (End-to-End Test) dari fase semai bibit hingga scan QR Code publik konsumen

---

## 5. Log Perubahan & Sinkronisasi Konteks (Context Ledger)
*   **27 Mei 2026:** Pembersihan bug path alias di `tsconfig.json`. Landing page sukses menyala dengan status `GET / 200`.
*   **28 Mei 2026:** Restrukturisasi besar arsitektur rute frontend. Mengubah sistem dari folder `dashboard` biasa menjadi *Route Groups* Next.js, menyederhanakan aktor menjadi Penakar Benih & Kurir, serta merancang fungsionalitas AI Agent Workspace.