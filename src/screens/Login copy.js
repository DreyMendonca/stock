// import React, { useState } from 'react';
// import './Login.css';
// import { auth } from '../firebase'; // Certifique-se de ter auth exportado do arquivo firebase.js
// import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// import { useNavigate } from 'react-router-dom'; // Usado para navegação após o login bem-sucedido

// export const Login = () => {
//     const [email, setEmail] = useState('');
//     const [senha, setSenha] = useState('');
//     const navigate = useNavigate(); // Para redirecionamento após login bem-sucedido
//     const googleProvider = new GoogleAuthProvider();

//     const handleLogin = async (e) => {
//         e.preventDefault(); // Previne o envio padrão do formulário
//         try {
//             // Realiza o login com email e senha
//             await signInWithEmailAndPassword(auth, email, senha);
//             alert('Login realizado com sucesso!');

//             // Redireciona para a página '/home' após o login bem-sucedido
//             navigate('/home');
//         } catch (error) {
//             console.error('Erro ao fazer login: ', error);
//             alert('Erro ao fazer login. Verifique as credenciais.');
//         }
//     };

//     const handleGoogleLogin = async () => {
//         try {
//             const result = await signInWithPopup(auth, googleProvider);
//             alert('Login com Google realizado com sucesso!');
//             navigate('/home'); // Redireciona para '/home' após o login bem-sucedido
//         } catch (error) {
//             console.error('Erro ao fazer login com Google: ', error);
//             alert('Erro ao fazer login com Google');
//         }
//     };

//     return (
//         <div className="login-container">
//             <div className="login-form">
//                 <h2>Login</h2>
//                 <form onSubmit={handleLogin}> {/* Usando o form para tratar o evento de envio */}
//                     <div className="form-group">
//                         <input
//                             type="email"
//                             placeholder="EMAIL"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                         />
//                         <i className="fas fa-envelope"></i>
//                     </div>
//                     <div className="form-group">
//                         <input
//                             type="password"
//                             placeholder="SENHA"
//                             value={senha}
//                             onChange={(e) => setSenha(e.target.value)}
//                             required
//                         />
//                         <i className="fas fa-lock"></i>
//                     </div>
//                     <button className="login-button" type="submit">
//                         Entrar
//                     </button>
//                 </form>
//                 <div className="google-login">
//                     <button className="btn google-btn" onClick={handleGoogleLogin}>
//                         <i className="fab fa-google"></i> Entrar com Google
//                     </button>
//                 </div>
//                 <p className="register-link">
//                     Não tem uma conta? <a href="/registro">Registre-se</a>
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Login;
