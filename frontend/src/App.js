import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import MaidList from "./pages/MaidList";
import UserDashboard from "./pages/UserDashboard";
import MaidDashboard from "./pages/MaidDashboard";
import MaidRequests from "./pages/MaidRequests";
import MaidSkills from "./pages/MaidSkills";
import MaidAbout from "./pages/MaidAbout";
import EditProfile from "./pages/EditProfile";
import MaidProfile from "./pages/MaidProfile";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/maids"
          element={<MaidList />}
        />

        <Route
          path="/user-dashboard"
          element={<UserDashboard />}
        />

        <Route
          path="/maid-dashboard"
          element={<MaidDashboard />}
        />

        <Route
          path="/edit-profile"
          element={<EditProfile />}
        />

        <Route
          path="/maid/:id"
          element={<MaidProfile />}
        />

        <Route
          path="/maid-requests"
          element={<MaidRequests />}
        />

        <Route
          path="/maid-skills"
          element={<MaidSkills />}
        />

        <Route
          path="/maid-about"
          element={<MaidAbout />}
        />

        <Route
          path="/user-profile"
          element={<UserProfile />}
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/chat"
          element={<Chat />}
        />
        {/* Settings routes removed */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;