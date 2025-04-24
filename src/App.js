import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './screens/Home';
import AdicionarProduto from './screens/AdicionarProduto';
import Cadastro from './screens/Cadastro';
import Login from './screens/Login';
import Estoque from './screens/Estoque';
import CadastroUsuarioComum from './screens/CadastroUsuarioComum'; // Novo componente
import AdminRoute from './components/AdminRoute'; // Componente de rota protegida
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
          
          {/* Nova rota protegida para cadastro de usuários comuns */}
          <Route path="/cadastro-usuario" element={
            <AdminRoute>
              <CadastroUsuarioComum />
            </AdminRoute>
          } />
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