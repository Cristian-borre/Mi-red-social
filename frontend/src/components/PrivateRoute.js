import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ element }) => {
  const { token, loading } = useAuth(); // Obtenemos el token y el estado de carga del contexto

  if (loading) {
    // Si estamos cargando el contexto, no hacemos nada (esto previene el redireccionamiento inmediato)
    return null;
  }

  if (!token) {
    // Si no hay token (el usuario no está logueado), redirigimos a /login
    return <Navigate to="/login" />;
  }

  return element; // Si hay token, renderizamos el componente pasado como prop
};

export default PrivateRoute;
