// src/screens/Login.jsx
import React from "react";
import "./LoginNovo.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import img_login from "../../images/img_login (1).svg";
import LogoEstocaAi from "../../images/LogoEstocaAi.svg";
import IconeOlho from "../../icones/icone-olho.png";

import { Login } from "./Login";

export const LoginView = () => {
  const {
    email,
    setEmail,
    senha,
    setSenha,
    mostrarSenha,
    toggleMostrarSenha,
    handleLogin,
  } = Login();

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
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              <img
                src={IconeOlho}
                alt="Mostrar/Ocultar Senha"
                className="icone-olho"
                onClick={toggleMostrarSenha}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  width: "24px",
                }}
              />
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
        <div className="conteiner">
          <div className="conteiner_1">
            <div className="conteiner_2">
              <h2>
                Controle seu estoque com um clique,
                <br />
                organize seu mundo de negócios!
              </h2>
              <img src={img_login} alt="img_login" />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginView;
