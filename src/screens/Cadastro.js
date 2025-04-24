import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Adicione esta linha
import './Cadastro.css';
import { db, auth } from '../firebase'; // Importação do Firebase Auth e Firestore
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, getDocs, getDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LogoEstocaAi from "../images/LogoEstocaAi.svg";
import img_login from "../images/img_login (1).svg";

export const Cadastro = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        usuario: '',
        email: '',
        telefone: '',
        senha: '',
        confirmarSenha: ''
    });

    const googleProvider = new GoogleAuthProvider();

    // Função para formatar o número de telefone
    const mascaraTelefone = (value) => {
        return value
            .replace(/\D/g, '') // Remove tudo o que não for número
            .replace(/^(\d{2})(\d)/, '($1) $2') // Adiciona o parênteses e o espaço
            .replace(/(\d{5})(\d)/, '$1-$2') // Adiciona o hífen
            .substring(0, 15); // Limita a 15 caracteres
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Aplica a máscara no telefone
        if (name === 'telefone') {
            setFormData({ ...formData, [name]: mascaraTelefone(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    /*
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Verificações existentes (mantenha todas)
        if (formData.senha !== formData.confirmarSenha) {
            toast.error('As senhas não coincidem');
            return;
        }
    
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error('Por favor, insira um e-mail válido');
            return;
        }
    
        if (formData.senha.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }
    
        try {
            // Criação do usuário (mantido igual)
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
            const user = userCredential.user;
    
            // Adicionando role 'admin' por padrão e parentUid null
            await addDoc(collection(db, 'usuarios'), {
                usuario: formData.usuario,
                email: formData.email,
                telefone: formData.telefone,
                uid: user.uid,
                role: 'admin', // Adicionado
                parentUid: null // Adicionado
            });

            toast.success('Cadastro realizado com sucesso!');
            setFormData({
                usuario: '',
                email: '',
                telefone: '',
                senha: '',
                confirmarSenha: ''
            });
        } catch (error) {
            console.error('Erro ao registrar usuário: ', error);
            // Mensagens de erro mais específicas
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Este e-mail já está cadastrado');
            } else {
                toast.error('Erro ao registrar usuário');
            }
        }
    };
    */

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Verificações existentes (mantenha todas)
        if (formData.senha !== formData.confirmarSenha) {
            toast.error('As senhas não coincidem');
            return;
        }
    
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error('Por favor, insira um e-mail válido');
            return;
        }
    
        if (formData.senha.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }
    
        try {
            // 1. Cria o usuário admin no Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.senha
            );
            
            // 2. Salva os dados no Firestore
            await addDoc(collection(db, 'usuarios'), {
                usuario: formData.usuario,
                email: formData.email,
                telefone: formData.telefone,
                uid: userCredential.user.uid,
                role: 'admin',
                parentUid: null
            });
    
            toast.success('Admin criado com sucesso!');
            
            // 3. Desloga e redireciona para login
            await auth.signOut();
            navigate('/login');
            
        } catch (error) {
            console.error('Erro ao registrar usuário: ', error);
            // Mensagens de erro mais específicas
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Este e-mail já está cadastrado');
            } else {
                toast.error('Erro ao registrar usuário');
            }
        }
    };

    const criarUsuarioComum = async (userData) => {
        try {
            // Verifica se quem está criando é um admin
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('Você precisa estar logado para criar um usuário');
                return;
            }
    
            // Verifica no Firestore se o criador é admin
            const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
                toast.error('Apenas administradores podem criar usuários comuns');
                return;
            }
    
            // Validações
            if (userData.senha.length < 6) {
                toast.error('A senha deve ter pelo menos 6 caracteres');
                return;
            }
    
            // Cria o usuário comum
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.senha
            );
            
            const newUser = userCredential.user;
    
            // Salva com role 'user' e parentUid do admin criador
            await addDoc(collection(db, 'usuarios'), {
                usuario: userData.usuario,
                email: userData.email,
                telefone: userData.telefone,
                uid: newUser.uid,
                role: 'user',
                parentUid: currentUser.uid
            });
    
            toast.success('Usuário comum criado com sucesso!');
            return newUser.uid;
        } catch (error) {
            console.error('Erro ao criar usuário comum:', error);
            
            // Tratamento de erros específicos
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Este e-mail já está cadastrado');
            } else if (error.code === 'auth/weak-password') {
                toast.error('A senha deve ter pelo menos 6 caracteres');
            } else {
                toast.error('Erro ao criar usuário comum: ' + error.message);
            }
            
            throw error;
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
    
            const userExists = await getDocs(collection(db, 'usuarios')).then(snapshot =>
                snapshot.docs.some(doc => doc.data().uid === user.uid)
            );
    
            if (!userExists) {
                // Novo usuário via Google vira admin por padrão
                await addDoc(collection(db, 'usuarios'), {
                    usuario: user.displayName || 'Usuário Google',
                    email: user.email,
                    telefone: user.phoneNumber || 'Não fornecido',
                    uid: user.uid,
                    role: 'admin', // Adicionado
                    parentUid: null // Adicionado
                });
            }
    
            toast.success('Login com Google realizado com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer login com Google:', error);
            toast.error('Erro ao fazer login com Google');
        }
    };

    return (
        <div className="main_conteiner">
            <div className="register-container" >
                <div className="register-form">
                    <div className="logo">
                        <img src={LogoEstocaAi} width={150} alt="Logo" />
                    </div>

                    <div className="login-title">
                        <div class="barra"></div>
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
                            <i className="fab fa-google"></i>
                            <i className="fas fa-envelope"></i>
                            <i className="fab fa-whatsapp"></i>
                        </div>

                        <p className="login-link">Já tem uma conta? <a href="/login">Faça Login!</a></p>
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
        </div>
    );
};

export default Cadastro;