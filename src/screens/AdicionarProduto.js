import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import './AdicionarProduto.css';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

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

  const handleAddProduto = async () => {
    if (!user) {
      alert('Você precisa estar logado para adicionar um produto.');
      return;
    }

    // Validação dos dados do produto
    const erros = [];
    if (!produto.nome || produto.nome.trim() === '') {
      erros.push('O campo "nome" é obrigatório.');
    }
    if (!produto.preco || isNaN(parseFloat(produto.preco)) || parseFloat(produto.preco) <= 0) {
      erros.push('O preço deve ser um número maior que zero.');
    }
    if (!produto.precoCusto || isNaN(parseFloat(produto.precoCusto.replace(',', '.'))) || parseFloat(produto.precoCusto.replace(',', '.')) <= 0) {
      erros.push('O preço de custo deve ser um número maior que zero.');
    }
    if (!produto.quantidade || isNaN(parseInt(produto.quantidade)) || parseInt(produto.quantidade) <= 0) {
      erros.push('A quantidade deve ser um número inteiro maior que zero.');
    }
    if (!produto.categoria || produto.categoria.trim() === '') {
      erros.push('A categoria é obrigatória.');
    }
    if (!produto.validade) {
      erros.push('A data de validade é obrigatória.');
    } else {
      const hoje = new Date();
      const validade = new Date(produto.validade);
      const umMesDepois = new Date();
      umMesDepois.setMonth(hoje.getMonth() + 1);
      if (validade < umMesDepois) {
        erros.push('A validade deve ser de pelo menos 1 mês a partir de hoje.');
      }
    }
    if (!produto.lote || produto.lote.trim() === '') {
      erros.push('O lote é obrigatório.');
    }
    if (!imagem) {
      erros.push('A imagem do produto é obrigatória.');
    }

    if (erros.length > 0) {
      alert(erros.join('\n'));
      return;
    }

    try {
      setIsLoading(true);
      let imagemUrl = '';

      if (imagem) {
        const imagemRef = ref(storage, `produtos/${imagem.name}`);
        const snapshot = await uploadBytes(imagemRef, imagem);
        imagemUrl = await getDownloadURL(snapshot.ref);
      }

      const userDoc = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', user.uid)));
      let produtoUserId = user.uid; // Valor padrão: UID do usuário logado

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.parentUid !== null) {
          // Se parentUid não for null, o usuário é comum, então usamos o parentUid
          produtoUserId = userData.parentUid;
        }
      } else {
        console.error('Informações do usuário não encontradas ao adicionar produto.');
        alert('Erro ao adicionar produto: informações do usuário não encontradas.');
        setIsLoading(false);
        return; // Importante sair da função se não encontrarmos o usuário
      }

      await addDoc(collection(db, 'produtos'), {
        ...produto,
        precoCusto: produto.precoCusto.replace(',', '.'),
        imagem: imagemUrl,
        userId: produtoUserId // Usando o userId determinado
      });

      await addDoc(collection(db, 'historicoEntradas'), {
        nome: produto.nome,
        quantidade: parseInt(produto.quantidade),
        userId: produtoUserId, // Usando o mesmo userId para o histórico
        data: new Date()
      });

      alert('Produto adicionado com sucesso!');
      setProduto({
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
      setImagem(null);
      setPreview(null);
    } catch (error) {
      console.error('Erro ao adicionar produto: ', error);
      alert('Erro ao adicionar produto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);  // Alterna o estado de zoom
  };

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
        const userDoc = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', user.uid)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          let categoriasQuery;

          if (userData.parentUid === null) {
            // Usuário é um administrador, busca categorias pelo próprio UID
            categoriasQuery = query(collection(db, "categorias"), where("userId", "==", user.uid));
          } else {
            // Usuário é comum, busca categorias pelo parentUid (UID do admin que o criou)
            categoriasQuery = query(collection(db, "categorias"), where("userId", "==", userData.parentUid));
          }

          const snapshot = await getDocs(categoriasQuery);
          const categoriasFiltradas = snapshot.docs.map((doc) => doc.data().nome);
          setCategorias(categoriasFiltradas);
        } else {
          console.error("Informações do usuário não encontradas ao buscar categorias.");
          setCategorias([]);
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        setCategorias([]);
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
        const userDoc = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', user.uid)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const categoriaUserId = userData.parentUid === null ? user.uid : userData.parentUid;

          await addDoc(collection(db, 'categorias'), {
            nome: nomeCategoria,
            userId: categoriaUserId
          });

          setCategorias([...categorias, nomeCategoria]);
          setProduto({ ...produto, categoria: nomeCategoria });
          setNovaCategoria('');
          setMostrarCriarCategoria(false);
        } else {
          console.error('Informações do usuário não encontradas ao salvar categoria.');
          alert('Erro ao salvar a categoria: informações do usuário não encontradas.');
        }
      } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        alert('Erro ao salvar a categoria.');
      }
    }
  };

  return (
    <div className="form-section pag-add-product">
      <div className="add_name">
        <h2>Adicionar Produto</h2>
      </div>

      <div className="form-header">
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
                valor = valor.replace(/\D/g, "");

                // Transforma em centavos e formata com vírgula
                valor = (parseFloat(valor) / 100).toFixed(2);

                // Troca o ponto por vírgula (estilo BR)
                valor = valor.replace(".", ",");

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
                valor = valor.replace(/\D/g, "");
                valor = (parseFloat(valor) / 100).toFixed(2);
                valor = valor.replace(".", ",");
                setProduto({ ...produto, precoCusto: valor });
              }}
              required
            />
          </div>
          {produto.preco && produto.precoCusto && (
            <p style={{ marginTop: "5px", color: "green" }}>
              Lucro estimado: R$
              {(() => {
                const precoVenda = parseFloat(
                  produto.preco.replace(",", ".")
                );
                const precoCusto = parseFloat(
                  produto.precoCusto.replace(",", ".")
                );
                const lucro = precoVenda - precoCusto;
                return lucro.toFixed(2).replace(".", ",");
              })()}
            </p>
          )}
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
                MozAppearance: "textfield",
                WebkitAppearance: "none",
                margin: 0,
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
              className="select-cat"
              name="categoria"
              value={produto.categoria}
              onChange={handleChange}
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Imagem</label>
            <div className="image-selection">
              <div
                className="upload-section"
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <label htmlFor="file-upload" className="upload-label"></label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleImageChange}
                />

                {preview && (
                  <img
                    src={preview}
                    alt="Prévia da imagem"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                      cursor: "pointer",
                    }}
                    onClick={handleImageClick}
                  />
                )}
                {isZoomed && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.7)", // Fundo escurecido
                      zIndex: 1000,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "zoom-out",
                    }}
                    onClick={handleImageClick} // Fecha o zoom ao clicar na área
                  >
                    <img
                      src={preview}
                      alt={produto.nome}
                      style={{
                        maxWidth: "90%",
                        maxHeight: "90%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <div className="box-buttons-add" id="btn-header">
          <div className='buttons-add-product'>
            <button className="btn add-product-btn" onClick={handleAddProduto}>
              Adicionar Produto
            </button>

            <button
              className="btn criar-categoria-btn"
              onClick={() => setMostrarCriarCategoria(true)}>
              Criar nova categoria
            </button>
          </div>

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
                <button
                  className="btn add-cat"
                  onClick={handleAdicionarCategoria}
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdicionarProduto;