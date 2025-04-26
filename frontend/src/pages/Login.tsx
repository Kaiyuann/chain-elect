import { useEffect, useState } from "react";
//import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    //const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login | ChainElect";
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/login", {
                email,
                password,
            }, {
                withCredentials: true
            });

            window.location.href = "/";
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setMessage(error.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="position-absolute top-50 start-50 w-25 translate-middle">
            <form onSubmit={handleLogin}>
                <h2 className="mb-3">Login</h2>

                <div className="form-group mb-2">
                    <label htmlFor="login-input-email">Email address</label>
                    <input type="text" className="form-control" id="login-input-email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group mb-2">
                    <label htmlFor="login-input-password">Password</label>
                    <input type="password" className="form-control" id="login-input-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>


                <button type="submit" className="btn btn-primary mt-2">
                    Login
                </button>

                {message && <p>{message}</p>}
            </form>
        </div>
    );
}

export default Login;