import { useState } from "react";
import axios from "axios";

function CreatePollModal() {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [endTime, setEndTime] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await axios.post("http://localhost:5000/api/polls", {
                title,
                description,
                endTime,
            }, {
                withCredentials: true
            });
            setShow(false); // close modal on success
            window.location.reload(); // refresh poll list
        } catch (err) {
            console.error("Failed to create poll:", err);
        }
    };

    return (
        <>
            <button
                className="btn btn-primary ms-3"
                onClick={() => setShow(true)}
            >
                + Create Poll
            </button>

            {show && (
                <div className="modal show fade d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">Create New Poll</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShow(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">End Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="submit" className="btn btn-success">
                                        Submit
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShow(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreatePollModal;