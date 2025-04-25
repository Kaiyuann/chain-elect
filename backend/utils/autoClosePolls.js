import mysql from "mysql2/promise";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addressFilePath = path.join(__dirname, "..", "..", "shared", "contracts", "contract-address.json");
const abiFilePath = path.join(__dirname, "..", "..", "shared", "contracts", "Voting.json");

const contractAddress = JSON.parse(fs.readFileSync(addressFilePath, "utf-8")).Voting;
const contractArtifact = JSON.parse(fs.readFileSync(abiFilePath, "utf-8"));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const signer = await provider.getSigner(0);
const votingContract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);

export async function startAutoClosePolls() {
    console.log("Auto-close polls job started...");

    const db = await mysql.createConnection(dbConfig);

    async function closeExpiredPolls() {
        try {
            const [polls] = await db.execute(
                "SELECT id, blockchain_poll_id FROM poll WHERE status = 'open' AND endTime <= NOW()"
            );

            for (const poll of polls) {
                try {
                    console.log(`Attempting to close poll ID ${poll.id}...`);
                    const tx = await votingContract.closePoll(poll.blockchain_poll_id);
                    await tx.wait();

                    await db.execute("UPDATE poll SET status = 'closed' WHERE id = ?", [poll.id]);
                    console.log(`Poll ${poll.id} closed successfully.`);
                } catch (blockchainError) {
                    console.error(`Failed to close poll ${poll.id} on blockchain:`, blockchainError);
                }
            }
        } catch (dbError) {
            console.error("Database query failed:", dbError);
        }
    }

    setInterval(closeExpiredPolls, 10000); // Check every 30 seconds
}
