# HealthGuard | Privacy-Preserving Healthcare Records & ZKP Insurance Claims Platform

HealthGuard is a production-ready, full-stack Web3 healthcare ecosystem combining **Next.js 14 (App Router)**, **Python (FastAPI)**, **Circom 2.x + SnarkJS (Groth16)**, **Solidity 0.8.20 + Hardhat**, and **PostgreSQL (Supabase)** with **AES-256-GCM** off-chain medical record encryption.

---

## Architecture Overview

```
                                      +---------------------------------------------+
                                      |            Next.js 14 Frontend              |
                                      |    (Patient, Hospital, Insurer Portals)     |
                                      +----------------------+----------------------+
                                                             |
                                               REST APIs & Typed Client
                                                             |
                                                             v
+-------------------------------------------------------------------------------------------------------------------+
|                                              FastAPI Backend (Python)                                             |
|                                                                                                                   |
|   +-----------------------+     +------------------------+     +-------------------------+     +--------------+   |
|   |   AES-256-GCM Engine  |     | Groth16 Prover Engine  |     |   Hardhat JSON-RPC /    |     |  PostgreSQL  |   |
|   |  (96-bit IV, 16B Tag) |     | (Poseidon BN254 Curve) |     |     Web3 Integration    |     |  (Supabase)  |   |
|   +-----------+-----------+     +-----------+------------+     +------------+------------+     +-------+------+   |
+---------------|-----------------------------|-------------------------------|--------------------------|----------+
                |                             |                               |                          |
                v                             v                               v                          v
     +--------------------+       +-----------------------+       +------------------------+    +----------------+
     |  Encrypted Off-    |       |  Circom 2.x Circuit   |       | Solidity Smart Contract|    | Schema & Audit |
     |  Chain Records     |       | `claim_verification`  |       | `HealthGuardSettlement`|    |     Ledger     |
     | (SHA-256 Anchored) |       |  (Zero-Knowledge)     |       | (Groth16 Verification) |    |  (Supabase DB) |
     +--------------------+       +-----------------------+       +------------------------+    +----------------+
```

---

## 1. Zero-Knowledge Circuit (`circuits/claim_verification.circom`)

The Groth16 circuit proves claim validity **without revealing sensitive medical records**:

### Private Inputs (Never leaked to Insurer or On-Chain)
* `diagnosisCode`: Numeric encoding of patient medical diagnosis.
* `procedureCode`: Numeric procedural identifier.
* `prescriptionHash`: Poseidon hash of medications and treatment history.
* `patientSecret`: Patient's cryptographic salt.
* `hospitalId`, `hospitalMerklePathElements`, `hospitalMerklePathIndices`: Merkle tree proof of hospital authorization.
* `policyExpiryTimestamp`, `policyCoverageLimit`, `coveredProcedureRoot`, `procedureMerklePathElements`, `procedureMerklePathIndices`: Merkle proof of policy coverage.

### Public Signals (Visible to Smart Contract & Insurer)
1. `claimAmount`: Claim payout amount in INR (e.g., ₹20,000).
2. `claimTimestamp`: Unix timestamp of treatment.
3. `policyCommitment`: $Poseidon(patientSecret, policyExpiryTimestamp, policyCoverageLimit, coveredProcedureRoot)$.
4. `claimNullifier`: $Poseidon(patientSecret, procedureCode, claimTimestamp)$ — **prevents replay attacks**.
5. `approvedHospitalRoot`: Merkle root of insurer-approved hospitals.

### Enforced Circuit Constraints
1. **Hospital Authorization:** Verifies `hospitalId` is an authorized leaf in `approvedHospitalRoot`.
2. **Policy Active Status:** Enforces $claimTimestamp < policyExpiryTimestamp$ and checks `policyCommitment`.
3. **Coverage & Policy Limit:** Verifies `procedureCode` is a valid leaf in `coveredProcedureRoot` and enforces $claimAmount \le policyCoverageLimit$.
4. **Nullifier Integrity:** Cryptographically binds $claimNullifier \equiv Poseidon(patientSecret, procedureCode, claimTimestamp)$.

---

## 2. Directory Structure

```
Hack-a-sol-/
├── backend/                        # FastAPI Backend
│   ├── db/
│   │   ├── database.py             # PostgreSQL / SQLite DB client with auto-seeding
│   │   └── healthguard.db          # Embedded storage database
│   ├── security/
│   │   └── encryption.py           # AES-256-GCM encryption with SHA-256 commitments
│   ├── zkp/
│   │   └── prover.py               # Poseidon BN254 hash & Groth16 witness generator
│   ├── blockchain.py               # Hardhat EVM client & Web3 transaction dispatcher
│   ├── main.py                     # Production FastAPI application & CORS routers
│   ├── test_api.py                 # Automated end-to-end integration test suite
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment configuration
│
├── circuits/                       # Zero-Knowledge Layer
│   ├── claim_verification.circom   # Circom 2.x claim verification circuit
│   └── build/                      # Build artifacts (vkey, .ptau, .zkey)
│
├── contracts/                      # Hardhat & Solidity Layer
│   ├── Groth16Verifier.sol         # Groth16 alt_bn128 zk-SNARK verifier
│   ├── HealthGuardSettlement.sol   # Claim settlement, access control & nullifier registry
│   ├── hardhat.config.js           # Hardhat network configuration
│   ├── package.json                # Hardhat npm dependencies
│   └── scripts/
│       └── deploy.js               # Contract deployment & address export script
│
├── frontend/                       # Next.js 14+ App Router Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Tailwind & HealthGuard visual styles
│   │   │   ├── layout.tsx          # Root layout with Inter font
│   │   │   └── page.tsx            # Main application coordinator
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Sticky navigation with live telemetry indicator
│   │   │   ├── Hero.tsx            # Hero section with 3D tilted card
│   │   │   ├── Features.tsx        # 4 technology capability cards
│   │   │   ├── PortalsSection.tsx  # Patient, Hospital, Insurer portal launchers
│   │   │   ├── PatientDashboard.tsx# AES-256 records, on-chain toggle, claims
│   │   │   ├── HospitalDashboard.tsx# Treatment claim creation & Groth16 proof gen
│   │   │   ├── InsurerDashboard.tsx # ZKP verification & on-chain settlement trigger
│   │   │   ├── VerificationModal.tsx# Step-by-step ZKP proof verification animation
│   │   │   ├── AboutSection.tsx    # Platform philosophy
│   │   │   └── Footer.tsx          # Brand footer
│   │   ├── lib/
│   │   │   └── api.ts              # Typed API client connected to backend
│   │   └── types/
│   │       └── index.ts            # TypeScript data contracts
│   ├── tailwind.config.js          # Extended brand colors and shadows
│   └── package.json                # Next.js & React dependencies
│
├── supabase/
│   └── migrations/
│       └── 001_healthguard_schema.sql # Supabase PostgreSQL migration
│
├── scripts/                        # Automation & Startup Scripts
│   ├── setup_zkp.sh                # Circom & SnarkJS ceremony setup script
│   ├── setup_zkp.js                # Cross-platform Node.js ZKP script
│   ├── start_backend.bat           # Run FastAPI service
│   ├── start_frontend.bat          # Run Next.js frontend
│   ├── start_hardhat.bat           # Run Hardhat EVM local node
│   ├── deploy_contracts.bat        # Deploy smart contracts
│   └── setup_all.bat               # Full-stack automated installer
│
├── index.html                      # Original static prototype (preserved)
├── script.js                       # Original prototype script (preserved)
├── style.css                       # Original prototype styling (preserved)
└── README.md                       # Complete documentation
```

---

## 3. Step-by-Step Setup & Execution

### Prerequisites
* **Node.js**: v18+ or v20+ (`node -v`)
* **Python**: 3.10+ (`python --version`)
* **Git**

---

### Step 1: Compile Circom Circuit & Export Groth16 Verifier
Run the ZKP compilation and Powers of Tau setup script:
```bash
# On Linux / macOS / Git Bash:
bash scripts/setup_zkp.sh

# On Windows:
node scripts/setup_zkp.js
```

---

### Step 2: Start Local Hardhat Node & Deploy Smart Contracts
Open a new terminal window:
```bash
# Install Hardhat dependencies
cd contracts
npm install

# Start the local Hardhat EVM blockchain node (runs on http://127.0.0.1:8545)
npx hardhat node
```

In a second terminal, deploy `Groth16Verifier.sol` and `HealthGuardSettlement.sol`:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
*This automatically funds the contract with 5.0 ETH for instant hospital settlement payouts and exports deployed addresses to `backend/contracts.json`.*

---

### Step 3: Configure Database & Start the FastAPI Backend
Open a third terminal:
```bash
# Install backend Python dependencies
python -m pip install -r backend/requirements.txt

# Run the end-to-end integration test suite
python -m backend.test_api

# Start the FastAPI service (runs on http://127.0.0.1:8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Note: If connecting to a remote Supabase instance, execute `supabase/migrations/001_healthguard_schema.sql` in the Supabase SQL Editor and set `DATABASE_URL` in `backend/.env`.*

---

### Step 4: Run the Next.js Frontend
Open a fourth terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 4. End-to-End Demo Workflow

1. **Landing Page:** Explore features, view 3D security verification card, and review platform stats.
2. **Patient Portal:**
   * View AES-256-GCM encrypted medical records with on-chain SHA-256 commitment hashes (`0x...`).
   * Switch the **Hospital Access Permission Toggle** to `Enabled`. Notice the live on-chain transaction hash generated and logged to the immutable audit trail.
3. **Hospital Portal:**
   * Observe the active green banner indicating patient permission is granted.
   * Fill out the **Create New Insurance Claim Form** (e.g., *Appendectomy*, Claim Amount: *₹20,000*).
   * Click **Generate ZKP & Submit Claim**. The Groth16 prover generates the mathematical proof (`pi_a`, `pi_b`, `pi_c`), creates the unique nullifier, and strips raw diagnosis/prescriptions from the insurer payload.
4. **Insurance Portal:**
   * Inspect the submitted claim. Note that **Diagnosis**, **Procedure**, and **Prescriptions** are explicitly marked **`REDACTED BY ZKP`**.
   * Click **Verify ZKP & Settle On-Chain**. The verification modal executes nullifier anti-replay checks, validates the Groth16 proof on the BN254 curve, executes the Hardhat smart contract settlement transaction, and automatically disburses funds to the hospital wallet.
   * Attempting duplicate settlement demonstrates replay protection—preventing double spending.

---

## 5. Security & Cryptographic Specifications

| Component | Standard / Algorithm | Role in HealthGuard |
|---|---|---|
| **Off-Chain Encryption** | `AES-256-GCM` (96-bit IV, 16B Tag) | Protects sensitive diagnosis, prescriptions, and clinical notes. |
| **Record Commitment** | `SHA-256` | Anchored on-chain to detect any off-chain data tampering. |
| **Zero-Knowledge Proofs** | `Circom 2.x` + `SnarkJS (Groth16)` | Verifies eligibility without revealing medical details. |
| **Elliptic Curve** | `BN254` (`alt_bn128`) | Precompile `0x08` pairing verification on EVM. |
| **Replay Protection** | `Poseidon(secret, code, timestamp)` | Unique single-use nullifier tracked in smart contract. |
| **Smart Contracts** | `Solidity 0.8.20` | Trustless settlement, permission events, immutable audit trail. |

---

## License
MIT License. Built for the privacy-preserving Web3 healthcare hackathon.
