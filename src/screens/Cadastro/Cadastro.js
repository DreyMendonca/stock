// pages/Cadastro.js
import React, { useState } from 'react';
import CadastroForm from '.CadastroView';
import '.Cadastro.css';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Cadastro = () => {
  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });

  const googleProvider = new GoogleAuthProvider();

  const mascaraTelefone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      setFormData({ ...formData, [name]: mascaraTelefone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      await addDoc(collection(db, 'usuarios'), {
        usuario: formData.usuario,
        email: formData.email,
        telefone: formData.telefone,
        uid: user.uid
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
      toast.error('Erro ao registrar usuário');
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
        await addDoc(collection(db, 'usuarios'), {
          usuario: user.displayName || 'Usuário Google',
          email: user.email,
          telefone: user.phoneNumber || 'Não fornecido',
          uid: user.uid
        });
      }

      toast.success('Login com Google realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  return (
    <>
      <CadastroForm
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleGoogleLogin={handleGoogleLogin}
      />
      <ToastContainer />
    </>
  );
};

export default Cadastro;
