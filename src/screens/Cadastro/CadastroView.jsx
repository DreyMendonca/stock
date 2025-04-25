import React from 'react';
import LogoEstocaAi from "../../images/LogoEstocaAi.svg";
import img_login from "../../images/img_login (1).svg";

const CadastroView = ({
  formData,
  handleChange,
  handleSubmit,
  handleGoogleLogin
}) => {
  return (
    <div className="main_conteiner">
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
            <div className="form-group">
              <input
                type="password"
                placeholder="Senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
              />
              <i className="fas fa-lock"></i>
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
            <button className="register-button" type="submit">Registrar</button>
            <div className="social-buttons">
              <i className="fab fa-google" onClick={handleGoogleLogin}></i>
              <i className="fas fa-envelope"></i>
              <i className="fab fa-whatsapp"></i>
            </div>
            <p className="login-link">Já tem uma conta? <a href="/login">Faça Login!</a></p>
          </form>
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
      </div>
    </div>
  );
};

export default CadastroView;
