@echo off
echo ==================================================
echo   Deploying HealthGuard Contracts to Hardhat Node
echo ==================================================
cd contracts
npx.cmd hardhat run scripts/deploy.js --network localhost
pause
