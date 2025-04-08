import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface User {
    username: string;

}

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/profile", { withCredentials: true })
            .then((res) => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    return (
        <>
            {
                user ?
                    <div className="position-absolute start-50 top-50 translate-middle text-center">
                        <h2 className="mb-3">Welcome back, {user.username}!</h2>
                        <p className="mb-3">We'll email you when the site is ready, check out the trailer here ⬇️</p>
                        <iframe
                            width="560"
                            height="315"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            title="Welcome Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ borderRadius: "8px" }}
                        ></iframe>
                    </div>
                    :
                    <div className="position-absolute start-50 top-50 translate-middle">
                        <h1>Welcome!</h1>
                        <p className="mb-6">Please log in or register to continue.</p>

                        <button className="btn btn-primary me-4" onClick={() => navigate("/login")}>
                            Login
                        </button>

                        <button className="btn btn-secondary" onClick={() => navigate("/register")}>
                            Register
                        </button>
                    </div>
            }
        </>
    );
}

export default Home;