import { ChangeEvent, useEffect, useState } from "react";
import axios from "axios";

interface User {
    id: number;
    username: string;
    email: string;
    profilepicture: string;
}

function Profile() {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        document.title = "Not Logged In | ChainElect";
    }, []);

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/profile", { withCredentials: true })
            .then((res) => {
                setUser(res.data);
                document.title = res.data.username + " | ChainElect";
            })
            .catch((err) => {
                console.error(err);
                setError("Not logged in or session expired");
            });
    }, []);


    if (error) return <div className="p-4 text-red-500">{error}</div>;

    if (!user) return <div className="p-4">Loading...</div>;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("profile", selectedFile);

        try {
            await axios.post("http://localhost:5000/api/upload-profile", formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setShowModal(false);
            window.location.reload();
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };


    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:5000/api/logout", {}, { withCredentials: true });

            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <>
            <div className="position-absolute start-50 top-50 translate-middle">
                <div className="d-flex justify-content-center gap-4">
                    <img
                        src={`http://localhost:5000/uploads/${user.profilepicture || "default.jpg"}`}
                        alt={user.username}
                        className="rounded-circle"
                        style={{ width: "150px", height: "150px", objectFit: "cover" }}
                        onClick={() => setShowModal(true)}
                    />
                    <div className="w-50">
                        <h2>{user.username}</h2>
                        <p>{user.email}</p>
                        <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
                    </div>

                </div>
            </div>
            {showModal && (
                <div className="modal fade show d-block" tabIndex={-1} role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content p-3">
                            <div className="modal-header">
                                <h5 className="modal-title">Upload New Profile Picture</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleUpload}>
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Profile;