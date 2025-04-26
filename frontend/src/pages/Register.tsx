import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

function Register() {
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Register | ChainElect";
    }, []);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await axios.post<{ message: string }>("http://localhost:5000/api/register", {
                username,
                email,
                password,
            }, {
                withCredentials: true
            });
            setMessage(res.data.message || "Registration successful");
            navigate("/login");
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setMessage(error.response?.data?.message || "Registration failed");

        }
    };

    return (
        <div className="position-absolute top-50 start-50 w-25 translate-middle">
            <form onSubmit={handleRegister}>
                <h2 className="mb-3">Register</h2>

                <div className="form-group mb-2">
                    <label htmlFor="register-input-username">Username</label>
                    <input type="text" className="form-control" id="register-input-username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className="form-group mb-2">
                    <label htmlFor="register-input-email">Email</label>
                    <input type="text" className="form-control" id="register-input-email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group mb-2">
                    <label htmlFor="register-input-password">Password</label>
                    <input type="password" className="form-control" id="register-input-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary mt-2">
                    Register
                </button>

                {message && <p>{message}</p>}
            </form>
        </div>
    );
}

export default Register;
