import { useEffect } from "react";

function Guide() {
    useEffect(() => {
        document.title = "Voting Guide | ChainElect";
    }, []);

    return (
        <div className="container my-5">
            <h1 className="mb-4 text-center">🗳️ How to Use ChainElect</h1>

            <p className="lead text-center">
                Welcome to <strong>ChainElect</strong> — a blockchain-based e-voting system designed to ensure privacy, transparency, and security. Here’s how to participate in the voting process:
            </p>

            <hr />

            <h3 className="mt-5">1️⃣ Register and Login</h3>
            <ul>
                <li>Click on <strong>Register</strong> to create your account.</li>
                <li>After registration, log in using your email and password.</li>
            </ul>

            <h3 className="mt-4">2️⃣ Creating a Poll (For Poll Creators)</h3>
            <ul>
                <li>Click the <strong>+ Create Poll</strong> button at the top right of the poll list page.</li>
                <li>Fill in the poll details:
                    <div className="ms-3">
                        📌 <span style={{ display: 'inline-block', width: '150px', fontWeight: 'bold' }}>Title:</span> The name of your poll — this is how participants will recognize and identify your poll in the list of available polls.<br />
                        📝 <span style={{ display: 'inline-block', width: '150px', fontWeight: 'bold' }}>Description:</span> Use this to explain what the poll is about or provide context for voters.<br />
                        ⏰ <span style={{ display: 'inline-block', width: '150px', fontWeight: 'bold' }}>End Time:</span> This defines the deadline for voting. After the end time, the poll will automatically close, and no more votes will be accepted.<br />
                        🔒 <span style={{ display: 'inline-block', width: '150px', fontWeight: 'bold' }}>Restrict Access?:</span> Enable this setting if you want to limit who can vote in the poll. You will be able to enter the email addresses of allowed voters (the whitelist).<br />
                        📺 <span style={{ display: 'inline-block', width: '150px', fontWeight: 'bold' }}>Allow Live Results?:</span> Enable this if you want everyone to see the real-time voting results before the poll closes.<br />
                        🗳️ <span style={{ display: 'inline-block', width: '150px', fontWeight: 'bold' }}>Vote Options:</span> Provide the choices that voters can select from when casting their vote.<br />
                    </div>
                </li>
                <li>Submit the poll — the system will generate one-time voting tokens and sync the poll to the blockchain. The poll starts immediately.</li>
            </ul>

            <h3 className="mt-4">3️⃣ How Voting Works</h3>
            <ul>
                <li>Choose an available poll from the home page.</li>
                <li>Click <strong>Vote Now</strong> if the poll is open and (if restricted) you are whitelisted.</li>
                <li>On the voting page:
                    <ul>
                        <li>Click <strong>Request Voting Token</strong> — your one-time token will be generated and copied to your clipboard automatically.</li>
                        <li>Select your voting option from the dropdown.</li>
                        <li>Click <strong>Submit Vote</strong> — your vote will be sent directly to the blockchain.</li>
                    </ul>
                </li>
                <li>You will receive a <strong>Transaction Hash</strong> as proof of your vote.</li>
            </ul>

            <h3 className="mt-4">4️⃣ Privacy & Security</h3>
            <ul>
                <li>Votes are sent directly to the blockchain — <strong>not through the backend</strong>.</li>
                <li>The backend cannot link your account to your vote.</li>
                <li>Tokens are hashed and stored on the blockchain; once used, a token cannot be reused.</li>
                <li>The system ensures <strong>one vote per token</strong>, maintaining fairness and privacy.</li>
            </ul>

            <h3 className="mt-4">5️⃣ Live Results (If Enabled by Poll Creator)</h3>
            <ul>
                <li>Live results show the current voting outcome (number of votes per option).</li>
                <li>Anyone can view live results if this option was turned on by the poll creator, including those who haven’t voted or aren’t whitelisted.</li>
            </ul>

            <h3 className="mt-4">6️⃣ Frequently Asked Questions (FAQ)</h3>
            <ul>
                <li>
                    <strong>❓ What happens if I lose my voting token?</strong>
                    <p>Your voting token is a one-time code that cannot be reissued. If you lose it before voting, you will not be able to participate in that poll. Please make sure to keep the token safe after requesting it.</p>
                </li>
                <li>
                    <strong>❓ Can I request more than one voting token for the same poll?</strong>
                    <p>No. Each user can only request one token per poll. The backend tracks token requests and prevents multiple token generation for the same poll by the same account.</p>
                </li>
                <li>
                    <strong>❓ Can the poll creator or the backend administrator see how I voted?</strong>
                    <p>No. Your vote is sent directly to the blockchain from your browser, not through the backend. The token is hashed on-chain, and the vote choice is not stored alongside any identifiable information.</p>
                </li>
                <li>
                    <strong>❓ What if someone shares their voting token with others?</strong>
                    <p>The system cannot stop someone from sharing their token, but each token can only be used once. After a token is used, it becomes invalid for future voting attempts.</p>
                </li>
                <li>
                    <strong>❓ Can I change my vote after submitting it?</strong>
                    <p>No. Once a vote is submitted to the blockchain, it cannot be altered or removed. Please double-check your selection before submitting.</p>
                </li>
                <li>
                    <strong>❓ Why do I need a token to vote? Why not just use my account?</strong>
                    <p>The token system ensures that your vote remains anonymous. Using accounts directly could link your identity to your vote, but tokens allow participation without exposing your chosen option.</p>
                </li>
            </ul>

            <hr className="my-5" />

            <p className="text-center">
                🛡️ If you have further questions, feel free to reach out to the system administrator.
            </p>
        </div>
    );
}

export default Guide;
