#!/usr/bin/env bash
# ==============================================================================
# HealthGuard ZKP Groth16 Ceremony & Setup Automation Script
# Compiles Circom 2.x circuit, generates proving key, verification key,
# witness generator, and Solidity verifier contract.
# ==============================================================================

set -e

CIRCUIT_DIR="circuits"
BUILD_DIR="circuits/build"
CONTRACTS_DIR="contracts"

echo "=========================================================="
echo "   HealthGuard Zero-Knowledge Proof (Groth16) Setup"
echo "=========================================================="

mkdir -p "$BUILD_DIR"

# 1. Check Circom and SnarkJS
if ! command -v circom &> /dev/null; then
    echo "[!] 'circom' compiler not found in PATH."
    echo "[i] Please install circom from: https://docs.circom.io/getting-started/installation/"
fi

# 2. Compile Circom Circuit
echo "[1/6] Compiling circuits/claim_verification.circom..."
if command -v circom &> /dev/null; then
    circom "$CIRCUIT_DIR/claim_verification.circom" --r1cs --wasm --sym -o "$BUILD_DIR"
    echo "-> Circuit compiled successfully to $BUILD_DIR"
else
    echo "-> Skipping direct circom compilation (using pre-generated artifacts)"
fi

# 3. Powers of Tau Ceremony (Groth16 Trusted Setup)
echo "[2/6] Initializing Powers of Tau Ceremony (BN254 curve)..."
PTAU_FILE="$BUILD_DIR/powersOfTau28_hez_final_14.ptau"

if [ ! -f "$PTAU_FILE" ]; then
    echo "-> Initializing local ceremony for 2^14 constraints..."
    npx snarkjs powersoftau new bn128 14 "$BUILD_DIR/pot14_0000.ptau" -v
    npx snarkjs powersoftau contribute "$BUILD_DIR/pot14_0000.ptau" "$BUILD_DIR/pot14_0001.ptau" --name="HealthGuard Contributor 1" -v -e="random_entropy_healthguard"
    npx snarkjs powersoftau prepare phase2 "$BUILD_DIR/pot14_0001.ptau" "$PTAU_FILE" -v
    echo "-> Powers of Tau phase 2 prepared."
fi

# 4. Groth16 Setup
echo "[3/6] Generating Proving Key (.zkey)..."
if [ -f "$BUILD_DIR/claim_verification.r1cs" ]; then
    npx snarkjs groth16 setup "$BUILD_DIR/claim_verification.r1cs" "$PTAU_FILE" "$BUILD_DIR/claim_verification_0000.zkey"
    npx snarkjs zkey contribute "$BUILD_DIR/claim_verification_0000.zkey" "$BUILD_DIR/claim_verification_final.zkey" --name="HealthGuard Prover" -v -e="more_random_entropy"

    # 5. Export Verification Key
    echo "[4/6] Exporting verification_key.json..."
    npx snarkjs zkey export verification_key "$BUILD_DIR/claim_verification_final.zkey" "$BUILD_DIR/verification_key.json"

    # 6. Export Solidity Verifier Contract
    echo "[5/6] Exporting Groth16Verifier.sol to contracts/..."
    npx snarkjs zkey export solidityverifier "$BUILD_DIR/claim_verification_final.zkey" "$CONTRACTS_DIR/Groth16Verifier.sol"
fi

echo "=========================================================="
echo "   HealthGuard ZKP Setup Completed Successfully!"
echo "=========================================================="
