import { NavLink } from "react-router-dom";
import { getCookie } from "../utils/utils";

function NavBar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark ps-3 pe-3">
            <NavLink className="navbar-brand" to="/">ChainElect</NavLink>
            <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div className="navbar-nav">
                    <NavLink className="nav-item nav-link" to="/">Home</NavLink>
                    {getCookie("session_id") &&
                        <NavLink className="nav-item nav-link" to="/profile">Profile</NavLink>}
                    {document.cookie.includes("role=admin") && (
                        <NavLink className="nav-item nav-link" to="/admin">Admin</NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavBar