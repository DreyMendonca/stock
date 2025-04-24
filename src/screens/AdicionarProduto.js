import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import './AdicionarProduto.css';
import IconeEstoque from '../icones/iconeEstoque.jpeg';
import IconeAdd from '../icones/iconeAdd.jpeg';
import Logo from '../images/logoSemFundo.png';
import LogoSide from '../images/logoSide.png';
import EstoqueSide from '../images/estoque.png';
import AddSide from '../images/botao-adicionar.png';
import FuncionarioSide from '../images/equipe.png';
import Logout from '../images/logout.png';

export const AdicionarProduto = () => {
    const [produto, setProduto] = useState({
        nome: '',
        preco: '',
        desconto: '',
        quantidade: '',
        sku: '',
        categoria: '',
        variantes: [''],
        imagem: ''
    });

    const [user, setUser] = useState(null);
    const [imagem, setImagem] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [mostrarCriarCategoria, setMostrarCriarCategoria] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduto((prevProduto) => ({
            ...prevProduto,
            [name]: value
        }));
    };


    // Verifica se o usuário está logado
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                alert('Você precisa estar logado para adicionar um produto.');
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

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

    // Busca categorias salvas no Firebase ao carregar o componente
    useEffect(() => {
        const fetchCategorias = async () => {
            if (!user) return; // aguarda o usuário estar carregado
            try {
                const querySnapshot = await getDocs(collection(db, 'categorias'));
                const categoriasFirebase = querySnapshot.docs
                    .filter(doc => doc.data().userId === user.uid)
                    .map(doc => doc.data().nome);
                setCategorias(categoriasFirebase);
            } catch (error) {
                console.error('Erro ao buscar categorias:', error);
            }
        };

        fetchCategorias();
    }, [user]); // <--- Importante adicionar user como dependência


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagem(file);
        }
    };

    const handleAddProduto = async () => {
        if (!user) {
            alert('Você precisa estar logado para adicionar um produto.');
            return;
        }

        try {
            let imagemUrl = '';
            if (imagem) {
                const imagemRef = ref(storage, `produtos/${imagem.name}`);
                const snapshot = await uploadBytes(imagemRef, imagem);
                imagemUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'produtos'), {
                ...produto,
                imagem: imagemUrl,
                userId: user.uid
            });

            await addDoc(collection(db, 'historicoEntradas'), {
                nome: produto.nome,
                quantidade: parseInt(produto.quantidade),
                userId: user.uid,
                data: new Date()
            });


            alert('Produto adicionado com sucesso!');
            setProduto({
                nome: '',
                preco: '',
                desconto: '',
                quantidade: '',
                sku: '',
                categoria: '',
                variantes: [''],
                imagem: ''
            });
            setImagem(null);
        } catch (error) {
            console.error('Erro ao adicionar produto: ', error);
            alert('Erro ao adicionar produto.');
        }
    };

    const handleAdicionarCategoria = async () => {
        const nomeCategoria = novaCategoria.trim();
        if (nomeCategoria) {
            try {
                // Salva no Firebase
                await addDoc(collection(db, 'categorias'), {
                    nome: nomeCategoria,
                    userId: user.uid
                });


                // Atualiza localmente
                setCategorias([...categorias, nomeCategoria]);
                setProduto({ ...produto, categoria: nomeCategoria });
                setNovaCategoria('');
                setMostrarCriarCategoria(false);
            } catch (error) {
                console.error('Erro ao salvar categoria:', error);
                alert('Erro ao salvar a categoria.');
            }
        }
    };

    return (
        <div className="container-default">
          

            <div className="product-form-container">
                <div className="form-section">
                    <div className="form-header">
                        <h2>Adicionar Produto</h2>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nome do Produto</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={produto.nome}
                                    onChange={handleChange}
                                    placeholder="Nome do Produto"
                                />
                            </div>
                            <div className="form-group">
                                <label>Preço: R$</label>
                                <input
                                    type="text"
                                    name="preco"
                                    value={produto.preco}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Desconto: %</label>
                                <input
                                    type="text"
                                    name="desconto"
                                    value={produto.desconto}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    type="number"
                                    name="quantidade"
                                    value={produto.quantidade}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>SKU (Opcional)</label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={produto.sku}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select
                                    className='select-cat'
                                    name="categoria"
                                    value={produto.categoria}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categorias.map((cat, index) => (
                                        <option key={index} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className='btn-group'>
                            <div className="upload-section">
                                <label htmlFor="file-upload" className="upload-label">Escolher Arquivo</label>
                                <input id="file-upload" type="file" onChange={handleImageChange} />
                            </div>
                            <div className='btn-header'>
                                <button
                                    className="btn criar-categoria-btn"
                                    onClick={() => setMostrarCriarCategoria(true)}
                                >
                                    Criar nova categoria
                                </button>

                                {mostrarCriarCategoria && (
                                    <div className="form-group nova-categoria">
                                        <label>Nova Categoria</label>
                                        <div className="nova-cat-row">
                                            <input
                                                type="text"
                                                value={novaCategoria}
                                                onChange={(e) => setNovaCategoria(e.target.value)}
                                                placeholder="Nome da nova categoria"
                                            />
                                            <button className="btn add-cat" onClick={handleAdicionarCategoria}>
                                                Adicionar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button className="btn add-product-btn" onClick={handleAddProduto}>
                                    Adicionar Produto
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdicionarProduto;