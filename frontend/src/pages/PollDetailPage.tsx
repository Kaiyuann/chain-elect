import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface Poll {
    id: number;
    title: string;
    description: string;
    creator_id: number;
    creator_name: string;
    startTime: string;
    endTime: string;
    status: string;
    options?: { id: number; label: string }[];
}

function PollDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [poll, setPoll] = useState<Poll | null>(null);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/polls/${id}`, {
            withCredentials: true
        })
            .then(res => setPoll(res.data))
            .catch(err => console.error("Failed to fetch poll:", err));
    }, [id]);

    const navigate = useNavigate();
    const isOpen = poll != null && poll.status === "open";

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
        </div>
    );
};

export default PollDetailPage;
