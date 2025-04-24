import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
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
    
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const handleLogout = () => {
        auth.signOut()
        .then(() => {
            console.log('Usuário deslogado com sucesso');
            setUser(null); // Se você precisar limpar o estado local do usuário
            navigate('/login'); // Redireciona para a página /login
        })
        .catch((error) => {
            console.error('Erro ao deslogar:', error);
        });
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('UID do Auth:', user.uid);
                
                try {
                    const querySnapshot = await getDocs(
                        query(
                            collection(db, 'usuarios'),
                            where('uid', '==', user.uid)
                        )
                    );
                    
                    if (!querySnapshot.empty) {
                        const userData = querySnapshot.docs[0].data();
                        console.log('Dados encontrados:', userData);
                        setStatus({
                            loading: false,
                            isAdmin: userData.role === 'admin',
                            error: null
                        });
                    } else {
                        console.log('Nenhum documento com este UID');
                        setStatus({
                            loading: false,
                            isAdmin: false,
                            error: 'Perfil de usuário não encontrado'
                        });
                    }
                } catch (error) {
                    console.error('Erro ao buscar usuário:', error);
                    setStatus({
                        loading: false,
                        isAdmin: false,
                        error: error.message
                    });
                }
            } else {
                setStatus({ 
                    loading: false, 
                    isAdmin: false,
                    error: 'Nenhum usuário autenticado'
                });
            }
        });
    
        return () => unsubscribe();
    }, []);

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
        
        if (!status.isAdmin) {
            toast.error('Permissões insuficientes');
            return;
        }
    
        // Validações
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
            // 1. Pegue o UID do admin ANTES de criar o novo usuário
            const adminUser = auth.currentUser;
            console.log('[DEBUG] UID do Admin que está criando o usuário:', adminUser.uid);

            if (!adminUser) {
                toast.error('Admin não está logado');
                return;
            }
    
            // 2. Cria o usuário comum
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.senha
            );
            
            console.log('[DEBUG] UID do novo usuário criado:', userCredential.user.uid);
            // 3. Salva os dados com o parentUid correto
            await addDoc(collection(db, 'usuarios'), {
                usuario: formData.usuario,
                email: formData.email,
                telefone: formData.telefone,
                uid: userCredential.user.uid,
                role: 'user',
                parentUid: adminUser.uid, // Usando o UID do admin logado
                criadoEm: new Date()
            });
    
            toast.success('Usuário comum criado com sucesso!');
            
            // 4. Mantém o admin logado e redireciona
            navigate('/home');
            
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

    if (status.loading) {
        return <div>Verificando permissões...</div>;
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
        <div className="container-default">
            <aside className="sidebar">
                {/* Sidebar conteúdo */}
                <a href='/home'>
                    <img src={LogoSide} style={{ width: '55px', height: 'auto' }}/>
                    <span>Estocaí</span>
                </a>
                
                <a href='/estoque'>                
                    <img src={EstoqueSide} style={{ width: '45px', height: 'auto' }}/>
                    <span>Estoque</span>
                </a>

                <a href='/adicionarproduto'>               
                    <img src={AddSide} style={{ width: '45px', height: 'auto' }}/>
                    <span>Adicionar</span>
                </a>

                <a href='/cadastro-usuario'>               
                    <img src={FuncionarioSide} style={{ width: '45px', height: 'auto' }}/>
                    <span>Funcionário</span>
                </a>

                <a href='#' onClick={handleLogout}>               
                    <img src={Logout} style={{ width: '45px', height: 'auto' }}/>
                    <span>Sair</span>
                </a>
            </aside>

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
        </div>
    );
};

export default CadastroUsuarioComum;