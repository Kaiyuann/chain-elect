import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import VotingContractABI from "../../../shared/contracts/Voting.json";
import contractAddress from "../../../shared/contracts/contract-address.json";
import PollResultsChart from "../components/PollResultsChart";

const SHARED_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const PROVIDER_URL = "http://localhost:8545"; // Hardhat local node

interface Poll {
    id: number;
    title: string;
    description: string;
    creator_id: number;
    creator_name: string;
    startTime: string;
    endTime: string;
    allow_live_results: number;
    isRestricted: number;
    status: string;
    blockchain_poll_id: number;
    options: { id: number; label: string }[];
}


function PollDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [results, setResults] = useState<number[]>([]);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/polls/${id}`, {
            withCredentials: true
        })
            .then(res => setPoll(res.data))
            .catch(err => console.error("Failed to fetch poll:", err));
    }, [id]);

    const navigate = useNavigate();
    const isOpen = poll != null && poll.status === "open";

    const fetchLiveResults = async (pollId: number) => {
        try {
            const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
            const wallet = new ethers.Wallet(SHARED_PRIVATE_KEY, provider);
            const votingContract = new ethers.Contract(
                contractAddress.Voting,
                VotingContractABI.abi,
                wallet
            );
            const resultArray = await votingContract.getResults(pollId);
            setResults(resultArray.map((count: bigint) => Number(count)));
        } catch (error) {
            console.error("Failed to fetch live results:", error);
        }
    };

    useEffect(() => {
        console.log(poll);
        if (poll && poll.allow_live_results && poll.blockchain_poll_id !== null) {
            const interval = setInterval(() => {
                fetchLiveResults(poll.blockchain_poll_id);
            }, 5000); // Update every 5 seconds
            return () => clearInterval(interval);
        }
    }, [poll]);

    const handleVoteClick = () => {
        if (isOpen) {
            navigate(`/poll/${poll.id}/vote`);
        }
    };

    if (!poll) return <p className="text-center mt-5">Loading poll...</p>;

    return (
        <div className="container py-4">
            <h2 className="mb-3">{poll.title}</h2>

            <div className="mb-3">
                <strong>Description:</strong>
                <p>{poll.description}</p>
            </div>

            <div className="mb-2">
                <strong>Created By:</strong> {poll.creator_name}
            </div>

            <div className="mb-2">
                <strong>Status:</strong>{" "}
                <span className={`badge ${poll.status === "open" ? "bg-success" : "bg-secondary"}`}>
                    {poll.status.toUpperCase()}
                </span>
            </div>

            <div className="mb-2">
                <strong>Start Time:</strong>{" "}
                {new Date(poll.startTime).toLocaleString()}
            </div>

            <div className="mb-2">
                <strong>End Time:</strong>{" "}
                {new Date(poll.endTime).toLocaleString()}
            </div>

            <div className="mb-2">
                <h5 className="mt-4">Options</h5>
                <ul className="list-group">
                    {poll.options?.map(opt => (
                        <li key={opt.id} className="list-group-item">{opt.label}</li>
                    ))}
                </ul>
            </div>

            <div className="text-center mt-4">
                <div
                    className={isOpen ? "" : "d-inline-block"}
                    title={isOpen ? "" : "Voting is closed for this poll"}
                >
                    <button
                        className={`btn btn-primary ${!isOpen ? "disabled opacity-50" : ""}`}
                        onClick={handleVoteClick}
                        disabled={!isOpen}
                    >
                        Vote Now
                    </button>
                </div>
                {!isOpen && (
                    <p className="text-danger mt-2">Voting is currently closed for this poll.</p>
                )}
            </div>
            {poll && poll.allow_live_results && poll.blockchain_poll_id !== null && results.length > 0 && (
                <PollResultsChart results={results} options={poll.options} />
            )}
        </div>
    );
};

export default PollDetailPage;
