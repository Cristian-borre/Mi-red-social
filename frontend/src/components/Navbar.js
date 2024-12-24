import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Mi Red Social</Link>
        {user && (
          <div className="space-x-4">
            <Link to="/chat" className="text-lg">Chat</Link>
            <button onClick={logout} className="bg-red-500 p-2 rounded-md">Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
