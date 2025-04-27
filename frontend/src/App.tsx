import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PollDetailPage from "./pages/PollDetailPage";
import VotePage from "./pages/VotePage"
import Layout from "./components/Layout";
import NotFoundPage from "./pages/NotFoundPage";
import Guide from "./pages/Guide";

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/poll/:id" element={<PollDetailPage />} />
          <Route path="/poll/:id/vote" element={<VotePage />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;