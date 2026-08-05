'use strict';

const { Contract } = require('fabric-contract-api');

class BatchContract extends Contract {

    // Inisialisasi awal (jika diperlukan)
    async InitLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('Ledger telah diinisialisasi');
        console.info('============= END : Initialize Ledger ===========');
    }

    // Penakar Benih membuat Batch Baru
    async CreateBatch(ctx, batchId, seedType, producerId, timestamp) {
        console.info('============= START : Create Batch ===========');
        
        // Cek apakah batch sudah ada
        const exists = await this.BatchExists(ctx, batchId);
        if (exists) {
            throw new Error(`Batch dengan ID ${batchId} sudah ada`);
        }

        const batch = {
            id: batchId,
            seedType: seedType,
            producerId: producerId,
            status: 'SEMAI', // Status awal
            location: 'Fasilitas Penakaran',
            createdAt: timestamp,
            updatedAt: timestamp,
            history: [{
                action: 'CREATE_BATCH',
                actor: producerId,
                timestamp: timestamp,
                status: 'SEMAI',
                location: 'Fasilitas Penakaran'
            }]
        };

        // Simpan ke state database (ledger)
        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        console.info('============= END : Create Batch ===========');
        return JSON.stringify(batch);
    }

    // Kurir memperbarui status pengiriman
    async UpdateTracking(ctx, batchId, status, location, courierId, timestamp) {
        console.info('============= START : Update Tracking ===========');
        
        const exists = await this.BatchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`Batch dengan ID ${batchId} tidak ditemukan`);
        }

        // Ambil state saat ini
        const batchBytes = await ctx.stub.getState(batchId);
        const batch = JSON.parse(batchBytes.toString());

        // Update atribut batch
        batch.status = status;
        batch.location = location;
        batch.updatedAt = timestamp;

        // Tambahkan ke riwayat pelacakan internal obyek
        batch.history.push({
            action: 'UPDATE_TRACKING',
            actor: courierId,
            timestamp: timestamp,
            status: status,
            location: location
        });

        // Simpan kembali ke ledger
        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        console.info('============= END : Update Tracking ===========');
        return JSON.stringify(batch);
    }

    // Mengambil data Batch saat ini
    async ReadBatch(ctx, batchId) {
        const exists = await this.BatchExists(ctx, batchId);
        if (!exists) {
            throw new Error(`Batch dengan ID ${batchId} tidak ditemukan`);
        }
        const batchBytes = await ctx.stub.getState(batchId);
        return batchBytes.toString();
    }

    // Mengambil provenance (sejarah) blok transaksi asli dari suatu Batch (Audit Trail)
    async GetBatchHistory(ctx, batchId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(batchId);
        let results = [];
        let res = await resultsIterator.next();
        
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                
                jsonRes.TxId = res.value.txId;
                jsonRes.Timestamp = res.value.timestamp;
                jsonRes.IsDelete = res.value.isDelete;
                
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                results.push(jsonRes);
            }
            res = await resultsIterator.next();
        }
        await resultsIterator.close();
        return JSON.stringify(results);
    }

    // Helper untuk mengecek apakah ID sudah ada di ledger
    async BatchExists(ctx, batchId) {
        const batchBytes = await ctx.stub.getState(batchId);
        return batchBytes && batchBytes.length > 0;
    }
}

module.exports = BatchContract;
