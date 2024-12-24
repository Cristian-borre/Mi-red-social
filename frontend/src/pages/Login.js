import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Importar useNavigate

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate(); // Crear una instancia de useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // Verificamos si se recibió el token y los datos del usuario
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;

        // Almacenamos el token y la información del usuario en el contexto y en el localStorage
        login(token, user); // Guardamos tanto el token como la información del usuario
        navigate("/"); // Redirigir al Home utilizando el enrutador de React
      } else {
        alert("Error: No se recibió token o información del usuario");
      }
    } catch (error) {
      console.error(error);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md">
            Ingresar
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          ¿No tienes una cuenta?{" "}
          <a
            href="/register"
            className="text-blue-500 hover:underline font-semibold"
          >
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
