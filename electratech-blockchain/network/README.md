# Hyperledger Fabric Network Setup

Karena Anda menggunakan Windows, sangat disarankan menggunakan **WSL2 (Windows Subsystem for Linux)** yang terintegrasi dengan Docker Desktop untuk menjalankan *node* Hyperledger Fabric.

## Prasyarat
1. Docker Desktop & Docker Compose (Pastikan berjalan)
2. Git Bash atau WSL2 (Ubuntu)
3. Node.js (v18+)

## Langkah Instalasi Test Network (Fabric Samples)

Buka terminal (WSL2/Git Bash) di dalam direktori `electratech-blockchain/network` ini, lalu ikuti langkah berikut:

### 1. Unduh Binari & Docker Image Fabric
Jalankan perintah ini untuk mengunduh `fabric-samples`, binari Fabric, dan menarik *docker images* yang dibutuhkan (versi 2.5.x):
```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
./install-fabric.sh docker samples binary
```

### 2. Mulai Jaringan Test Network
Masuk ke direktori `test-network` yang baru saja diunduh, lalu jalankan skrip untuk membuat *channel*:
```bash
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca
```
*Catatan: `-ca` digunakan agar jaringan memakai Certificate Authority yang dibutuhkan oleh SDK Node.js kita.*

### 3. Deploy Chaincode (Smart Contract)
Kita akan mendownload dependensi chaincode kita dan men-deploy ke jaringan:
```bash
# Kembali ke root electratech-blockchain
cd ../../../chaincode
npm install

# Kembali ke test-network
cd ../network/fabric-samples/test-network

# Deploy chaincode
./network.sh deployCC -ccn batchContract -ccp ../../../chaincode/ -ccl javascript
```

Setelah ini selesai, jaringan blockchain sudah berjalan dan siap menerima transaksi dari backend (melalui `api-client/fabric-service.js`).
