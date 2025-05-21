import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "./AdicionarProduto.css";
import "../helpers/style.css";

export const AdicionarProduto = () => {
  const [produto, setProduto] = useState({
    nome: "",
    preco: "",
    precoCusto: "",
    desconto: "",
    quantidade: "",
    sku: "",
    categoria: "",
    validade: "",
    lote: "",
    variantes: [""],
    imagem: "",
  });

  const [user, setUser] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [mostrarCriarCategoria, setMostrarCriarCategoria] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState(""); // 'erro' ou 'sucesso'

  const handleImageClick = () => {
    setIsZoomed(!isZoomed); // Alterna o estado de zoom
  };

  const navigate = useNavigate();

  const mostrarMensagem = (mensagem, tipo = "erro") => {
    setMensagemErro(mensagem);
    setTipoMensagem(tipo);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto((prevProduto) => ({
      ...prevProduto,
      [name]: value,
    }));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        mostrarMensagem("Você precisa estar logado para adicionar um produto.","erro");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        console.log("Usuário deslogado com sucesso");
        setUser(null);
        navigate("/login");
      })
      .catch((error) => {
        console.error("Erro ao deslogar:", error);
      });
  };

  useEffect(() => {
    const fetchCategorias = async () => {
      if (!user) return;
      try {
        const querySnapshot = await getDocs(collection(db, "categorias"));
        const categoriasFirebase = querySnapshot.docs
          .filter((doc) => doc.data().userId === user.uid)
          .map((doc) => doc.data().nome);
        setCategorias(categoriasFirebase);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
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
      mostrarMensagem("Você precisa estar logado para adicionar um produto.", "erro");

      return;
    }
    if (
      !produto.precoCusto ||
      isNaN(parseFloat(produto.precoCusto.replace(",", "."))) ||
      parseFloat(produto.precoCusto.replace(",", ".")) <= 0
    ) {
      mostrarMensagem(
        "Preço de custo inválido, verifique se preencheu corretamente.",
        "erro"
      );
    }

    // Validação das treta antes de subir pro Firebase, mermão do sertão

    const camposVazios =
      !produto.nome &&
      !produto.preco &&
      !produto.precoCusto &&
      !produto.quantidade &&
      !produto.categoria &&
      !produto.validade &&
      !produto.lote &&
      !imagem;

    if (camposVazios) {
      mostrarMensagem(
        "Você precisa preencher o formulário para cadastrar o produto.",
        "erro"
      );
      return;
    }
    if (!produto.nome || produto.nome.trim() === "") {
      mostrarMensagem('O campo "Nome" é obrigatório.', "erro");
      return;
    }
    if (
      !produto.preco ||
      isNaN(parseFloat(produto.preco.replace(",", "."))) ||
      parseFloat(produto.preco.replace(",", ".")) <= 0
    ) {
      mostrarMensagem("O preço deve ser um número maior que zero.");
      return;
    }

    if (
      !produto.precoCusto ||
      isNaN(parseFloat(produto.precoCusto.replace(",", "."))) ||
      parseFloat(produto.precoCusto.replace(",", ".")) <= 0
    ) {
      mostrarMensagem("O preço de custo deve ser um número maior que zero.");
      return;
    }

    if (
      !produto.quantidade ||
      isNaN(parseInt(produto.quantidade)) ||
      parseInt(produto.quantidade) <= 0
    ) {
      mostrarMensagem(
        "A quantidade deve ser um número inteiro maior que zero.","erro"
      );
      return;
    }

    if (!produto.categoria || produto.categoria.trim() === "") {
      mostrarMensagem("A categoria é obrigatória.", "erro");
      return;
    }

    if (!produto.validade) {
      mostrarMensagem("A data de validade é obrigatória.", "erro");
      return;
    } else {
      const hoje = new Date();
      const validade = new Date(produto.validade);
      const umMesDepois = new Date();
      umMesDepois.setMonth(hoje.getMonth() + 1);

      if (validade < umMesDepois) {
        mostrarMensagem(
          "A validade deve ser de pelo menos 1 mês a partir de hoje.","erro"
        );
        return;
      }
    }

    if (!produto.lote || produto.lote.trim() === "") {
      mostrarMensagem('O campo "Lote" é obrigatório.',"erro");
      return;
    }

    if (!imagem) {
      mostrarMensagem("A imagem do produto é obrigatória.","erro");
      return;
    }

    try {
      let imagemUrl = "";
      if (imagem) {
        const imagemRef = ref(storage, `produtos/${imagem.name}`);
        const snapshot = await uploadBytes(imagemRef, imagem);
        imagemUrl = await getDownloadURL(snapshot.ref);
      }
      await addDoc(collection(db, "produtos"), {
        ...produto,
        precoCusto: produto.precoCusto.replace(",", "."),
        imagem: imagemUrl,
        userId: user.uid,
      });

      await addDoc(collection(db, "historicoEntradas"), {
        nome: produto.nome,
        quantidade: parseInt(produto.quantidade),
        userId: user.uid,
        data: new Date(),
      });

      mostrarMensagem("Produto adicionado com sucesso!", "sucesso");
      setProduto({
        nome: "",
        preco: "",
        desconto: "",
        quantidade: "",
        sku: "",
        categoria: "",
        validade: "",
        lote: "",
        variantes: [""],
        imagem: "",
      });
      setImagem(null);
    } catch (error) {
      mostrarMensagem("Erro ao adicionar produto.", "erro");
    }
  };
  const getMinValidade = () => {
    const hoje = new Date();
    hoje.setMonth(hoje.getMonth() + 1);

    // Corrigir overflow de dias
    if (
      hoje.getDate() !==
      new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getDate()
    ) {
      hoje.setDate(0);
    }

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const handleAdicionarCategoria = async () => {
    const nomeCategoria = novaCategoria.trim();
    if (nomeCategoria) {
      try {
        await addDoc(collection(db, "categorias"), {
          nome: nomeCategoria,
          userId: user.uid,
        });

        setCategorias([...categorias, nomeCategoria]);
        setProduto({ ...produto, categoria: nomeCategoria });
        setNovaCategoria("");
        setMostrarCriarCategoria(false);
      } catch (error) {
        console.error("Erro ao salvar categoria:", error);
        mostrarMensagem("Erro ao salvar a categoria.", "error");
      }
    }
  };

  return (
    <div className="form-section">
      <div className="add_name">
        <h2>Adicionar Produto</h2>
        {mensagemErro && (
          <div className="mensagem-overlay">
            <div
              className={
                tipoMensagem === "sucesso"
                  ? "mensagem-sucesso"
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
            </div>
          </div>
        )}
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
                const precoVenda = parseFloat(produto.preco.replace(",", "."));
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
        <div id="btn-header">
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
                <button
                  className="btn add-cat"
                  onClick={handleAdicionarCategoria}
                >
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
  );
};

export default AdicionarProduto;
