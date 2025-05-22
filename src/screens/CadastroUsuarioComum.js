import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../helpers/style.css";

const CadastroUsuarioComum = () => {
  const [formData, setFormData] = useState({
    usuario: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });

  const [status, setStatus] = useState({ loading: true, isAdmin: false, error: null });
  const [funcionarios, setFuncionarios] = useState([]);
  const [confirmarExclusao, setConfirmarExclusao] = useState({ mostrar: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setStatus({ loading: false, isAdmin: false, error: "Nenhum usuário autenticado" });
        return;
      }

      try {
        const queryAdmin = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const snapshotAdmin = await getDocs(queryAdmin);

        if (snapshotAdmin.empty) {
          setStatus({ loading: false, isAdmin: false, error: "Perfil de administrador não encontrado" });
          return;
        }

        const adminData = snapshotAdmin.docs[0].data();
        const isAdmin = adminData.role === "admin";
        setStatus({ loading: false, isAdmin, error: null });

        if (isAdmin) {
          const queryFuncionarios = query(collection(db, "usuarios"), where("parentUid", "==", user.uid));
          const snapshotFuncionarios = await getDocs(queryFuncionarios);
          const listaFuncionarios = snapshotFuncionarios.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFuncionarios(listaFuncionarios);
        }
      } catch (error) {
        setStatus({ loading: false, isAdmin: false, error: error.message });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "telefone" ? mascaraTelefone(value) : value,
    }));
  };

  const mascaraTelefone = (value) => {
    return value.replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!status.isAdmin) return toast.error("Permissões insuficientes");
    if (formData.senha !== formData.confirmarSenha) return toast.error("As senhas não coincidem");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Por favor, insira um e-mail válido");
    if (formData.senha.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres");

    try {
      const adminUser = auth.currentUser;
      if (!adminUser) return toast.error("Admin não está logado");

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      await addDoc(collection(db, "usuarios"), {
        usuario: formData.usuario,
        email: formData.email,
        telefone: formData.telefone,
        uid: userCredential.user.uid,
        role: "user",
        parentUid: adminUser.uid,
        criadoEm: new Date(),
      });

      toast.success("Usuário comum criado com sucesso!");
      setFormData({ usuario: "", email: "", telefone: "", senha: "", confirmarSenha: "" });

      const queryFuncionarios = query(collection(db, "usuarios"), where("parentUid", "==", adminUser.uid));
      const snapshotFuncionarios = await getDocs(queryFuncionarios);
      setFuncionarios(snapshotFuncionarios.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      const mensagens = {
        "auth/email-already-in-use": "Este e-mail já está cadastrado",
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres",
      };
      toast.error(mensagens[error.code] || `Erro ao criar usuário: ${error.message}`);
    }
  };

  const alterarRole = async (id, novoRole) => {
    try {
      await updateDoc(doc(db, "usuarios", id), { role: novoRole });
      setFuncionarios(funcionarios.map(f => (f.id === id ? { ...f, role: novoRole } : f)));
      toast.success(`Role do usuário atualizado para ${novoRole}`);
    } catch (error) {
      toast.error("Erro ao alterar o role do usuário");
    }
  };

  const confirmarExclusaoUsuario = async (id) => {
    try {
      await deleteDoc(doc(db, "usuarios", id));
      setFuncionarios(funcionarios.filter(f => f.id !== id));
      toast.success("Usuário excluído com sucesso!");
      setConfirmarExclusao({ mostrar: false, id: null });
    } catch (error) {
      toast.error("Erro ao excluir usuário.");
    }
  };

  if (status.loading) return <div>Verificando permissões e carregando dados...</div>;
  if (status.error) return <div className="container"><h2>Erro</h2><p>{status.error}</p><button onClick={() => navigate("/")}>Voltar</button></div>;
  if (!status.isAdmin) return <div className="container"><h2>Acesso Negado</h2><p>Apenas administradores podem acessar esta página.</p><button onClick={() => navigate("/")}>Voltar</button></div>;

  return (
    <div className="container-funcionario">
      <div className="container-usercomum">
        <h2>Cadastrar Usuário Comum</h2>

        {confirmarExclusao.mostrar && (
          <div className="mensagem-confirmacao">
            <p>Tem certeza que deseja excluir este usuário?</p>
            <div className="botoes-confirmacao">
              <button className="btn-confirmar" onClick={() => confirmarExclusaoUsuario(confirmarExclusao.id)}>Sim</button>
              <button className="btn-cancelar" onClick={() => setConfirmarExclusao({ mostrar: false, id: null })}>Cancelar</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {['usuario', 'email', 'telefone', 'senha', 'confirmarSenha'].map((field) => (
            <div className="form-group" key={field}>
              <input
                type={field.includes("senha") ? "password" : field === "email" ? "email" : field === "telefone" ? "tel" : "text"}
                name={field}
                placeholder={field === 'usuario' ? 'Nome do usuário' : field.charAt(0).toUpperCase() + field.slice(1)}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <button className="register" type="submit">Cadastrar</button>
        </form>
      </div>

      <div className="container-funcionarios">
        <h2>Lista de Funcionários</h2>
        {funcionarios.length > 0 ? (
          <div className="table_config">
            <table className="table_header">
              <thead className="thead_header">
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Permissão</th>
                  <th>Editar</th>
                  <th>Excluir</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map(({ id, usuario, email, telefone, role }) => (
                  <tr key={id}>
                    <td>{usuario}</td>
                    <td>{email}</td>
                    <td>{telefone}</td>
                    <td>{role}</td>
                    <td>
                      <button onClick={() => alterarRole(id, role === "user" ? "admin" : "user")}>{role === "user" ? "Tornar Admin" : "Tornar Comum"}</button>
                    </td>
                    <td>
                      <button className="button-del" onClick={() => setConfirmarExclusao({ mostrar: true, id })}>Excluir Funcionário</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>Nenhum funcionário cadastrado.</p>}
      </div>
    </div>
  );
};

export default CadastroUsuarioComum;