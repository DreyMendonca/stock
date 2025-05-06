import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Header.css'; // <-- import do CSS

const Header = () => {
  const [nomeUsuario, setNomeUsuario] = useState('');

  const fetchNomeUsuario = async (userId) => {
    try {
      const q = query(collection(db, 'usuarios'), where('uid', '==', userId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        setNomeUsuario(doc.data().usuario);
      });
    } catch (error) {
      console.error('Erro ao buscar nome de usuário:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchNomeUsuario(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="header">
      <div className="header__left">
        {nomeUsuario ? `Bem-vindo(a), ${nomeUsuario}!`  : 'Carregando...'}
      </div>


      <div className="header__right">
        <img
          src="https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
          alt="Usuário"
          className="user-icon"
        />
      </div>
    </header>
  );
};

export default Header;
