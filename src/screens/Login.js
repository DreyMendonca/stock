import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LoginNovo.css";
import img_login from "../images/img_login (1).svg"
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import LogoEstocaAi from "../images/LogoEstocaAi.svg";

import IconeOlho from "../icones/icone-olho.png"; // Importando o ícone do olho

export const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

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
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      toast.success("Login realizado com sucesso!");
      navigate("/home");
    } catch (error) {
      toast.error("Erro ao fazer login: ", error);
    }
  };

  // const handleGoogleLogin = async () => {
  //     try {
  //         const result = await signInWithPopup(auth, googleProvider);
  //         alert('Login com Google realizado com sucesso!');
  //         navigate('/home');
  //     } catch (error) {
  //         console.error('Erro ao fazer login com Google: ', error);
  //         alert('Erro ao fazer login com Google');
  //     }
  // };

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
            <div class="barra"></div>
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
            {/* <div className="social-buttons">
                        <i className="fab fa-google" onClick={handleGoogleLogin}></i>
                    </div>
                    <div className="google-login">
                        <button className="btn google-btn" onClick={handleGoogleLogin}>
                            <i className="fab fa-google"></i> Entrar com Google
                        </button>
                    </div> */}
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
          Controle seu estoque com um clique,<br />organize seu mundo de negócios!
        </h2>
        <img src={img_login} alt="img_login" />
      </div>
    </div>
  </div>

</div>

    </div>
  );
};

export default Login;
