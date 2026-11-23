// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Groth16Verifier.sol";

/**
 * @title HealthGuardSettlement
 * @notice Zero-Knowledge Proof Insurance Claim Settlement & Audit Contract.
 * Enforces replay protection via claim nullifiers, verifies Groth16 proofs,
 * and settles funds to authorized hospital wallets without exposing private medical data.
 */
contract HealthGuardSettlement {
    address public immutable owner;
    Groth16Verifier public immutable verifier;

    // Merkle root of approved hospital public identifiers
    uint256 public approvedHospitalRoot;

    // Mapping from claimNullifier to whether it has already been settled (Replay Protection)
    mapping(uint256 => bool) public usedNullifiers;

    // Mapping of patient off-chain encrypted medical record hashes
    mapping(bytes32 => bool) public recordHashes;

    // Patient to hospital access control: patient => hospital => isGranted
    mapping(address => mapping(address => bool)) public hospitalPermissions;

    // Settlement and Audit Events
    event ClaimSettled(
        uint256 indexed claimNullifier,
        uint256 indexed policyCommitment,
        uint256 claimAmount,
        address indexed hospitalWallet,
        uint256 timestamp
    );

    event AccessGranted(
        address indexed patient,
        address indexed hospital,
        uint256 timestamp
    );

    event AccessRevoked(
        address indexed patient,
        address indexed hospital,
        uint256 timestamp
    );

    event RecordAnchored(
        bytes32 indexed recordHash,
        uint256 indexed patientId,
        uint256 timestamp
    );

    event HospitalRootUpdated(
        uint256 indexed oldRoot,
        uint256 indexed newRoot,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only contract owner");
        _;
    }

    constructor(address _verifierAddress, uint256 _initialHospitalRoot) payable {
        require(_verifierAddress != address(0), "Invalid verifier address");
        owner = msg.sender;
        verifier = Groth16Verifier(_verifierAddress);
        approvedHospitalRoot = _initialHospitalRoot;
        emit HospitalRootUpdated(0, _initialHospitalRoot, block.timestamp);
    }

    /**
     * @notice Submit and automatically settle an insurance claim using Groth16 ZKP.
     * @param a Proof element A
     * @param b Proof element B
     * @param c Proof element C
     * @param publicSignals Array of 5 public signals:
     *        [0] = claimAmount
     *        [1] = claimTimestamp
     *        [2] = policyCommitment
     *        [3] = claimNullifier
     *        [4] = approvedHospitalRoot
     * @param hospitalWallet Payable address of the hospital receiving settlement
     */
    function submitAndSettleClaim(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[5] calldata publicSignals,
        address payable hospitalWallet
    ) external returns (bool) {
        uint256 claimAmount = publicSignals[0];
        uint256 claimTimestamp = publicSignals[1];
        uint256 policyCommitment = publicSignals[2];
        uint256 claimNullifier = publicSignals[3];
        uint256 hospitalRoot = publicSignals[4];

        // 1. Enforce Replay Protection: Revert if nullifier is already used
        require(
            !usedNullifiers[claimNullifier],
            "Duplicate claim nullifier: Replay attack detected"
        );

        // 2. Validate hospital root against insurer registry
        require(
            hospitalRoot == approvedHospitalRoot,
            "Invalid approved hospital root"
        );

        // 3. Verify the Groth16 Zero-Knowledge Proof
        bool proofValid = verifier.verifyProof(a, b, c, publicSignals);
        require(proofValid, "Invalid ZKP: Groth16 verification failed");

        // 4. Mark nullifier as spent permanently
        usedNullifiers[claimNullifier] = true;

        // 5. Transfer settlement payout if contract has funds
        if (address(this).balance >= claimAmount && claimAmount > 0) {
            (bool success, ) = hospitalWallet.call{value: claimAmount}("");
            require(success, "Settlement transfer to hospital failed");
        }

        // 6. Emit immutable on-chain event
        emit ClaimSettled(
            claimNullifier,
            policyCommitment,
            claimAmount,
            hospitalWallet,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Patient grants access permission to a hospital.
     */
    function grantAccess(address hospital) external {
        require(hospital != address(0), "Invalid hospital address");
        hospitalPermissions[msg.sender][hospital] = true;
        emit AccessGranted(msg.sender, hospital, block.timestamp);
    }

    /**
     * @notice Patient revokes access permission from a hospital.
     */
    function revokeAccess(address hospital) external {
        require(hospital != address(0), "Invalid hospital address");
        hospitalPermissions[msg.sender][hospital] = false;
        emit AccessRevoked(msg.sender, hospital, block.timestamp);
    }

    /**
     * @notice Anchor an encrypted medical record SHA-256 hash on-chain.
     */
    function anchorRecordHash(bytes32 recordHash, uint256 patientId) external {
        recordHashes[recordHash] = true;
        emit RecordAnchored(recordHash, patientId, block.timestamp);
    }

    /**
     * @notice Update approved hospital Merkle root.
     */
    function updateApprovedHospitalRoot(uint256 newRoot) external onlyOwner {
        uint256 oldRoot = approvedHospitalRoot;
        approvedHospitalRoot = newRoot;
        emit HospitalRootUpdated(oldRoot, newRoot, block.timestamp);
    }

    // Allow contract to receive ETH for settlement payouts
    receive() external payable {}
}
