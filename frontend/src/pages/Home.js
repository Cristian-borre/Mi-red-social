import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar"; // Importar Navbar
import { useAuth } from "../context/AuthContext"; // Importar el contexto de autenticación
import axiosInstance from "../utils/axiosInstance"; // Importar axiosInstance para las peticiones

const Home = () => {
  const { user, updateLastActive } = useAuth(); // Usamos la función para actualizar la última actividad
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" }); // Estado para el formulario de nueva publicación
  const [newComment, setNewComment] = useState({}); // Estado para almacenar los comentarios nuevos
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para manejar la visibilidad del modal

  const inactivityTimeoutRef = useRef(null);

  // Función para obtener los posts desde la API
  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get("/posts");
      setPosts(response.data);
    } catch (err) {
      console.error("Error al obtener los posts", err);
    }
  };

  // Función para manejar el envío de comentarios
  const handleCommentSubmit = async (postId) => {
    const commentText = newComment[postId];
    if (commentText && commentText.trim() === "") return;

    try {
      await axiosInstance.post(`/posts/${postId}/comments`, {
        text: commentText,
      });
      setNewComment((prevComments) => ({
        ...prevComments,
        [postId]: "", // Limpiar el comentario después de enviar
      })); // Limpiar el input después de enviar
      fetchPosts(); // Refrescar los posts después de agregar el comentario
    } catch (err) {
      console.error("Error al enviar comentario", err);
    }
  };

  // Función para manejar las reacciones (like, love, wow, sad, angry)
  const handleReaction = async (postId, reaction) => {
    try {
      await axiosInstance.post(`/posts/${postId}/reactions`, {
        type: reaction,
      });
      fetchPosts(); // Refrescar los posts después de registrar la reacción
    } catch (err) {
      console.error("Error al registrar la reacción", err);
    }
  };

  const handleNewPostSubmit = async () => {
    // Validar que el título y contenido no estén vacíos
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("El título y el contenido son obligatorios.");
      return;
    }

    try {
      await axiosInstance.post("/posts", newPost); // Crear una nueva publicación
      setNewPost({ title: "", content: "" }); // Limpiar el formulario
      fetchPosts(); // Actualizar la lista de publicaciones
      setIsModalOpen(false); // Cerrar el modal después de crear la publicación
    } catch (err) {
      console.error("Error al crear la publicación", err);
    }
  };

  const activityHandler = () => {
    // Limpiar el timeout anterior, si existe
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Establecer un nuevo timeout para ejecutar la acción de inactividad después de 5 segundos
    inactivityTimeoutRef.current = setTimeout(() => {
      updateLastActive(); // Actualizamos la última actividad después de 5 segundos de inactividad
    }, 10000); // 5 segundos de inactividad
  };

  // Efecto para cargar los posts cuando el componente se monta
  useEffect(() => {
    window.addEventListener("mousemove", activityHandler);
    window.addEventListener("keydown", activityHandler);

    fetchPosts(); // Cargar los posts

    return () => {
      // Limpiar los event listeners y el timeout cuando el componente se desmonte
      window.removeEventListener("mousemove", activityHandler);
      window.removeEventListener("keydown", activityHandler);

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [updateLastActive]);

  const countReactions = (reactions, reactionType) => {
    return reactions.filter((reaction) => reaction.type === reactionType).length;
  };

  const handleCommentChange = (postId, value) => {
    setNewComment((prevComments) => ({
      ...prevComments,
      [postId]: value, // Actualizar el comentario para el post específico
    }));
  };

  return (
    <section className="h-screen flex flex-col">
      <Navbar className="flex-none" />
      <div className="grow bg-gray-100 py-8">
        <div className="flex flex-col max-w-3xl h-full mx-auto bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between">
            <h2 className="text-2xl flex-none font-semibold mb-6">Publicaciones</h2>

            {/* Mostrar un botón para abrir el modal si el usuario es admin */}
            {user.role === "admin" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white py-2 px-4 rounded-md mb-6"
              >
                Crear nueva publicación
              </button>
            )}
          </div>

          {/* Modal para crear nueva publicación */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <h3 className="text-xl font-semibold mb-4">Crear nueva publicación</h3>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md mb-2"
                  placeholder="Título"
                  value={newPost.title}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                />
                <textarea
                  className="w-full p-2 border rounded-md mb-2"
                  placeholder="Contenido"
                  value={newPost.content}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsModalOpen(false)} // Cerrar el modal sin guardar cambios
                    className="bg-gray-300 text-black py-2 px-4 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleNewPostSubmit}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md"
                  >
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grow h-0 overflow-y-auto">
            {posts.map((post) => (
              <div key={post._id} className="mb-6 p-4 border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold">{post.title}</h3>
                <p>{post.content}</p>

                {/* Mostrar cantidad de reacciones por tipo (solo si hay más de una) */}
                <div className="mt-4 flex space-x-4 mb-4">
                  {countReactions(post.reactions, "like") > 0 && (
                    <div className="flex items-center">
                      <i className="fas fa-thumbs-up text-blue-500"></i>
                      <span className="ml-2">
                        {countReactions(post.reactions, "like")}
                      </span>
                    </div>
                  )}
                  {countReactions(post.reactions, "love") > 0 && (
                    <div className="flex items-center">
                      <i className="fas fa-heart text-red-500"></i>
                      <span className="ml-2">
                        {countReactions(post.reactions, "love")}
                      </span>
                    </div>
                  )}
                  {countReactions(post.reactions, "wow") > 0 && (
                    <div className="flex items-center">
                      <i className="fas fa-surprise text-green-500"></i>
                      <span className="ml-2">
                        {countReactions(post.reactions, "wow")}
                      </span>
                    </div>
                  )}
                  {countReactions(post.reactions, "sad") > 0 && (
                    <div className="flex items-center">
                      <i className="fas fa-sad-tear text-yellow-500"></i>
                      <span className="ml-2">
                        {countReactions(post.reactions, "sad")}
                      </span>
                    </div>
                  )}
                  {countReactions(post.reactions, "angry") > 0 && (
                    <div className="flex items-center">
                      <i className="fas fa-angry text-red-700"></i>
                      <span className="ml-2">
                        {countReactions(post.reactions, "angry")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reacciones */}
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => handleReaction(post._id, "like")}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <i className="fas fa-thumbs-up"></i> Me gusta
                  </button>
                  <button
                    onClick={() => handleReaction(post._id, "love")}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-heart"></i> Me Encanta
                  </button>
                  <button
                    onClick={() => handleReaction(post._id, "wow")}
                    className="text-green-500 hover:text-green-700"
                  >
                    <i className="fas fa-surprise"></i> Asombroso
                  </button>
                  <button
                    onClick={() => handleReaction(post._id, "sad")}
                    className="text-yellow-500 hover:text-yellow-700"
                  >
                    <i className="fas fa-sad-tear"></i> Triste
                  </button>
                  <button
                    onClick={() => handleReaction(post._id, "angry")}
                    className="text-red-700 hover:text-red-900"
                  >
                    <i className="fas fa-angry"></i> Enfadado
                  </button>
                </div>

                {/* Formulario de comentarios */}
                <div className="mt-4">
                  <textarea
                    className="w-full p-2 border rounded-md mb-2"
                    placeholder="Escribe un comentario..."
                    value={newComment[post._id] || ""}
                    onChange={(e) => handleCommentChange(post._id, e.target.value)}
                  />
                  <button
                    onClick={() => handleCommentSubmit(post._id)}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md"
                  >
                    Comentar
                  </button>
                </div>

                {/* Mostrar comentarios */}
                {post.comments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold">Comentarios</h4>
                    {post.comments.map((comment, index) => (
                      <div key={index} className="p-2 border-b last:border-b-0">
                        {comment.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
