import { useState } from "react";
import axios from "axios";

function CreatePollModal() {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [endTime, setEndTime] = useState("");
    const [allowLiveResults, setAllowLiveResults] = useState(false);
    const [options, setOptions] = useState<string[]>([""]);
    const [whitelistEmails, setWhitelistEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState<string>("");
    const [isRestricted, setIsRestricted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string>("");

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const addOption = () => {
        setOptions([...options, ""]);
    };

    const removeOption = (index: number) => {
        const updated = options.filter((_, i) => i !== index);
        setOptions(updated);
    };

    const handleAddEmail = () => {
        if (emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
            setWhitelistEmails([...whitelistEmails, emailInput]);
            setEmailInput("");
        }
    };

    const handleRemoveEmail = (index: number) => {
        setWhitelistEmails(whitelistEmails.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError("");

        if (!title.trim()) {
            setValidationError("Poll title is required.");
            return;
        }

        if (!endTime) {
            setValidationError("End time is required.");
            return;
        }

        const selectedEndTime = new Date(endTime);
        const currentTime = new Date();
        if (selectedEndTime <= currentTime) {
            setValidationError("End time cannot be in the past.");
            return;
        }

        if (options.filter(option => option.trim() !== "").length < 2) {
            setValidationError("At least 2 vote options are required.");
            return;
        }

        const trimmedOptions = options.map(opt => opt.trim().toLowerCase()).filter(opt => opt !== "");
        const hasDuplicateOptions = new Set(trimmedOptions).size !== trimmedOptions.length;

        if (hasDuplicateOptions) {
            setValidationError("Poll options must not have duplicates.");
            return;
        }

        if (isRestricted && whitelistEmails.length === 0) {
            setValidationError("Please add at least one whitelisted email for restricted polls.");
            return;
        }

        setIsLoading(true);


        try {
            await axios.post("http://localhost:5000/api/polls", {
                title,
                description,
                endTime,
                options,
                allowLiveResults,
                isRestricted,
                whitelistEmails
            }, {
                withCredentials: true
            });
            setShow(false);
            window.location.reload();
        } catch (err) {
            console.error("Failed to create poll:", err);
            setValidationError("Failed to create poll. Please try again.");
        } finally {
            setIsLoading(false);
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

                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="liveResultsCheckbox"
                                            checked={allowLiveResults}
                                            onChange={(e) => setAllowLiveResults(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="liveResultsCheckbox">
                                            Allow Live Results Viewing
                                        </label>
                                    </div>

                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="restrictPollCheckbox"
                                            checked={isRestricted}
                                            onChange={(e) => setIsRestricted(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="restrictPollCheckbox">
                                            Restrict poll to specific email addresses
                                        </label>
                                    </div>

                                    {isRestricted && (
                                        <div className="mb-3">
                                            <label className="form-label">Whitelist Emails</label>
                                            <div className="d-flex flex-wrap">
                                                {whitelistEmails.map((email, index) => (
                                                    <span key={index} className="badge bg-primary me-2 mb-2">
                                                        {email}
                                                        <button
                                                            type="button"
                                                            className="btn-close btn-close-white btn-sm ms-2"
                                                            onClick={() => handleRemoveEmail(index)}
                                                        ></button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="Type email and press Enter"
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                                            />
                                            <div className="form-text">Press Enter to add each email. Invalid emails will be ignored.</div>
                                        </div>
                                    )}


                                    <div className="mb-3">
                                        <label className="form-label">Vote Options</label>
                                        {options.map((option, index) => (
                                            <div key={index} className="input-group mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={`Option ${index + 1}`}
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => removeOption(index)}
                                                    disabled={options.length <= 1}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={addOption}
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                    {validationError && (
                                        <div className="alert alert-danger">
                                            {validationError}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button type="submit" className="btn btn-success" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            "Submit"
                                        )}
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