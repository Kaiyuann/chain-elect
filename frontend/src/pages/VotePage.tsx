import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import VotingContractABI from "../../../shared/contracts/Voting.json";
import contractAddress from "../../../shared/contracts/contract-address.json";

const SHARED_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const PROVIDER_URL = "http://localhost:8545"; // Hardhat local node

function VotePage() {
  const { id: pollId } = useParams();  // Poll ID from URL
  const [pollTitle, setPollTitle] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [options, setOptions] = useState<{ id: number; label: string }[]>([]);
  const [blockchainPollId, setBlockchainPollId] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    const fetchPollDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/polls/${pollId}`, {
          withCredentials: true
        });
        setPollTitle(response.data.title);
        setOptions(response.data.options);
        setBlockchainPollId(response.data.blockchain_poll_id);
      } catch (err: any) {
        console.error(err);
        setPollTitle("Poll Not Found");
      }
    };

    fetchPollDetails();
  }, [pollId]);

  const handleRequestToken = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/polls/${pollId}/request-token`,
        {},
        { withCredentials: true }
      );

      const issuedToken = response.data.token;
      setToken(issuedToken);

      // Automatically copy to clipboard
      await navigator.clipboard.writeText(issuedToken);
      alert("Token copied to clipboard! Please keep it safe and secret.");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to request token.");
    }
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedOption || !token || blockchainPollId === null) {
      setError("Missing information. Make sure to select an option, enter a token, and confirm poll data.");
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
      const wallet = new ethers.Wallet(SHARED_PRIVATE_KEY, provider);
      const votingContract = new ethers.Contract(
        contractAddress.Voting,
        VotingContractABI.abi,
        wallet
      );


      const tx = await votingContract.vote(blockchainPollId, token, selectedOption);
      await tx.wait();

      setSuccess("Vote successfully submitted on the blockchain!");
    } catch (err: any) {
      console.error("Voting failed:", err);
      setError("Voting failed. Check console for details.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Vote in: <span className="text-primary">{pollTitle}</span></h2>

      <div className="mb-3">
        <label className="form-label fw-bold">Your Voting Token (One-Time Only)</label>
        <div className="input-group">
          <input
            type={showToken ? "text" : "password"}
            className="form-control"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onMouseDown={() => setShowToken(true)}
            onMouseUp={() => setShowToken(false)}
            onMouseLeave={() => setShowToken(false)}
          >
            👁️ Hold to Show
          </button>
        </div>
        <small className="text-danger">
          ⚠️ This token can only be issued ONCE. Make sure to keep it safe and secret. If you lose it, you will not be able to vote again for this poll.
        </small>
      </div>

      <button
        className="btn btn-primary mb-4"
        onClick={handleRequestToken}
        disabled={token !== ""}
      >
        Request Voting Token
      </button>

      <form onSubmit={handleVoteSubmit}>
        <div className="mb-3">
          <label className="form-label fw-bold">Choose Your Option:</label>
          <select
            className="form-select"
            value={selectedOption || ""}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            required
          >
            <option value="">-- Select an Option --</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-success">
          Submit Vote
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {success && <div className="alert alert-success mt-3">{success}</div>}

    </div>
  );
};

export default VotePage;