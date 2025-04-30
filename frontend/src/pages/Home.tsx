import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CreatePollModal from "../components/CreatePollModal";

interface Poll {
    id: number;
    title: string;
    description: string;
    creator_id: number;
    startTime: string;
    endTime: string;
    is_restricted: number;
    status: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    profilepicture: string;
}

function Home() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [search, setSearch] = useState("");
    const [user, setUser] = useState<User | null | "loading">("loading");
    const [showMyPollsOnly, setShowMyPollsOnly] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Home | ChainElect";
    }, []);

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/profile", { withCredentials: true })
            .then((res) => {
                setUser(res.data);
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    setUser(null);
                } else {
                    console.error("Unexpected error:", err);
                }
            });
    }, []);

    useEffect(() => {
        axios.get("http://localhost:5000/api/polls", {
            withCredentials: true
        })
            .then(res => setPolls(res.data))
            .catch(err => console.error("Failed to fetch polls:", err));
    }, []);

    const filteredPolls = polls.filter((poll) => {
        const matchesSearch = poll.title.toLowerCase().includes(search.toLowerCase());
        const matchesCreator = !showMyPollsOnly || (typeof user === "object" && user !== null && poll.creator_id === user.id);
        return matchesSearch && matchesCreator;
    });

    const getTimeRemaining = (endTime: string) => {
        const timeDiff = new Date(endTime).getTime() - Date.now();
        if (timeDiff <= 0) return "Closed";

        const mins = Math.floor(timeDiff / 1000 / 60) % 60;
        const hrs = Math.floor(timeDiff / 1000 / 60 / 60) % 24;
        const days = Math.floor(timeDiff / 1000 / 60 / 60 / 24);

        return `${days}d ${hrs}h ${mins}m left`;
    };

    return (

        <div className="container py-4">
            {user === "loading" && (
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {user === null && (
                <div className="position-absolute start-50 top-50 translate-middle text-center">
                    <h1>Welcome!</h1>
                    <p className="mb-4">Please log in or register to continue.</p>
                    <button className="btn btn-primary me-3" onClick={() => navigate("/login")}>
                        Login
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate("/register")}>
                        Register
                    </button>
                </div>
            )}

            {user && user !== "loading" && (
                <>
                    <div className="mb-4">
                        <div className="row gx-2 gy-2">
                            {/* Search bar: full width on small screens, 6 columns on medium+ */}
                            <div className="col-12 col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search polls..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Show My Polls + Create Poll button: split row on small, inline on md+ */}
                            <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-3">
                                <div className="form-check m-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={showMyPollsOnly}
                                        onChange={() => setShowMyPollsOnly(!showMyPollsOnly)}
                                        id="myPollsCheckbox"
                                    />
                                    <label className="form-check-label" htmlFor="myPollsCheckbox">
                                        Show My Polls Only
                                    </label>
                                </div>
                                <CreatePollModal />
                            </div>
                        </div>
                    </div>

                    <div className="row g-4">
                        {filteredPolls.map((poll) => (
                            <div
                                key={poll.id}
                                className="col-12 col-md-6 col-lg-4"
                            >
                                <div
                                    className="card h-100 shadow-sm border-0"
                                    role="button"
                                    onClick={() => navigate(`/poll/${poll.id}`)}
                                >
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="card-title mb-0">{poll.title}</h5>
                                            <span className={`badge ${poll.status === "open" ? "bg-success" : "bg-danger"}`}>
                                                {poll.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <p className="card-text text-muted small">
                                            {getTimeRemaining(poll.endTime)}
                                        </p>


                                        {poll.is_restricted === 1 && (
                                            <div>
                                                <span className="badge bg-light text-dark">
                                                    🔒 Restricted Access
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredPolls.length === 0 && (
                            <p className="text-muted text-center">No polls found.</p>
                        )}
                    </div>
                </>
            )}
        </div>

    );
};

export default Home;
