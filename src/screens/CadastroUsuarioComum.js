import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import LogoSide from '../images/logoSide.png';
import EstoqueSide from '../images/estoque.png';
import AddSide from '../images/botao-adicionar.png';
import FuncionarioSide from '../images/equipe.png';
import Logout from '../images/logout.png';

const CadastroUsuarioComum = () => {
    const [formData, setFormData] = useState({
        usuario: '',
        email: '',
        telefone: '',
        senha: '',
        confirmarSenha: ''
    });

    const [status, setStatus] = useState({
        loading: true,
        isAdmin: false,
        error: null
    });

    const [funcionarios, setFuncionarios] = useState([]);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const handleLogout = () => {
        auth.signOut()
            .then(() => {
                console.log('Usuário deslogado com sucesso');
                setUser(null);
                navigate('/login');
            })
            .catch((error) => {
                console.error('Erro ao deslogar:', error);
            });
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const queryAdmin = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
                    const snapshotAdmin = await getDocs(queryAdmin);

                    if (!snapshotAdmin.empty) {
                        const adminData = snapshotAdmin.docs[0].data();
                        setStatus({ loading: false, isAdmin: adminData.role === 'admin', error: null });

                        if (adminData.role === 'admin') {
                            // Buscar todos os usuários que têm o UID do admin como parentUid
                            const queryFuncionarios = query(
                                collection(db, 'usuarios'),
                                where('parentUid', '==', user.uid)
                            );
                            const snapshotFuncionarios = await getDocs(queryFuncionarios);
                            const listaFuncionarios = snapshotFuncionarios.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setFuncionarios(listaFuncionarios);
                        }
                    } else {
                        setStatus({ loading: false, isAdmin: false, error: 'Perfil de administrador não encontrado' });
                    }
                } catch (error) {
                    console.error('Erro ao buscar dados do administrador ou funcionários:', error);
                    setStatus({ loading: false, isAdmin: false, error: error.message });
                }
            } else {
                setStatus({ loading: false, isAdmin: false, error: 'Nenhum usuário autenticado' });
            }
        });

        return () => unsubscribe();
    }, []);

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

        if (!status.isAdmin) {
            toast.error('Permissões insuficientes');
            return;
        }

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
            const adminUser = auth.currentUser;
            console.log('[DEBUG] UID do Admin que está criando o usuário:', adminUser.uid);

            if (!adminUser) {
                toast.error('Admin não está logado');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.senha
            );

            console.log('[DEBUG] UID do novo usuário criado:', userCredential.user.uid);
            await addDoc(collection(db, 'usuarios'), {
                usuario: formData.usuario,
                email: formData.email,
                telefone: formData.telefone,
                uid: userCredential.user.uid,
                role: 'user',
                parentUid: adminUser.uid,
                criadoEm: new Date()
            });

            toast.success('Usuário comum criado com sucesso!');
            setFormData({ usuario: '', email: '', telefone: '', senha: '', confirmarSenha: '' }); // Limpa o formulário
            // Recarrega a lista de funcionários após a criação
            const queryFuncionarios = query(
                collection(db, 'usuarios'),
                where('parentUid', '==', adminUser.uid)
            );
            const snapshotFuncionarios = await getDocs(queryFuncionarios);
            const listaFuncionarios = snapshotFuncionarios.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFuncionarios(listaFuncionarios);

        } catch (error) {
            console.error('Erro ao criar usuário:', error);

            if (error.code === 'auth/email-already-in-use') {
                toast.error('Este e-mail já está cadastrado');
            } else if (error.code === 'auth/weak-password') {
                toast.error('A senha deve ter pelo menos 6 caracteres');
            } else {
                toast.error('Erro ao criar usuário: ' + error.message);
            }
        }
    };

    const alterarRole = async (id, novoRole) => {
        try {
            const funcionarioRef = doc(db, 'usuarios', id);
            await updateDoc(funcionarioRef, {
                role: novoRole
            });
            // Atualiza a lista localmente para refletir a mudança
            setFuncionarios(funcionarios.map(funcionario =>
                funcionario.id === id ? { ...funcionario, role: novoRole } : funcionario
            ));
            toast.success(`Role do usuário atualizado para ${novoRole}`);
        } catch (error) {
            console.error('Erro ao alterar o role do usuário:', error);
            toast.error('Erro ao alterar o role do usuário');
        }
    };

    const excluirUsuario = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                const usuarioRef = doc(db, 'usuarios', id);
                await deleteDoc(usuarioRef);
                // Atualiza a lista localmente para refletir a exclusão
                setFuncionarios(funcionarios.filter(funcionario => funcionario.id !== id));
                toast.success('Usuário excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                toast.error('Erro ao excluir usuário.');
            }
        }
    };

    if (status.loading) {
        return <div>Verificando permissões e carregando dados...</div>;
    }

    if (status.error) {
        return (
            <div className="container">
                <h2>Erro</h2>
                <p>{status.error}</p>
                <button onClick={() => navigate('/')}>Voltar</button>
            </div>
        );
    }

    if (!status.isAdmin) {
        return (
            <div className="container">
                <h2>Acesso Negado</h2>
                <p>Apenas administradores podem acessar esta página.</p>
                <button onClick={() => navigate('/')}>Voltar</button>
            </div>
        );
    }

    return (
        <div className="container-funcionario">
            <div className="container-usercomum">
                <h2>Cadastrar Usuário Comum</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            name="usuario"
                            placeholder="Nome do usuário"
                            value={formData.usuario}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="E-mail"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="tel"
                            name="telefone"
                            placeholder="Telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            name="senha"
                            placeholder="Senha"
                            value={formData.senha}
                            onChange={handleChange}
                            minLength="6"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            name="confirmarSenha"
                            placeholder="Confirmar Senha"
                            value={formData.confirmarSenha}
                            onChange={handleChange}
                            required
                        />
                    </div>

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
                                {funcionarios.map(funcionario => (
                                    <tr key={funcionario.id}>
                                        <td>{funcionario.usuario}</td>
                                        <td>{funcionario.email}</td>
                                        <td>{funcionario.telefone}</td>
                                        <td>{funcionario.role}</td>
                                        <td>
                                            {funcionario.role === 'user' ? (
                                                <button onClick={() => alterarRole(funcionario.id, 'admin')}>Tornar Admin</button>
                                            ) : (
                                                <button onClick={() => alterarRole(funcionario.id, 'user')}>Tornar Comum</button>
                                            )}
                                        </td>
                                        <td>
                                            <button className="button-del" onClick={() => excluirUsuario(funcionario.id)}>Excluir Funcionário</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Nenhum funcionário cadastrado.</p>
                )}
            </div>
        </div>
    );
};

export default CadastroUsuarioComum;