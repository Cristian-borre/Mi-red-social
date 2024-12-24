import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Información del usuario
  const [token, setToken] = useState(null); // Token de autenticación
  const [lastActive, setLastActive] = useState(Date.now()); // Fecha de última actividad
  const [loading, setLoading] = useState(true); // Estado de carga para evitar redirección en el primer renderizado

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);

      // Sincronizar lastActive al recargar la página
      const storedLastActive = localStorage.getItem("lastActive");
      if (storedLastActive) {
        setLastActive(parseInt(storedLastActive, 10)); // Aseguramos que sea un número
      }
    }

    // Verificamos si la sesión está inactiva por más de 1 hora
    const inactivityTimeout = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastActive > 3600000) { // 1 hora
        logout();
      }
    }, 60000); // Cada minuto revisamos la actividad

    // Cuando los datos estén cargados, cambiamos el estado de loading
    setLoading(false);

    return () => clearInterval(inactivityTimeout); // Limpiar cuando el componente se desmonte
  }, [lastActive]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setLastActive(Date.now());
    localStorage.setItem("lastActive", Date.now()); // Guardamos la última actividad en localStorage
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActive"); // Limpiamos lastActive en localStorage
  };

  const updateLastActive = () => {
    setLastActive(Date.now()); // Actualiza la última actividad
    localStorage.setItem("lastActive", Date.now()); // Guardamos la última actividad en localStorage
  };

  if (loading) {
    // Si aún estamos cargando los datos del contexto, mostramos nada (para evitar redirección prematura)
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateLastActive }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
