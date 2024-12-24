import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Chat from "./components/Chat";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas privadas protegidas */}
          <Route path="/" element={<PrivateRoute element={<Home />} />} />
          <Route path="/chat" element={<PrivateRoute element={<Chat />} />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
