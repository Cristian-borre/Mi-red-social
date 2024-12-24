import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import socket from "../services/socket";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";

const Chat = () => {
  const { user } = useAuth(); // Acceder al usuario desde el contexto
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]); // Lista de usuarios con los que admin ha conversado
  const [currentChat, setCurrentChat] = useState(null); // Usuario con el que el admin está chateando

  // Ref para el contenedor de mensajes
  const messagesEndRef = useRef(null);

  // useEffect que se ejecuta solo cuando el componente se monta
  useEffect(() => {
    if (user.role === "admin") {
      // Función para cargar los mensajes históricos solo una vez al cargar el componente
      const loadMessages = async () => {
        try {
          // Obtener todos los mensajes del admin
          const response = await axiosInstance.get(`/messages/${user.username}`);
          setMessages(response.data); // Cargar todos los mensajes históricos del admin

          // Extraer los usuarios con los que el admin ha tenido conversación
          const usersInConversations = response.data
            .map((msg) => {return msg.sender !== "Admin" ? msg.sender : msg.recipient}); // Extraer el nombre del sender

          // Filtrar usuarios únicos
          const uniqueUsers = [...new Set(usersInConversations)];
          setUsers(uniqueUsers); // Actualizar el estado con la lista de usuarios
        } catch (error) {
          console.error("Error al obtener los mensajes:", error);
        }
      };

      loadMessages(); // Llamar la función para cargar los mensajes al iniciar
    }
  }, [user]); // Solo ejecutarse cuando el usuario se carga (es admin)

  useEffect(() => {
    // Registrar el usuario al conectar
    if (user) {
      socket.emit("register", { username: user.username });
    }
  
    // Manejar mensajes entrantes
    const handleMessage = (newMessage) => {
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    };
  
    socket.on("receive_message", handleMessage);
  
    return () => {
      // Limpiar los eventos al desmontar el componente
      socket.off("receive_message", handleMessage);
    };
  }, [user]);

  // useEffect que se ejecuta cuando currentChat cambia (para cargar mensajes específicos de un usuario)
  useEffect(() => {
    if (user.role !== "admin") {
      setCurrentChat("Admin")
    }

    if (currentChat && messages.length === 0) {
      const loadMessagesForChat = async () => {
        try {
          const response = await axiosInstance.get(`/messages/${user.username}/${currentChat}`);
          setMessages(response.data);
        } catch (error) {
          console.error("Error al obtener los mensajes:", error);
        }
      };

      loadMessagesForChat();
    }
  }, [currentChat, user]); // Este useEffect depende de currentChat y messages

  // useEffect para hacer scroll al final cada vez que se agregan mensajes
  useEffect(() => {
    // Desplazar el contenedor de mensajes hacia el final
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Solo se ejecuta cuando los mensajes cambian

  const sendMessage = async () => {
    if (message.trim()) {
      const newMessage = {
        sender: user.username,
        recipient: currentChat,
        content: message,
        _id: uuidv4(),
      };

      try {
        // Enviar el mensaje usando la API (y también se guardará en la base de datos)
        await axiosInstance.post("/messages", newMessage);

        // Emitir el mensaje en tiempo real
        socket.emit("register", { username: user.username });
        
        if (socket.connected) {
          socket.emit("send_message", newMessage);
        } else {
          console.error("El socket no está conectado.");
        }

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessage(""); // Limpiar el campo de mensaje
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
      }
    }
  };

  const selectUser = (selectedUser) => {
    setCurrentChat(selectedUser); // Admin selecciona un usuario
    setMessages([]); // Limpiar los mensajes previos del chat anterior
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-y-none">
      {user.role === "admin" ? (
        <div className="flex">
          <div className="w-1/4 h-screen bg-white p-4 border-r">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Usuarios</h2>
            {users.length > 0 ? (
              <ul className="space-y-2">
                {users.map((usr) => (
                  <li
                    key={usr}
                    className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                      currentChat === usr
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => selectUser(usr)}
                  >
                    <span className="truncate">{usr}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No hay usuarios con los que hayas conversado.</div>
            )}
          </div>

          <div className="flex-1 p-4">
            {currentChat ? (
              <div className="flex flex-col h-full">
                <h2 className="text-2xl font-semibold mb-4">{currentChat}</h2>
                <hr className="bg-black" />
                <div className="grow h-0 p-4 space-y-2 overflow-y-scroll">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`p-3 rounded-lg max-w-xs ${msg.sender === user.username ? "bg-blue-500 text-white ml-auto" : "bg-gray-300 text-black"}`}
                    >
                      <span className="font-semibold">{msg.sender}:</span> {msg.content}
                    </div>
                  ))}
                  {/* Ref para mantener el scroll al final */}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white flex">
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                  />
                  <button
                    onClick={sendMessage}
                    className="ml-2 p-2 bg-blue-500 text-white rounded-md"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-xl font-semibold">
                Selecciona un usuario para iniciar el chat
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold ml-3 my-4">Admin</h2>
            <hr className="bg-black" />
            <div className="grow h-0 p-4 space-y-2 overflow-y-scroll">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-3 rounded-lg max-w-xs ${msg.sender === user.username ? "bg-blue-500 text-white ml-auto" : "bg-gray-300 text-black"}`}
                >
                  <span className="font-semibold">{msg.sender}:</span> {msg.content}
                </div>
              ))}
              {/* Ref para mantener el scroll al final */}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex-none">
              <div className="p-4 bg-white flex">
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                />
                <button
                  onClick={sendMessage}
                  className="ml-2 p-2 bg-blue-500 text-white rounded-md"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
