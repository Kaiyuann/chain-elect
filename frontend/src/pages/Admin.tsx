import { useEffect, useState } from "react";
import axios from "axios";

interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
    profilepicture?: string;
}

const Admin = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/users", { withCredentials: true })
            .then((res) => setUsers(res.data))
            .catch((err) => console.error("Failed to fetch users:", err));
    }, []);

    if (users.length === 0) return (<p>Authentication Failed</p>)

    return (
        <div className="container mt-5">
            <h2 className="mb-4">All Users</h2>
            <table className="table table-striped table-bordered align-middle text-center">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Profile</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Password</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>
                                <img
                                    src={`http://localhost:5000/uploads/${user.profilepicture || "default.jpg"}`}
                                    alt={user.username}
                                    style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50%" }}
                                />
                            </td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.password}</td>
                            <td>{user.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="btn btn-danger mt-3">Shutdown Website</button>
        </div>
    );
};

export default Admin;
