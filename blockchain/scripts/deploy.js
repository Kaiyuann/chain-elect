const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.deployed();

  console.log(`Voting contract deployed to: ${voting.address}`);

  // Prepare the save folder
  const contractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Write address to JSON
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Voting: voting.address }, null, 2)
  );

  // Write ABI to JSON
  const contractArtifact = await hre.artifacts.readArtifact("Voting");

  fs.writeFileSync(
    path.join(contractsDir, "Voting.json"),
    JSON.stringify(contractArtifact, null, 2)
  );

  console.log("Contract address and ABI saved to frontend/src/contracts/");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});