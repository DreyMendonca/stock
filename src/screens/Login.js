import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LoginNovo.css";

import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import LogoEstocaAi from "../images/LogoEstocaAi.svg";
import { FaEye, FaEyeSlash } from 'react-icons/fa';  // Ícones de olho aberto e fechado
import Carrossel from "./Carrossel";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se o usuário está logado
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home"); // Redireciona para a rota '/home' se o usuário já estiver logado
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Verificar se o formulário é válido
    const form = e.target;
    if (!form.checkValidity()) {
      toast.error("Por favor, preencha todos os campos corretamente!");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      toast.success("Login realizado com sucesso!");
      navigate("/home");
    } catch (error) {
      toast.error("Erro ao fazer login: " + error.message);
    }
  };

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  return (
    <div className="principal">
      <div className="register-container">
        <div className="register-form">
          <div className="logo">
            <img src={LogoEstocaAi} width={150} alt="Logo" />
          </div>
          <div className="login-title">
            <div className="barra"></div>
            <h1>Login</h1>
          </div>
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Por favor, insira um email válido"
              />
              <i className="fas fa-envelope"></i>
            </div>
            <div className="form-group" style={{ position: "relative" }}>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
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
            <button className="register-button" type="submit">
              Entrar
            </button>
            <p className="login-link">
              Não tem uma conta? <a href="/cadastro">Registre-se</a>
            </p>
          </form>
        </div>
      </div>
      <div className="right_side">
        <Carrossel />
      </div>
    </div>
  );
};

export default Login;
