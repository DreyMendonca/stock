import React, { useState } from 'react';
import './Cadastro.css';
import { db, auth } from '../firebase'; // Importação do Firebase Auth e Firestore
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import ImagemCadastro from '../images/image-login-cadastro.png';
import LogoImagemLogin from '../images/output-onlinepngtools-logo.png';

export const Cadastro = () => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verificação de senha
        if (formData.senha !== formData.confirmarSenha) {
            alert('As senhas não coincidem');
            return;
        }

        // Validação de e-mail
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            alert('Por favor, insira um e-mail válido');
            return;
        }

        // Validação de senha
        if (formData.senha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            // Criar o usuário no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);

            // Obter o usuário recém-criado
            const user = userCredential.user;

            // Agora, salve os dados do usuário no Firestore
            await addDoc(collection(db, 'usuarios'), {
                usuario: formData.usuario,
                email: formData.email,
                telefone: formData.telefone,
                uid: user.uid // Salvando o UID do usuário para referência
            });

            alert('Cadastro realizado com sucesso!');
            setFormData({
                usuario: '',
                email: '',
                telefone: '',
                senha: '',
                confirmarSenha: ''
            });
        } catch (error) {
            console.error('Erro ao registrar usuário: ', error);
            alert('Erro ao registrar usuário');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Verifique se o usuário já existe no Firestore
            const userExists = await getDocs(collection(db, 'usuarios')).then(snapshot =>
                snapshot.docs.some(doc => doc.data().uid === user.uid)
            );

            if (!userExists) {
                // Salve os dados do usuário no Firestore caso ele seja novo
                await addDoc(collection(db, 'usuarios'), {
                    usuario: user.displayName || 'Usuário Google',
                    email: user.email,
                    telefone: user.phoneNumber || 'Não fornecido',
                    uid: user.uid
                });
            }

            alert('Login com Google realizado com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer login com Google:', error);
            alert('Erro ao fazer login com Google');
        }
    };

    return (
        <div className="register-container" style={{ marginTop: '-40px' }}>
            <div className="register-form">
                <img src={LogoImagemLogin} width={250} />
                <h2>Registro</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="NOME LOJA"
                            name="usuario"
                            value={formData.usuario}
                            onChange={handleChange}
                        />
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="EMAIL"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <i className="fas fa-envelope"></i>
                    </div>
                    <div className="form-group phone-group">
                        <input
                            type="tel"
                            placeholder="TELEFONE"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                        />
                        <i className="fas fa-phone"></i>
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="SENHA"
                            name="senha"
                            value={formData.senha}
                            onChange={handleChange}
                        />
                        <i className="fas fa-lock"></i>
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="CONFIRMAR SENHA"
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
                <div className="google-login">
                    <button className="btn google-btn" onClick={handleGoogleLogin}>
                        <i className="fab fa-google"></i> Entrar com Google
                    </button>
                </div>
            </div>
            <div className="register-image">
                <img src={ImagemCadastro} alt="imagem" />
            </div>
        </div>
    );
};

export default Cadastro;



/*
 import React, { useState } from 'react';
import './Cadastro.css';
import { db, auth } from '../firebase'; // Importação do Firebase Auth e Firestore
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import ImagemCadastro from '../images/image-login-cadastro.png';

export const Cadastro = () => {
    const [formData, setFormData] = useState({
        usuario: '',
        email: '',
        telefone: '',
        senha: '',
        confirmarSenha: ''
    });

    const googleProvider = new GoogleAuthProvider();
    const facebookProvider = new FacebookAuthProvider(); // Provedor de autenticação do Facebook

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verificação de senha
        if (formData.senha !== formData.confirmarSenha) {
            alert('As senhas não coincidem');
            return;
        }

        // Validação de e-mail
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            alert('Por favor, insira um e-mail válido');
            return;
        }

        // Validação de senha
        if (formData.senha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            // Criar o usuário no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);

            // Obter o usuário recém-criado
            const user = userCredential.user;

            // Agora, salve os dados do usuário no Firestore
            await addDoc(collection(db, 'usuarios'), {
                usuario: formData.usuario,
                email: formData.email,
                telefone: formData.telefone,
                uid: user.uid // Salvando o UID do usuário para referência
            });

            alert('Cadastro realizado com sucesso!');
            setFormData({
                usuario: '',
                email: '',
                telefone: '',
                senha: '',
                confirmarSenha: ''
            });
        } catch (error) {
            console.error('Erro ao registrar usuário: ', error);
            alert('Erro ao registrar usuário');
        }
    };

    // Função de login com Google
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Verifique se o usuário já existe no Firestore
            const userExists = await getDocs(collection(db, 'usuarios')).then(snapshot =>
                snapshot.docs.some(doc => doc.data().uid === user.uid)
            );

            if (!userExists) {
                // Salve os dados do usuário no Firestore caso ele seja novo
                await addDoc(collection(db, 'usuarios'), {
                    usuario: user.displayName || 'Usuário Google',
                    email: user.email,
                    telefone: user.phoneNumber || 'Não fornecido',
                    uid: user.uid
                });
            }

            alert('Login com Google realizado com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer login com Google:', error);
            alert('Erro ao fazer login com Google');
        }
    };

    // Função de login com Facebook
    const handleFacebookLogin = async () => {
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;

            // Verifique se o usuário já existe no Firestore
            const userExists = await getDocs(collection(db, 'usuarios')).then(snapshot =>
                snapshot.docs.some(doc => doc.data().uid === user.uid)
            );

            if (!userExists) {
                // Salve os dados do usuário no Firestore caso ele seja novo
                await addDoc(collection(db, 'usuarios'), {
                    usuario: user.displayName || 'Usuário Facebook',
                    email: user.email,
                    telefone: user.phoneNumber || 'Não fornecido',
                    uid: user.uid
                });
            }

            alert('Login com Facebook realizado com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer login com Facebook:', error);
            alert('Erro ao fazer login com Facebook');
        }
    };

    return (
        <div className="register-container">
            <div className="register-form">
                <h2>Registro</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="USUÁRIO"
                            name="usuario"
                            value={formData.usuario}
                            onChange={handleChange}
                        />
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="EMAIL"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <i className="fas fa-envelope"></i>
                    </div>
                    <div className="form-group phone-group">
                        <input
                            type="tel"
                            placeholder="TELEFONE"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                        />
                        <i className="fas fa-phone"></i>
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="SENHA"
                            name="senha"
                            value={formData.senha}
                            onChange={handleChange}
                        />
                        <i className="fas fa-lock"></i>
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="CONFIRMAR SENHA"
                            name="confirmarSenha"
                            value={formData.confirmarSenha}
                            onChange={handleChange}
                        />
                        <i className="fas fa-lock"></i>
                    </div>
                    <button className="register-button" type="submit">Registrar</button>
                    <div className="social-buttons">
                        <button className="btn google-btn" onClick={handleGoogleLogin}>
                            <i className="fab fa-google"></i> Entrar com Google
                        </button>
                        <button className="btn facebook-btn" onClick={handleFacebookLogin}>
                            <i className="fab fa-facebook"></i> Entrar com Facebook
                        </button>
                    </div>
                    <p className="login-link">Já tem uma conta? <a href="/login">Faça Login!</a></p>
                </form>
            </div>
            <div className="register-image">
                <img src={ImagemCadastro} alt="imagem" />
            </div>
        </div>
    );
};

export default Cadastro;

*/