import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
    return (
        <div className="container text-center py-5">
            <h1 className="display-4">404 - Page Not Found</h1>
            <p className="lead">Oops! The page you're looking for does not exist.</p>
            <Link to="/" className="btn btn-primary mt-3">
                Back to Home
            </Link>
        </div>
    );
};

export default NotFoundPage;