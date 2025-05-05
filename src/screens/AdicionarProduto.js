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
        precoCusto: '',
        desconto: '',
        quantidade: '',
        sku: '',
        categoria: '',
        validade: '',
        lote: '',
        variantes: [''],
        imagem: ''
    });

    const [user, setUser] = useState(null);
    const [imagem, setImagem] = useState(null);
    const [preview, setPreview] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [mostrarCriarCategoria, setMostrarCriarCategoria] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const handleImageClick = () => {
        setIsZoomed(!isZoomed);  // Alterna o estado de zoom
    };

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduto((prevProduto) => ({
            ...prevProduto,
            [name]: value
        }));
    };

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
                setUser(null);
                navigate('/login');
            })
            .catch((error) => {
                console.error('Erro ao deslogar:', error);
            });
    };

    useEffect(() => {
        const fetchCategorias = async () => {
            if (!user) return;
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
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagem(file);
            setPreview(URL.createObjectURL(file)); // Gera a prévia 😍
        }
    };

    const handleAddProduto = async () => {
        if (!user) {
            alert('Você precisa estar logado para adicionar um produto.');
            if (!produto.precoCusto || isNaN(parseFloat(produto.precoCusto.replace(',', '.'))) || parseFloat(produto.precoCusto.replace(',', '.')) <= 0) {
                erros.push('Preço de custo inválido, verifique se preencheu corretamente.');
            }
            return;
        }

        // Validação das treta antes de subir pro Firebase, mermão do sertão
        const erros = [];

        if (!produto.nome || produto.nome.trim() === '') {
            erros.push('O campo "nome" tá mais vazio que geladeira de estudante.');
        }
        if (!produto.preco || isNaN(parseFloat(produto.preco)) || parseFloat(produto.preco) <= 0) {
            erros.push('Preço inválido, uai! Isso num é número ou tá zero/negativo, cê tá doido?');
        }
        if (!produto.quantidade || isNaN(parseInt(produto.quantidade)) || parseInt(produto.quantidade) <= 0) {
            erros.push('Quantia tá bugada! Bota um número maior que zero, sô.');
        }
        if (!produto.categoria || produto.categoria.trim() === '') {
            erros.push('Categoria sumiu no mapa. Preenche isso aí, visse?');
        }
        if (!produto.validade) {
            erros.push('Tá faltando a data de validade, cabra!');
        } else {
            const hoje = new Date();
            const validade = new Date(produto.validade);
            const umMesDepois = new Date();
            umMesDepois.setMonth(hoje.getMonth() + 1);

            if (validade < umMesDepois) {
                erros.push('A validade tem que ser pelo menos 1 mês pra frente, senão o trem vence rapidim.');
            }
        }
        if (!produto.lote || produto.lote.trim() === '') {
            erros.push('O campo "lote" tá que nem alma penada: invisível.');
        }

        if (!imagem) {
            erros.push('Cadê a foto do bicho, uai? Produto sem imagem é que nem pamonha sem milho.');
        }

        // Cancela o rolê se tiver erro
        if (erros.length > 0) {
            alert(erros.join('\n'));
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
                precoCusto: produto.precoCusto.replace(',', '.'),
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
                validade: '',
                lote: '',
                variantes: [''],
                imagem: ''
            });
            setImagem(null);
        } catch (error) {
            console.error('Erro ao adicionar produto: ', error);
            alert('Erro ao adicionar produto.');
        }
    };
    const getMinValidade = () => {
        const hoje = new Date();
        hoje.setMonth(hoje.getMonth() + 1);

        // Corrigir overflow de dias
        if (hoje.getDate() !== new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getDate()) {
            hoje.setDate(0);
        }

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };




    const handleAdicionarCategoria = async () => {
        const nomeCategoria = novaCategoria.trim();
        if (nomeCategoria) {
            try {
                await addDoc(collection(db, 'categorias'), {
                    nome: nomeCategoria,
                    userId: user.uid
                });

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
            <aside className="sidebar">
                {/* Sidebar conteúdo */}
                <a href='/home'>
                    <img src={LogoSide} style={{ width: '55px', height: 'auto' }} />
                    <span>Estocaí</span>
                </a>

                <a href='/estoque'>
                    <img src={EstoqueSide} style={{ width: '45px', height: 'auto' }} />
                    <span>Estoque</span>
                </a>

                <a href='/adicionarproduto'>
                    <img src={AddSide} style={{ width: '45px', height: 'auto' }} />
                    <span>Adicionar</span>
                </a>

                <a href='/cadastro-usuario'>
                    <img src={FuncionarioSide} style={{ width: '45px', height: 'auto' }} />
                    <span>Funcionário</span>
                </a>

                <a href='#' onClick={handleLogout}>
                    <img src={Logout} style={{ width: '45px', height: 'auto' }} />
                    <span>Sair</span>
                </a>
            </aside>

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
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Preço: R$</label>
                                <input
                                    type="text"
                                    name="preco"
                                    value={produto.preco}
                                    onChange={(e) => {
                                        let valor = e.target.value;

                                        // Remove tudo que não for número
                                        valor = valor.replace(/\D/g, '');

                                        // Transforma em centavos e formata com vírgula
                                        valor = (parseFloat(valor) / 100).toFixed(2);

                                        // Troca o ponto por vírgula (estilo BR)
                                        valor = valor.replace('.', ',');

                                        setProduto({ ...produto, preco: valor });
                                    }}
                                    required
                                />

                            </div>
                        

                        <div className="form-group">
                            <label>Preço de Custo: R$</label>
                            <input
                                type="text"
                                name="precoCusto"
                                value={produto.precoCusto}
                                onChange={(e) => {
                                    let valor = e.target.value;
                                    valor = valor.replace(/\D/g, '');
                                    valor = (parseFloat(valor) / 100).toFixed(2);
                                    valor = valor.replace('.', ',');
                                    setProduto({ ...produto, precoCusto: valor });
                                }}
                                required
                            />
                        </div>
                            {produto.preco && produto.precoCusto && (
                                <p style={{ marginTop: '5px', color: 'green' }}>
                                    Lucro estimado: R$
                                    {(() => {
                                        const precoVenda = parseFloat(produto.preco.replace(',', '.'));
                                        const precoCusto = parseFloat(produto.precoCusto.replace(',', '.'));
                                        const lucro = precoVenda - precoCusto;
                                        return lucro.toFixed(2).replace('.', ',');
                                    })()}
                                </p>
                            )}
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
                                    style={{
                                        MozAppearance: 'textfield',
                                        WebkitAppearance: 'none',
                                        margin: 0
                                    }}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Validade</label>
                                <input
                                    type="date"
                                    name="validade"
                                    value={produto.validade}
                                    onChange={handleChange}
                                    min={getMinValidade()} // <-- ainda formato ISO
                                    required
                                />

                            </div>

                            <div className="form-group">
                                <label>Lote</label>
                                <input
                                    type="text"
                                    name="lote"
                                    value={produto.lote}
                                    onChange={handleChange}
                                    placeholder="Código do lote"
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
                            <div className="upload-section" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label htmlFor="file-upload" className="upload-label">Escolher Arquivo</label>
                                <input id="file-upload" type="file" onChange={handleImageChange} />

                                {preview && (
                                    <img
                                        src={preview}
                                        alt="Prévia da imagem"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={handleImageClick}
                                    />
                                )}
                                {isZoomed && (
                                    <div
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Fundo escurecido
                                            zIndex: 1000,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            cursor: 'zoom-out',
                                        }}
                                        onClick={handleImageClick}  // Fecha o zoom ao clicar na área
                                    >
                                        <img
                                            src={preview}
                                            alt={produto.nome}
                                            style={{
                                                maxWidth: '90%',
                                                maxHeight: '90%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </div>
                                )}
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