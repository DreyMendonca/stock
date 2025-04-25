import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './screens/Home';
import AdicionarProduto from './screens/AdicionarProduto/UseAdicionarProdutoView';
import Cadastro from './screens/Cadastro/CadastroView';
import Login from './screens/Login/LoginView';
import Estoque from './screens/Estoque/EstoqueView';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Redireciona '/' para '/Login' */}
          <Route path="/" element={<Navigate to="/Login" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/AdicionarProduto" element={<AdicionarProduto />} />
          <Route path="/Cadastro" element={<Cadastro />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Estoque" element={<Estoque />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
