import { Link } from "react-router-dom";
import { useEffect } from "react";

function NotFoundPage() {

    useEffect(() => {
        document.title = "404 - Page Not Found | ChainElect";
    }, []);

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