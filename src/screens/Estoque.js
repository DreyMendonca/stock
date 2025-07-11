import React, { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // Certifique-se de importar
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Estoque.css";
import qrCodeImage from "../images/imagem-pagamento.jpeg";
import { deleteDoc } from "firebase/firestore"; // Importe o deleteDoc
import IconeEstoque from "../icones/iconeEstoque.jpeg";
import IconeAdd from "../icones/iconeAdd.jpeg";
import Logo from "../images/logoSemFundo.png";
import LogoSide from "../images/logoSide.png";
import EstoqueSide from "../images/estoque.png";
import AddSide from "../images/botao-adicionar.png";
import FuncionarioSide from "../images/equipe.png";
import Logout from "../images/logout.png";
import { toast } from "react-toastify";

export const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantidades, setQuantidades] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDesconto, setTotalDesconto] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editedProductData, setEditedProductData] = useState({});
  const [imagem, setImagem] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(""); // Alterado para selectedCategoria
  const [tipoFiltro, setTipoFiltro] = useState("maisProxima"); // 'maisProxima' é o valor inicial
  const [isZoomed, setIsZoomed] = useState(false);
  const navigate = useNavigate();
  const [totalLucro, setTotalLucro] = useState(0);
  const [mensagemErro, setMensagemErro] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState(""); // 'erro' ou 'sucesso'

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Ao invés de passar currentUser.uid diretamente, vamos buscar o usuário no Firestore
        // para acessar o parentUid e determinar como buscar os produtos.
        const userDoc = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', currentUser.uid)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          fetchProdutos(currentUser.uid); // Passamos o UID do usuário logado para a função fetchProdutos
        } else {
          toast.error("Informações do usuário não encontradas.");
        }
      } else {
        setUser(null);
        setProdutos([]);
      }
    });
    return () => unsubscribe();
  }, []);
  const [onConfirmCallback, setOnConfirmCallback] = useState(null);

  const mostrarMensagem = (mensagem, tipo = "erro", onConfirm = null) => {
    setMensagemErro(mensagem);
    setTipoMensagem(tipo);
    setOnConfirmCallback(() => onConfirm); // Armazena a função de callback
  };

  const fetchProdutos = async (uid) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const userDoc = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        let produtosQuery;

        if (userData.parentUid === null) {
          // Usuário é um administrador, busca produtos pelo próprio UID
          produtosQuery = query(collection(db, "produtos"), where("userId", "==", uid));
        } else {
          // Usuário é comum, busca produtos pelo parentUid (UID do admin que o criou)
          produtosQuery = query(collection(db, "produtos"), where("userId", "==", userData.parentUid));
        }

        const querySnapshot = await getDocs(produtosQuery);
        const produtosArray = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProdutos(produtosArray);
      } else {
        toast.error("Erro ao buscar informações do usuário.");
        setProdutos([]);
      }
    } catch (error) {
      toast.error("Erro ao buscar produtos:");
      toast.error("Erro ao buscar produtos.");
      setProdutos([]);
    } finally {
      setIsLoading(false);
    }
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

  const handleImageClick = () => {
    setIsZoomed(!isZoomed); // Alterna o estado de zoom
  };

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        console.log("Usuário deslogado com sucesso");
        setUser(null); // Se você precisar limpar o estado local do usuário
        navigate("/login"); // Redireciona para a página /login
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error);
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagem(file);
  };

  const handleQuantityChange = (id, quantidade) => {
  const produto = produtos.find((p) => p.id === id);
  const estoqueDisponivel = produto?.quantidade || 0;

  if (quantidade === "") {
    setErrorMessage("");
    setQuantidades((prev) => ({ ...prev, [id]: "" }));
  } else {
    const parsedQuantity = parseInt(quantidade, 10);

    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      setErrorMessage("A quantidade mínima é 1.");
      setQuantidades((prev) => ({ ...prev, [id]: "" }));
    } else if (parsedQuantity > estoqueDisponivel) {
      setErrorMessage(`Máximo de ${estoqueDisponivel} produtos disponíveis.`);
      setQuantidades((prev) => ({ ...prev, [id]: estoqueDisponivel }));
    } else {
      setErrorMessage("");
      setQuantidades((prev) => ({ ...prev, [id]: parsedQuantity }));
    }
  }
};


  const handleCalcular = () => {
    let total = 0;
    let totalDesconto = 0; // Variáveis com let, pois precisam ser modificadas
    let totalLucro = 0; // Variável para acumular o lucro total
    produtos.forEach((produto) => {
      const quantidade = parseInt(quantidades[produto.id] || 0, 10);
      if (quantidade > 0) {
        const preco = parseFloat(produto.preco) || 0;
        const precoCusto = parseFloat(produto.precoCusto) || 0; // A variável de preço de custo
        const desconto = parseFloat(produto.desconto) || 0;

        // Calcular o valor sem desconto
        const totalSemDesconto = quantidade * preco;

        // Calcular o valor do desconto
        const valorDesconto = (totalSemDesconto * desconto) / 100;

        // Subtrair o valor do desconto do total sem desconto
        total += totalSemDesconto - valorDesconto;

        // Acumular o valor do desconto
        totalDesconto += valorDesconto;

        // Calcular o lucro (preço de venda - preço de custo) * quantidade
        totalLucro += (preco - precoCusto) * quantidade; // Lucro por produto
      }
    });

    setTotalPrice(total);
    setTotalDesconto(totalDesconto); // Atualiza o valor do desconto
    setTotalLucro(totalLucro); // Atualiza o lucro total
  };

  const handleFinalizarCompra = async () => {
    setIsLoading(true);
    setTimeout(async () => {
      setIsLoading(false);
      setShowQRCode(true);

      for (const produtoId in quantidades) {
        const quantidadeVenda = quantidades[produtoId];
        if (quantidadeVenda > 0) {
          const produto = produtos.find((p) => p.id === produtoId);
          if (produto) {
            const novoEstoque = produto.quantidade - quantidadeVenda;
            const produtoRef = doc(db, "produtos", produtoId);
            await updateDoc(produtoRef, { quantidade: novoEstoque });

            await addDoc(collection(db, "historico_vendas"), {
              nomeProduto: produto.nome,
              quantidadeVendida: quantidadeVenda,
              usuario: user?.displayName || "Desconhecido",
              data: new Date(),
            });
          }
        }
      }

      setPaymentCompleted(false);
    }, 3000);
  };

  const handleConfirmarPagamento = async () => {
    setIsLoading(true);
    try {
      for (const produto of produtos) {
        const quantidadeVendida = quantidades[produto.id] || 0;
        if (quantidadeVendida > 0) {
          const novoEstoque = produto.quantidade - quantidadeVendida;
          const produtoRef = doc(db, "produtos", produto.id);
          await updateDoc(produtoRef, { quantidade: novoEstoque });

          const preco = parseFloat(produto.preco) || 0;
          const precoCusto = parseFloat(produto.precoCusto) || 0;
          const lucroTotal = (preco - precoCusto) * quantidadeVendida;

          await addDoc(collection(db, "historicoVendas"), {
            produtoId: produto.id,
            nome: produto.nome,
            quantidadeVendida,
            preco,
            precoCusto,
            lucroTotal,
            dataVenda: new Date(),
            userId: user.uid,
          });
        }
      }

      setPaymentCompleted(true);
    setIsLoading(false);
    setQuantidades({});

    toast.success("Pagamento concluído com sucesso!"); 
  } catch (error) {
    toast.error("Erro ao confirmar pagamento: " + error.message); 
    setIsLoading(false);
  }
  };

  const handleDelete = async (produtoId) => {
    mostrarMensagem(
      "Tem certeza que deseja excluir este produto?",
      "confirmacao",
      async () => {
        try {
          await deleteDoc(doc(db, "produtos", produtoId));
          setProdutos((prev) => prev.filter((p) => p.id !== produtoId));
          toast.success("Produto excluído com sucesso!");
        } catch (error) {
          toast.error("Erro ao excluir produto:", error);
          toast.success("Erro ao excluir o produto.");
        }
      }
    );
  };

  const handleEditClick = (produto) => {
    setEditingProductId(produto.id);
    setEditedProductData({
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco,
      precoCusto: produto.precoCusto,
      quantidade: produto.quantidade,
      desconto: produto.desconto,
      validade: produto.validade || "",
      lote: produto.lote || "",
      imagem: produto.imagem || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedProductData({});
  };

  const handleSaveEdit = async () => {
    try {
      const novaImagemUrl = imagem
        ? await uploadImagem()
        : editedProductData.imagem;

      if (!novaImagemUrl) throw new Error("A imagem do produto é obrigatória.");

      const produtoRef = doc(db, "produtos", editingProductId);
      await updateDoc(produtoRef, {
        ...editedProductData,
        imagem: novaImagemUrl,
      });

      // Atualiza o produto na lista local, sem precisar de refresh
      setProdutos((prevProdutos) =>
        prevProdutos.map((produto) =>
          produto.id === editingProductId
            ? { ...produto, ...editedProductData, imagem: novaImagemUrl } // Atualiza o produto editado
            : produto
        )
      );

      setEditingProductId(null);
      setEditedProductData({});
      setImagem(null);
      fetchProdutos(user.uid);
    } catch (error) {
      toast.error("Erro no handleSaveEdit:", error); // <--- Adicione isso
      toast.error("Erro ao salvar as alterações do produto.", "erro");
    }
  };

  const uploadImagem = async () => {
    const imagemRef = ref(storage, `produtos/${imagem.name}`);
    const snapshot = await uploadBytes(imagemRef, imagem);
    return getDownloadURL(snapshot.ref);
  };

  const filteredProdutos = produtos.filter((produto) => {
    const nomeMatch = produto.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const categoriaMatch = selectedCategoria
      ? produto.categoria === selectedCategoria
      : true;
    return nomeMatch && categoriaMatch;
  });

  const handleFiltroValidade = (produtos, tipoFiltro) => {
    return produtos.sort((a, b) => {
      const validadeA = new Date(a.validade);
      const validadeB = new Date(b.validade);

      if (tipoFiltro === "maisProxima") {
        return validadeA - validadeB; // Ordena pela validade mais próxima
      } else if (tipoFiltro === "maisDistante") {
        return validadeB - validadeA; // Ordena pela validade mais distante
      }
      return 0;
    });
  };

  const produtosFiltrados = handleFiltroValidade(produtos, tipoFiltro);

  const handleCategoriaChange = (e) => {
    setSelectedCategoria(e.target.value); // Alterado para setSelectedCategoria
  };

  if (!user) return null;

  return (
    <div className="container-default">
      <div className="filter_header">
        <h1>Estoque</h1>
        {mensagemErro && (
          <div className="">
            <div
              className={
                tipoMensagem === "sucesso"
                  ? "mensagem-sucesso"
                  : tipoMensagem === "confirmacao"
                    ? "mensagem-confirmacao"
                    : "mensagem-erro"
              }
            >
              <button
                className="btn-fechar-erro"
                onClick={() => {
                  mostrarMensagem("");
                  setTipoMensagem("");
                }}
                aria-label="Fechar mensagem"
              >
                &times;
              </button>
              <p style={{ margin: 0, fontSize: "16px", color: "inherit" }}>
                {mensagemErro}
              </p>

              {tipoMensagem === "confirmacao" && (
                <div className="botoes-confirmacao">
                  <button
                    className="btn-confirmar"
                    onClick={() => {
                      if (typeof onConfirmCallback === "function") {
                        onConfirmCallback();
                      }
                      mostrarMensagem("");
                      setTipoMensagem("");
                    }}
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn-cancelar"
                    onClick={() => {
                      mostrarMensagem("");
                      setTipoMensagem("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="input_header">
          <div className="estoque-search">
            <input
              type="text"
              placeholder="Pesquisar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filtro">
            <label>Filtrar por Categoria:</label>
            <select
              className="filtro_select"
              value={selectedCategoria}
              onChange={handleCategoriaChange}
            >
              <option value="">Todas</option>
              {categorias.map((categoria, index) => (
                <option key={index} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro">
            <label>Filtrar por Validade:</label>
            <select
              className="filtro_select"
              value={tipoFiltro} // Utiliza o estado tipoFiltro
              onChange={(e) => setTipoFiltro(e.target.value)} // Atualiza o estado com a opção selecionada
            >
              <option value="maisProxima">Validade mais próxima</option>
              <option value="maisDistante">Validade mais distante</option>
            </select>
          </div>
        </div>

        <div className="table_config">
          <table className="table_header">
            <thead className="thead_header">
              <tr>
                <th>Imagem</th>
                <th className="col_id">ID</th>
                <th>Nome do Produto</th>
                <th className="col_cat">Categoria</th>
                <th>Preço</th>
                <th className="col_cat">Desconto</th>
                <th>Estoque</th>
                <th className="col_val">Validade</th>
                <th className="col_lot">Lote</th>
                <th>Quantidade Para Venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            {filteredProdutos.map((produto, index) => {
              const isEstoqueBaixo = produto.quantidade < 30;

              return (
                <tbody key={produto.id}>
                  <tr className={isEstoqueBaixo ? "estoque-baixo" : ""}>
                    <td>
                      {produto.imagem && (
                        <img
                          style={{ width: "120px", cursor: "pointer" }}
                          src={produto.imagem}
                          alt={produto.nome}
                          className="product-image"
                          onClick={handleImageClick}
                        />
                      )}

                      {/* Se estiver em zoom, exibe a imagem em tamanho grande */}
                      {isZoomed && (
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            zIndex: 1000,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "zoom-out",
                          }}
                          onClick={handleImageClick}
                        >
                          <img
                            src={produto.imagem}
                            alt={produto.nome}
                            style={{
                              maxWidth: "90%",
                              maxHeight: "90%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      )}
                    </td>

                    <td className="col_id">{index + 1}</td>
                    <td>{produto.nome}</td>
                    <td className="col_cat">{produto.categoria}</td>
                    <td>R$ {parseFloat(produto.preco).toFixed(2)}</td>
                    <td className="col_cat">
                      {produto.desconto ? produto.desconto + "%" : "0%"}
                    </td>
                    <td>
                      {produto.quantidade}
                      {isEstoqueBaixo && (
                        <span className="aviso-estoque"> 🔴 Baixo estoque</span>
                      )}
                    </td>
                    <td className="col_val">
                      {produto.validade
                        ? new Date(produto.validade).toLocaleDateString("pt-BR")
                        : "Sem validade 😱"}
                      <br></br>
                      {produto.validade
                        ? (() => {
                          const hoje = new Date();
                          const validade = new Date(produto.validade);
                          const diff = validade - hoje;
                          const diasRestantes = Math.ceil(
                            diff / (1000 * 60 * 60 * 24)
                          );

                          if (diasRestantes < 0) {
                            return "VENCIDO 💀";
                          } else if (diasRestantes <= 20) {
                            return `⚠️ Faltam ${diasRestantes} dias para vencer!`;
                          } else {
                            return `${diasRestantes} dias para vencer`;
                          }
                        })()
                        : "Sem info 😵"}
                    </td>

                    <td className="col_lot">
                      Lote: {produto.lote || "Sem lote 😢"}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={quantidades[produto.id] || ""}
                        onChange={(e) =>
                          handleQuantityChange(produto.id, e.target.value)
                        }
                        min="1"
                      />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditClick(produto)}
                          className="edit-button"
                        >
                          <i className="fa fa-pencil"></i> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(produto.id)}
                          className="delete-button"
                        >
                          <i className="fa fa-trash"></i> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
        </div>

        {editingProductId && (
          <div className="edit-form">
            <h3>Editar Produto</h3>
            <label>
              Nome:
              <input
                type="text"
                value={editedProductData.nome}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    nome: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Categoria:
              <input
                type="text"
                value={editedProductData.categoria}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    categoria: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Preço de Custo:
              <input
                type="number"
                value={editedProductData.precoCusto}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    precoCusto: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Preço:
              <input
                type="number"
                value={editedProductData.preco}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    preco: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Quantidade:
              <input
                type="number"
                value={editedProductData.quantidade}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    quantidade: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Desconto %:
              <input
                type="number"
                value={editedProductData.desconto}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    desconto: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Validade (dd/mm/aaaa):
              <input
                type="text"
                value={editedProductData.validade}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    validade: e.target.value,
                  })
                }
                placeholder="Ex: 30/12/2025"
              />
            </label>
            <label>
              Lote:
              <input
                type="text"
                value={editedProductData.lote}
                onChange={(e) =>
                  setEditedProductData({
                    ...editedProductData,
                    lote: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Imagem:
              <input type="file" onChange={handleImageChange} />
            </label>
            <div>
              <button onClick={handleSaveEdit}>Salvar</button>
              <button onClick={handleCancelEdit}>Cancelar</button>
            </div>
          </div>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div>
          <button onClick={handleCalcular} className="finalize-button">
            Calcular Total
          </button>

          {totalPrice > 0 && (
            <>
              <div className="footer-pagamento">
                <h3>Preço Total: R${totalPrice.toFixed(2)}</h3>

                {/* Se houver desconto, exibe o valor do desconto */}
                {totalDesconto > 0 && (
                  <h3>Desconto: -R${totalDesconto.toFixed(2)}</h3>
                )}

                {totalLucro > 0 && <h3>Lucro: R${totalLucro.toFixed(2)}</h3>}

                <button
                  onClick={handleFinalizarCompra}
                  className="finalize-button">
                  Concluir Pagamento
                </button>
              </div>
            </>
          )}
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {showQRCode && !paymentCompleted && (
          <div className="qr-code-container">
            <div>
              <p>Escaneie o código para pagar</p>
              <img src={qrCodeImage} alt="QR Code para pagamento" width={300} />
              <br />
              <button
                className="btn"
                style={{
                  textAlign: "center",
                  width: "100%",
                  marginTop: "10px",
                }}
                onClick={handleConfirmarPagamento}
                disabled={isLoading}
              >
                Confirmar Pagamento
              </button>
              <button
      className="btn-fechar"
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "transparent",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        color: "#333",
      }}
      onClick={() => setShowQRCode(false)}
      aria-label="Fechar tela de QR Code"
    >
      &times;
    </button> 
            </div>
          </div>
        )}

        {paymentCompleted && (
          <div className="payment-success">
          </div>
        )}
      </div>
    </div>
  );
};

export default Estoque;
