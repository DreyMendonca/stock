import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cadastro.css";
import { db, auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LogoEstocaAi from "../images/LogoEstocaAi.svg";
import Carrossel from "./Carrossel";
import { FaEye, FaEyeSlash } from 'react-icons/fa';  // Ícones de olho aberto e fechado

export const Cadastro = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    usuario: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);  // Estado para controlar a visibilidade da senha
  const googleProvider = new GoogleAuthProvider();

  const mascaraTelefone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "telefone") {
      setFormData({ ...formData, [name]: mascaraTelefone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar se as senhas coincidem
    if (formData.senha !== formData.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    // Verificar se o e-mail é válido
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    // Verificar o comprimento da senha
    if (formData.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.senha
      );

      // Adicionar os dados do usuário ao Firestore
      await addDoc(collection(db, "usuarios"), {
        usuario: formData.usuario,
        email: formData.email,
        telefone: formData.telefone,
        uid: userCredential.user.uid,
        role: "admin",
        parentUid: null,
      });

      toast.success("Admin criado com sucesso!");
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao registrar usuário: ", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Este e-mail já está cadastrado");
      } else {
        toast.error("Erro ao registrar usuário. Tente novamente.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userExists = await getDocs(collection(db, "usuarios")).then(
        (snapshot) => snapshot.docs.some((doc) => doc.data().uid === user.uid)
      );

      if (!userExists) {
        await addDoc(collection(db, "usuarios"), {
          usuario: user.displayName || "Usuário Google",
          email: user.email,
          telefone: user.phoneNumber || "Não fornecido",
          uid: user.uid,
          role: "admin",
          parentUid: null,
        });
      }

      toast.success("Login com Google realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      toast.error("Erro ao fazer login com Google");
    }
  };

  // Função para alternar entre mostrar e esconder a senha
  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  return (
    <div className="main_conteiner">
      {/* Imagem - agora do lado esquerdo */}
      <div className="left_side">
        <Carrossel />
      </div>

      <div className="register-container">
        <div className="register-form">
          <div className="logo">
            <img src={LogoEstocaAi} width={150} alt="Logo" />
          </div>

          <div className="login-title">
            <div className="barra"></div>
            <h1>Cadastro</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Nome da loja"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
              />
              <i className="fas fa-user"></i>
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <i className="fas fa-envelope"></i>
            </div>

            <div className="form-group phone-group">
              <input
                type="tel"
                placeholder="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
              />
              <i className="fas fa-phone"></i>
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
              />
              <i className="fas fa-lock"></i>
              {/* Ícone de olho */}
              <span
                className="icone-olho"
                onClick={toggleMostrarSenha}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Confirmar senha"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
              />
              <i className="fas fa-lock"></i>
            </div>

            <button className="register-button" type="submit">
              Registrar
            </button>

            <div className="social-buttons">
              <i className="fab fa-google" onClick={handleGoogleLogin}></i>
              <i className="fas fa-envelope"></i>
              <i className="fab fa-whatsapp"></i>
            </div>

            <p className="login-link">
              Já tem uma conta? <a href="/login">Faça Login!</a>
            </p>
          </form>
        </div>
      </div>

      {/* Toast Container para exibir as notificações */}
      <ToastContainer />
    </div>
  );
};

export default Cadastro;
