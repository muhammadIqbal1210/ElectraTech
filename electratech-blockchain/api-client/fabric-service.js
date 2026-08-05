const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'batchContract';

// Setup paths (disesuaikan dengan lokasi sertifikat dari Test Network)
const cryptoPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'org1.example.com');
const keyDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
const peerEndpoint = 'localhost:7051';
const peerHostAlias = 'peer0.org1.example.com';

class FabricService {
    constructor() {
        this.gateway = null;
        this.client = null;
        this.network = null;
        this.contract = null;
    }

    async init() {
        // Inisialisasi gRPC connection ke Peer
        this.client = await this.newGrpcConnection();
        
        this.gateway = connect({
            client: this.client,
            identity: await this.newIdentity(),
            signer: await this.newSigner(),
            // Pengaturan default untuk menolak transaksi yang gagal validasi komitmen
            evaluateOptions: () => {
                return { deadline: Date.now() + 5000 };
            },
            endorseOptions: () => {
                return { deadline: Date.now() + 15000 };
            },
            submitOptions: () => {
                return { deadline: Date.now() + 5000 };
            },
            commitStatusOptions: () => {
                return { deadline: Date.now() + 60000 };
            },
        });

        this.network = this.gateway.getNetwork(channelName);
        this.contract = this.network.getContract(chaincodeName);
        console.log('Fabric Gateway connected successfully.');
    }

    async createBatch(batchId, seedType, producerId) {
        try {
            console.log('\n--> Submit Transaction: CreateBatch');
            const timestamp = new Date().toISOString();
            await this.contract.submitTransaction(
                'CreateBatch',
                batchId,
                seedType,
                producerId,
                timestamp
            );
            console.log('*** Result: committed successfully');
            return true;
        } catch (error) {
            console.error(`*** Error submitting transaction: ${error}`);
            throw error;
        }
    }

    async updateTracking(batchId, status, location, courierId) {
        try {
            console.log('\n--> Submit Transaction: UpdateTracking');
            const timestamp = new Date().toISOString();
            await this.contract.submitTransaction(
                'UpdateTracking',
                batchId,
                status,
                location,
                courierId,
                timestamp
            );
            console.log('*** Result: committed successfully');
            return true;
        } catch (error) {
            console.error(`*** Error submitting transaction: ${error}`);
            throw error;
        }
    }

    async getBatchHistory(batchId) {
        try {
            console.log('\n--> Evaluate Transaction: GetBatchHistory');
            const resultBytes = await this.contract.evaluateTransaction('GetBatchHistory', batchId);
            const resultJson = Buffer.from(resultBytes).toString('utf8');
            console.log(`*** Result: ${resultJson}`);
            return JSON.parse(resultJson);
        } catch (error) {
            console.error(`*** Error evaluating transaction: ${error}`);
            throw error;
        }
    }

    async close() {
        if (this.gateway) {
            this.gateway.close();
        }
        if (this.client) {
            this.client.close();
        }
    }

    async newGrpcConnection() {
        // Karena ini contoh lokal test network, kita mengabaikan TLS di lingkungan nyata kita harus memverifikasi
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
        });
    }

    async newIdentity() {
        const credentials = await fs.readFile(certPath);
        return { mspId: 'Org1MSP', credentials };
    }

    async newSigner() {
        const files = await fs.readdir(keyDirectoryPath);
        const keyPath = path.resolve(keyDirectoryPath, files[0]);
        const privateKeyPem = await fs.readFile(keyPath);
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        return signers.newPrivateKeySigner(privateKey);
    }
}

module.exports = new FabricService();
