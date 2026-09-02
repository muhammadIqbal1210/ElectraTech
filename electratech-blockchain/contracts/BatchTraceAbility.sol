// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BatchTraceability {
    struct Record {
        string batchId;
        string actionStatus;
        bytes32 dataHash;
        uint256 timestamp;
    }

    // Mapping: batchId => Array of Records
    mapping(string => Record[]) private batchRecords;

    // Event log untuk dipantau off-chain
    event RecordAdded(
        string indexed batchId,
        string actionStatus,
        bytes32 dataHash,
        uint256 timestamp
    );

    /**
     * @notice Mencatat log baru untuk suatu Batch (hanya menyimpan hash data & status)
     */
    function addRecord(
        string memory _batchId,
        string memory _actionStatus,
        bytes32 _dataHash
    ) external {
        Record memory newRecord = Record({
            batchId: _batchId,
            actionStatus: _actionStatus,
            dataHash: _dataHash,
            timestamp: block.timestamp
        });

        batchRecords[_batchId].push(newRecord);

        emit RecordAdded(_batchId, _actionStatus, _dataHash, block.timestamp);
    }

    /**
     * @notice Mengambil seluruh riwayat log dari suatu Batch
     */
    function getRecords(string memory _batchId) external view returns (Record[] memory) {
        return batchRecords[_batchId];
    }
}