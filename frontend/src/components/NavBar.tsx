import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";

interface User {
    id: number;
    username: string;
    email: string;
    profilepicture: string;
}

function NavBar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/profile", { withCredentials: true })
            .then((res) => setUser(res.data))
            .catch((err) => {
                console.error("Not logged in or session expired", err);
            });
    }, []);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark ps-3 pe-3" style={{ background: "linear-gradient(180deg, #126e82 0%, #0f5c6d 100%)", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)" }}>
            <NavLink className="navbar-brand d-flex align-items-center" to="/">
                <img
                    src="favicon.png"
                    alt="Logo"
                    width="30"
                    height="30"
                    className="d-inline-block align-top me-2"
                />
                ChainElect
            </NavLink>

            <div className="collapse navbar-collapse justify-content-between" id="navbarNavAltMarkup">
                <div></div>
                <div className="navbar-nav">
                    {user && (
                        <NavLink className="nav-item nav-link d-flex align-items-center" to="/profile">
                            <img
                                src={`http://localhost:5000/uploads/${user.profilepicture || "default.jpg"}`}
                                alt="Profile"
                                className="rounded-circle me-2"
                                style={{ width: "30px", height: "30px", objectFit: "cover" }}
                            />
                            {user.username}
                        </NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavBar;
