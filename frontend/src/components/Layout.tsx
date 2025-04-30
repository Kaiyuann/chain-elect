import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./NavBar";
import FloatingHelpButton from "./FloatingHelpButton";

function Layout() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/profile", { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false)); // Not logged in
  }, []);

  const hiddenPaths = ["/login", "/register", "/guide"];
  const isHelpButtonHidden = hiddenPaths.includes(location.pathname) || !isLoggedIn;

  return (
    <>
      <Navbar />
      <main className="p-4">
        <Outlet />
      </main>
      {!isHelpButtonHidden && <FloatingHelpButton />}
    </>
  );
}

export default Layout;