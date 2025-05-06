import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Home from './screens/Home';
import AdicionarProduto from './screens/AdicionarProduto';
import Cadastro from './screens/Cadastro';
import Login from './screens/Login';
import Estoque from './screens/Estoque';
import CadastroUsuarioComum from './screens/CadastroUsuarioComum';
import AdminRoute from './components/AdminRoute';
import MainLayout from './screens/MainLayout';


import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/Login" />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Cadastro" element={<Cadastro />} />
          
          {/* Rota privada */}
          <Route
            path="/home"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/AdicionarProduto"
            element={
              <MainLayout>
                <AdicionarProduto />
              </MainLayout>
            }
          />
          <Route
            path="/Estoque"
            element={
              <MainLayout>
                <Estoque />
              </MainLayout>
            }
          />
          <Route
            path="/cadastro-usuario"
            element={
              <AdminRoute>
                <MainLayout>
                  <CadastroUsuarioComum />
                </MainLayout>
              </AdminRoute>
            }
          />
        </Routes>
      </Router>

      {/* Toast para notificações */}
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
