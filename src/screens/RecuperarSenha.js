import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./RecuperarSenha.css"; // Estilize conforme o necessário

export const RecuperarSenha = () => {
  const [email, setEmail] = useState("");

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Insira um e-mail válido");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Email de recuperação enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("Usuário não encontrado com este e-mail");
      } else {
        toast.error("Erro ao enviar e-mail. Tente novamente.");
      }
    }
  };

  return (
    <div className="recuperar-container">
      <h2>Recuperar Senha</h2>
      <form onSubmit={handleRecuperarSenha}>
        <input
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Enviar link de recuperação</button>
      </form>
      <p><a href="/login">Voltar para o login</a></p>
      <ToastContainer />
    </div>
  );
};

export default RecuperarSenha;
