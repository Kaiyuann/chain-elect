import { useParams } from "react-router-dom";


function VotePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container py-4">
      <h2>Vote for Poll #{id}</h2>
      <p>Enter your token and cast your vote.</p>
    </div>
  );
};

export default VotePage;