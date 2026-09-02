require('dotenv').config();

const { ethers } = require('ethers');
const crypto = require('crypto');
const contractABI = require('../config/BatchTraceabilityABI.json');

const normalizeEnvValue = (value) => (typeof value === 'string' ? value.trim() : '');

const isBlockchainConfigured = () => {
  const rpcUrl = normalizeEnvValue(process.env.BLOCKCHAIN_RPC_URL);
  const privateKey = normalizeEnvValue(process.env.BLOCKCHAIN_PRIVATE_KEY);
  const contractAddress = normalizeEnvValue(process.env.SMART_CONTRACT_ADDRESS);

  return Boolean(rpcUrl && privateKey && contractAddress);
};

let cachedProvider = null;
let cachedWallet = null;
let cachedContract = null;

const getBlockchainConnection = () => {
  if (!isBlockchainConfigured()) {
    return { provider: null, wallet: null, contract: null };
  }

  if (!cachedProvider || !cachedWallet || !cachedContract) {
    cachedProvider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    cachedWallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, cachedProvider);
    cachedContract = new ethers.Contract(
      process.env.SMART_CONTRACT_ADDRESS,
      contractABI,
      cachedWallet,
    );
  }

  return {
    provider: cachedProvider,
    wallet: cachedWallet,
    contract: cachedContract,
  };
};

/**
 * 1. Helper untuk membuat SHA-256 Hash berformat bytes32 (0x...)
 */
const generateDataHash = (batchId, actionStatus, timestampStr) => {
  const payload = `${batchId}:${actionStatus}:${timestampStr}`;
  return '0x' + crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * 2. Merekam hash & status batch ke Blockchain (Write Operation)
 */
const recordToBlockchain = async (batchId, actionStatus, timestampStr) => {
  try {
    const { contract } = getBlockchainConnection();

    if (!contract) {
      return {
        success: false,
        recorded: false,
        reason: 'BLOCKCHAIN_NOT_CONFIGURED',
      };
    }

    const dataHash = generateDataHash(batchId, actionStatus, timestampStr);
    const tx = await contract.addRecord(batchId, actionStatus, dataHash);
    const receipt = await tx.wait();

    return {
      success: true,
      recorded: true,
      transactionHash: receipt?.hash || tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      dataHash,
    };
  } catch (error) {
    console.error('Error recording to blockchain:', error);
    return {
      success: false,
      recorded: false,
      error: error.message,
      reason: 'BLOCKCHAIN_WRITE_FAILED',
    };
  }
};

/**
 * 3. Mengambil histori trace dari Blockchain berdasarkan batchId (Read Operation)
 */
const getFromBlockchain = async (batchId) => {
  try {
    const { contract } = getBlockchainConnection();

    if (!contract) {
      return [];
    }

    const records = await contract.getRecords(batchId);

    return records.map((record) => ({
      batchId: record.batchId,
      actionStatus: record.actionStatus,
      dataHash: record.dataHash,
      timestamp: new Date(Number(record.timestamp) * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching from blockchain:', error);
    return [];
  }
};

module.exports = {
  generateDataHash,
  recordToBlockchain,
  getFromBlockchain,
  isBlockchainConfigured,
};