import { useNavigate } from "react-router-dom";

function FloatingHelpButton() {
    const navigate = useNavigate();

    return (
        <>
            <style>
                {`
                .floating-help-btn {
                    position: fixed;
                    bottom: 50px;
                    left: 50px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background-color: #0d6efd; /* Bootstrap primary */
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    z-index: 9999;
                }

                .floating-help-btn:hover {
                    background-color: #0b5ed7;
                    transform: scale(1.05);
                }

                .floating-help-tooltip {
                    position: absolute;
                    top: -35px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.50);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                }
            `}
            </style>

            <div className="floating-help-btn" onClick={() => navigate("/guide")}>
                ?
                <div className="floating-help-tooltip">Need Help?</div>
            </div>
        </>
    );
}

export default FloatingHelpButton;