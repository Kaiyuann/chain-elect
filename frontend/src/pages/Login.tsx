import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login | ChainElect";
    }, []);

    const validateInput = (): string | null => {
        if (!email || !password) {
            return "Email and password are required.";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "Invalid email format.";
        }
        return null;
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validationError = validateInput();
        if (validationError) {
            setMessage(validationError);
            return;
        }

        setIsLoading(true);

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
        } finally {
            setIsLoading(false);
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


                <div className="mt-3">
                    <button type="submit" className="btn btn-primary me-2">
                        {isLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Logging in...
                            </>
                        ) : (
                            "Login"
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/")}
                        disabled={isLoading}
                    >
                        Back
                    </button>
                </div>

                {message && <p className="mt-2">{message}</p>}
            </form>
        </div>
    );
}

export default Login;