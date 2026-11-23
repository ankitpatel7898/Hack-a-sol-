const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("   HealthGuard Smart Contract Deployment");
  console.log("==================================================");

  const [deployer, hospitalWallet] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Hospital wallet account:", hospitalWallet ? hospitalWallet.address : "N/A");

  // 1. Deploy Groth16 Verifier
  console.log("\n1. Deploying Groth16Verifier...");
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("-> Groth16Verifier deployed at:", verifierAddress);

  // 2. Initial Approved Hospital Merkle Root
  // Matches Poseidon Merkle root for authorized hospital leaves (Apollo, Fortis, Max, AIIMS)
  const initialHospitalRoot = "0x1a87b326c9f69766dbb5cfdfbc6c77840332de62b9a1d13620dfc37f76901a5b";

  // 3. Deploy HealthGuardSettlement
  console.log("\n2. Deploying HealthGuardSettlement...");
  const Settlement = await hre.ethers.getContractFactory("HealthGuardSettlement");
  // Fund contract with 5.0 ETH for automatic claim payouts
  const settlement = await Settlement.deploy(verifierAddress, initialHospitalRoot, {
    value: hre.ethers.parseEther("5.0"),
  });
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("-> HealthGuardSettlement deployed at:", settlementAddress);

  const deploymentData = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    verifierAddress: verifierAddress,
    settlementAddress: settlementAddress,
    approvedHospitalRoot: initialHospitalRoot,
    deployer: deployer.address,
    hospitalWallet: hospitalWallet ? hospitalWallet.address : deployer.address,
    timestamp: new Date().toISOString(),
  };

  const contractsDir = path.join(__dirname, "..");
  fs.writeFileSync(
    path.join(contractsDir, "deployed_addresses.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Also export to backend for seamless RPC integration
  const backendDir = path.join(__dirname, "..", "..", "backend");
  if (fs.existsSync(backendDir)) {
    fs.writeFileSync(
      path.join(backendDir, "contracts.json"),
      JSON.stringify(deploymentData, null, 2)
    );
  }

  console.log("\nDeployment configuration exported to contracts/deployed_addresses.json and backend/contracts.json");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
