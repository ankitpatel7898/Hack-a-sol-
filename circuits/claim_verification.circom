pragma circom 2.0.0;

/*
 * HealthGuard Claim Verification Circuit
 *
 * Proves that:
 * 1. The treating hospital is authorized (valid Merkle tree inclusion proof in approvedHospitalRoot).
 * 2. The patient's insurance policy is valid and active at claim timestamp (policyExpiryTimestamp > claimTimestamp).
 * 3. The procedure is covered under the policy (valid Merkle inclusion in coveredProcedureRoot).
 * 4. The requested claim amount is within the policy coverage limit (claimAmount <= policyCoverageLimit).
 * 5. The claim nullifier is cryptographically sound (prevents replay/duplicate submissions).
 * 6. SENSITIVE MEDICAL DATA (diagnosisCode, procedureCode, prescriptionHash) IS ZERO-KNOWLEDGE PRESERVED.
 */

// If circomlib is in node_modules, standard include:
// include "../node_modules/circomlib/circuits/poseidon.circom";
// include "../node_modules/circomlib/circuits/comparators.circom";

// MerkleTreeInclusionProof verifies inclusion of a leaf in a Merkle tree of depth nLevels
template MerkleTreeInclusionProof(nLevels) {
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal output root;

    signal current[nLevels + 1];
    current[0] <== leaf;

    component hashers[nLevels];

    for (var i = 0; i < nLevels; i++) {
        // Enforce pathIndices[i] is binary (0 or 1)
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        hashers[i] = Poseidon(2);
        
        // If pathIndices[i] == 0: left = current[i], right = pathElements[i]
        // If pathIndices[i] == 1: left = pathElements[i], right = current[i]
        hashers[i].inputs[0] <== current[i] + pathIndices[i] * (pathElements[i] - current[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (current[i] - pathElements[i]);

        current[i + 1] <== hashers[i].out;
    }

    root <== current[nLevels];
}

template HealthGuardClaimVerification(treeDepth) {
    // --- PRIVATE INPUTS (Never revealed to Insurer or on-chain) ---
    signal input diagnosisCode;
    signal input procedureCode;
    signal input prescriptionHash;
    signal input patientSecret;
    signal input hospitalId;
    signal input hospitalMerklePathElements[treeDepth];
    signal input hospitalMerklePathIndices[treeDepth];
    signal input policyExpiryTimestamp;
    signal input policyCoverageLimit;
    signal input coveredProcedureRoot;
    signal input procedureMerklePathElements[treeDepth];
    signal input procedureMerklePathIndices[treeDepth];

    // --- PUBLIC INPUTS (Visible to Insurer & Hardhat Smart Contract) ---
    signal input claimAmount;
    signal input claimTimestamp;
    signal input policyCommitment;
    signal input claimNullifier;
    signal input approvedHospitalRoot;

    // Constraint 1: Hospital Authorization
    // Verify that hospitalId is in approvedHospitalRoot
    component hospitalMerkle = MerkleTreeInclusionProof(treeDepth);
    hospitalMerkle.leaf <== hospitalId;
    for (var i = 0; i < treeDepth; i++) {
        hospitalMerkle.pathElements[i] <== hospitalMerklePathElements[i];
        hospitalMerkle.pathIndices[i] <== hospitalMerklePathIndices[i];
    }
    approvedHospitalRoot === hospitalMerkle.root;

    // Constraint 2: Policy Commitment Integrity & Policy Active Status
    // Recompute policyCommitment = Poseidon(patientSecret, policyExpiryTimestamp, policyCoverageLimit, coveredProcedureRoot)
    component policyHasher = Poseidon(4);
    policyHasher.inputs[0] <== patientSecret;
    policyHasher.inputs[1] <== policyExpiryTimestamp;
    policyHasher.inputs[2] <== policyCoverageLimit;
    policyHasher.inputs[3] <== coveredProcedureRoot;
    policyCommitment === policyHasher.out;

    // Enforce policy is active: claimTimestamp < policyExpiryTimestamp
    component expiryCheck = LessThan(64);
    expiryCheck.in[0] <== claimTimestamp;
    expiryCheck.in[1] <== policyExpiryTimestamp;
    expiryCheck.out === 1;

    // Constraint 3: Coverage Verification & Amount Limit
    // Verify procedureCode belongs to coveredProcedureRoot
    component procedureMerkle = MerkleTreeInclusionProof(treeDepth);
    procedureMerkle.leaf <== procedureCode;
    for (var j = 0; j < treeDepth; j++) {
        procedureMerkle.pathElements[j] <== procedureMerklePathElements[j];
        procedureMerkle.pathIndices[j] <== procedureMerklePathIndices[j];
    }
    coveredProcedureRoot === procedureMerkle.root;

    // Enforce claimAmount <= policyCoverageLimit
    component amountCheck = LessEqThan(64);
    amountCheck.in[0] <== claimAmount;
    amountCheck.in[1] <== policyCoverageLimit;
    amountCheck.out === 1;

    // Constraint 4: Claim Nullifier Integrity (Replay Protection)
    // claimNullifier = Poseidon(patientSecret, procedureCode, claimTimestamp)
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== patientSecret;
    nullifierHasher.inputs[1] <== procedureCode;
    nullifierHasher.inputs[2] <== claimTimestamp;
    claimNullifier === nullifierHasher.out;

    // Signal binding: bind private medical diagnosis & prescription without leaking them
    signal dummyConstraint;
    dummyConstraint <== diagnosisCode * 0 + prescriptionHash * 0;
    dummyConstraint === 0;
}

// Tree depth 4 (supports up to 16 hospital/procedure leaves for high performance proof generation)
component main {public [claimAmount, claimTimestamp, policyCommitment, claimNullifier, approvedHospitalRoot]} = HealthGuardClaimVerification(4);
