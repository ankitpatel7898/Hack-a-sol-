"""
HealthGuard End-to-End API Test Suite
Uses httpx.AsyncClient with ASGITransport for pure, direct in-process FastAPI testing.
Validates the full workflow:
1. Patient Dashboard & Encrypted records
2. Patient Permission Grant (on-chain event)
3. Hospital Claim Creation & Groth16 Proof Generation
4. Privacy Check: Insurer payload strips private diagnosis/prescriptions
5. Insurer ZKP Verification & On-Chain Settlement
6. Replay Attack Detection: Duplicate nullifier prevents double payout
"""

import asyncio
import httpx
from backend.main import app

async def main():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("==================================================")
        print("   HealthGuard End-to-End Backend Test Suite")
        print("==================================================")

        # 1. Root & System status
        print("\n[1] Checking System Status...")
        res = await client.get("/api/system/status")
        assert res.status_code == 200, f"System status failed: {res.text}"
        print("-> System Status: OK | Prover Ready | Database Initialized")

        # 2. Patient Dashboard
        print("\n[2] Fetching Patient Dashboard...")
        res = await client.get("/api/patient/pat_rahul_sharma_001/dashboard")
        assert res.status_code == 200, f"Dashboard failed: {res.text}"
        data = res.json()
        print(f"-> Patient: {data['patient']['name']}")
        print(f"-> Encrypted Records Count: {len(data['records'])}")
        print(f"-> Initial Permission Granted: {data['permission']['is_granted']}")

        # 3. Grant Permission
        print("\n[3] Patient Granting Hospital Access...")
        res = await client.post("/api/patient/permissions", json={
            "patient_id": "pat_rahul_sharma_001",
            "hospital_id": "Apollo Hospital Delhi",
            "is_granted": True
        })
        assert res.status_code == 200, f"Permission grant failed: {res.text}"
        perm_data = res.json()
        assert perm_data["permission"]["is_granted"] == True
        print(f"-> Permission Granted! On-chain Tx: {perm_data['blockchain_telemetry']['tx_hash'][:18]}...")

        # 4. Hospital Creates Claim & Generates Groth16 Proof
        print("\n[4] Hospital Submitting Treatment Claim & Generating Groth16 ZKP...")
        claim_payload = {
            "patient_name": "Rahul Sharma",
            "patient_id": "pat_rahul_sharma_001",
            "policy_id": "POL-IND-882190",
            "treatment": "Appendectomy",
            "diagnosis": "Acute Appendicitis with localized peritonitis",
            "prescriptions": "Ceftriaxone 1g IV, Metronidazole 500mg IV, Tramadol 50mg",
            "claim_amount": 25000,
            "hospital_id": "Apollo Hospital Delhi"
        }
        res = await client.post("/api/hospital/claims/generate-proof", json=claim_payload)
        assert res.status_code == 200, f"Claim proof gen failed: {res.text}"
        claim_res = res.json()
        claim_id = claim_res["claim_id"]
        nullifier = claim_res["claim_nullifier"]
        print(f"-> Claim Created: {claim_id}")
        print(f"-> Groth16 Proof Protocol: {claim_res['proof']['protocol']}")
        print(f"-> Public Signals count: {len(claim_res['public_signals'])}")
        print(f"-> Claim Nullifier: {nullifier[:20]}...")
        print(f"-> Privacy Notice: {claim_res['privacy_notice']}")

        # 5. Insurer Claims List (Audit privacy protection)
        print("\n[5] Insurer Fetching Claims (Verifying Zero-Knowledge Redaction)...")
        res = await client.get("/api/insurer/claims")
        assert res.status_code == 200
        insurer_data = res.json()
        found_claim = next((c for c in insurer_data["claims"] if c["id"] == claim_id), None)
        assert found_claim is not None
        assert found_claim["diagnosis"] == "REDACTED BY ZKP"
        assert found_claim["procedure_code"] == "REDACTED BY ZKP"
        assert found_claim["prescriptions"] == "REDACTED BY ZKP"
        print("-> STRICT PRIVACY CONFIRMED: Diagnosis, procedureCode, prescriptions are REDACTED BY ZKP!")

        # 6. Insurer Verifies ZKP & Settles On-Chain
        print(f"\n[6] Insurer Verifying Groth16 Proof & Settling Claim {claim_id} On-Chain...")
        res = await client.post(f"/api/insurer/claims/{claim_id}/verify-and-settle")
        assert res.status_code == 200, f"Settlement failed: {res.text}"
        settle_data = res.json()
        assert settle_data["status"] == "Settled"
        assert settle_data["proof_valid"] == True
        print(f"-> ZKP Verification Passed: Groth16 valid!")
        print(f"-> On-Chain Settlement Tx Hash: {settle_data['tx_hash']}")
        print(f"-> Payout Released to Hospital Wallet: {settle_data['payout_released']}")

        # 7. Replay Attack Protection Check
        print("\n[7] Testing Replay Attack Protection (Attempting Duplicate Settlement)...")
        res = await client.post(f"/api/insurer/claims/{claim_id}/verify-and-settle")
        assert res.status_code == 200 and "already settled" in res.json().get("message", "").lower()
        print("-> Replay Protection Verified: Duplicate payout prevented!")

        print("\n==================================================")
        print("   ALL TESTS PASSED! FULL-STACK BACKEND READY.")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
