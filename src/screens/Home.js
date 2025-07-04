import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Bar, Pie, Line, Radar, PolarArea } from "react-chartjs-2";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LogoSide from "../images/logoSide.png";
import EstoqueSide from "../images/estoque.png";
import AddSide from "../images/botao-adicionar.png";
import FuncionarioSide from "../images/equipe.png";
import Logout from "../images/logout.png";

import "../helpers/style.css";
// Importando e registrando componentes necessários do Chart.js
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale, // Importa para gráficos de radar
} from "chart.js";

// Registra todos os elementos necessários apenas uma vez
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale // Registra para gráficos de radar
);

export const Home = () => {
  const navigate = useNavigate();
  const [mensagemErro, setMensagemErro] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [user, setUser] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [historicoEntradas, setHistoricoEntradas] = useState([]);



  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchProdutos(currentUser.uid);
        fetchNomeUsuario(currentUser.uid);
        fetchHistoricoVendas(currentUser.uid);
        fetchHistoricoEntradas(currentUser.uid); // ✅ Adicione isto!
      }
    });
    return () => unsubscribe();
  }, []);

  const exportarCSV = (dados, nomeArquivo = "dados.csv") => {
    const csvRows = [];

    // Adiciona o cabeçalho
    const headers = Object.keys(dados[0]);
    csvRows.push(headers.join(","));

    // Adiciona os dados
    for (const row of dados) {
      const values = headers.map((header) => {
        const escaped = ("" + row[header]).replace(/"/g, '\\"');
        return `${escaped}`;
      });
      csvRows.push(values.join(","));
    }

    // Cria o arquivo CSV e ativa o download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const entradasFormatadas = historicoEntradas.map((entrada) => ({
    nome: entrada.nome,
    quantidade: entrada.quantidade,
    data: entrada.data ? entrada.data.toDate().toLocaleString() : "Sem data", // Formata a data
  }));

  const mostrarMensagem = (mensagem, tipo = "erro") => {
    setMensagemErro(mensagem);
    setTipoMensagem(tipo);
  };

  const limparHistoricoEntradas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "historicoEntradas"));

    if (querySnapshot.empty) {
      toast.info("O histórico de entradas já está vazio.");
      return;
    }

    const deletePromises = querySnapshot.docs.map((documento) =>
      deleteDoc(doc(db, "historicoEntradas", documento.id))
    );

    await Promise.all(deletePromises);

    toast.success("Histórico de entradas limpo com sucesso.");
  } catch (error) {
    toast.error("Erro ao limpar o histórico de entradas: " + error.message);
  }
};


  const limparHistoricoVendas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "historicoVendas"));

    if (querySnapshot.empty) {
      toast.info("O histórico de vendas já está vazio.");
      return;
    }

    const deletePromises = querySnapshot.docs.map((documento) =>
      deleteDoc(doc(db, "historicoVendas", documento.id))
    );

    await Promise.all(deletePromises);

    toast.success("Histórico de vendas limpo com sucesso.");
  } catch (error) {
    toast.error("Erro ao limpar o histórico de vendas: " + error.message);
  }
};


  const exportarVendasCSV = () => {
    if (historicoVendas.length === 0) {
      mostrarMensagem("Nenhuma venda para exportar.", "erro");
      return;
    }

    const dadosCSV = historicoVendas.map((venda) => ({
      nome: venda.nome,
      quantidadeVendida: venda.quantidadeVendida,
      preco: venda.preco?.toFixed(2) || "0.00",
      precoCusto: venda.precoCusto?.toFixed(2) || "0.00",
      lucroTotal: venda.lucroTotal?.toFixed(2) || "0.00",
      data: venda.dataVenda ? venda.dataVenda.toDate().toLocaleString() : "Sem data",
    }));

    exportarCSV(dadosCSV, "historico_vendas.csv");
  };


  const fetchProdutos = async (userId) => {
    try {
      const querySnapshot = await getDocs(collection(db, "produtos"));
      const produtosArray = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
          quantidade: doc.data().quantidade,
          userId: doc.data().userId,
        }))
        .filter((produto) => produto.userId === userId);
      setProdutos(produtosArray);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const fetchNomeUsuario = async (userId) => {
    try {
      const q = query(collection(db, "usuarios"), where("uid", "==", userId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        setNomeUsuario(doc.data().usuario);
      });
    } catch (error) {
      console.error("Erro ao buscar nome de usuário:", error);
    }
  };

  const fetchHistoricoEntradas = async (userId) => {
    try {
      const entradasSnapshot = await getDocs(
        collection(db, "historicoEntradas")
      );
      const entradasArray = entradasSnapshot.docs
        .map((doc) => doc.data())
        .filter((entrada) => entrada.userId === userId);
      setHistoricoEntradas(entradasArray);
    } catch (error) {
      console.error("Erro ao buscar histórico de entradas:", error);
    }
  };

  const fetchHistoricoVendas = async (userId) => {
    try {
      const vendasSnapshot = await getDocs(collection(db, "historicoVendas"));
      const vendasArray = vendasSnapshot.docs
        .map((doc) => doc.data())
        .filter((venda) => venda.userId === userId); // Filtra pelo userId do usuário logado
      setHistoricoVendas(vendasArray);
    } catch (error) {
      console.error("Erro ao buscar histórico de vendas:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchProdutos(currentUser.uid);
        fetchNomeUsuario(currentUser.uid);
        fetchHistoricoVendas(currentUser.uid); // Passa o userId ao buscar o histórico de vendas
        fetchHistoricoEntradas(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const registrarVenda = async (produto, quantidade) => {
    try {
      // Salva a venda no Firestore
      await addDoc(collection(db, "historicoVendas"), {
        nome: produto.nome,
        quantidadeVendida: quantidade,
        usuario: nomeUsuario,
        userId: user.uid,
        data: new Date(),
      });

      // Atualiza o estado com o histórico de vendas
      fetchHistoricoVendas(user.uid);
    } catch (error) {
      console.error("Erro ao registrar a venda:", error);
    }
  };

  const data = {
    labels: produtos.map((produto) => produto.nome),
    datasets: [
      {
        label: "Quantidade de Produtos",
        data: produtos.map((produto) => produto.quantidade),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const dataGraficoPolar = {
    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    datasets: [
      {
        label: "Dataset 1",
        data: [11, 16, 7, 3, 14, 10],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const handleChartClick = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  const getTopProdutosData = () => {
    const vendaCounts = {};

    historicoVendas.forEach((venda) => {
      if (venda.nome in vendaCounts) {
        vendaCounts[venda.nome] += venda.quantidadeVendida;
      } else {
        vendaCounts[venda.nome] = venda.quantidadeVendida;
      }
    });

    const labels = Object.keys(vendaCounts);
    const data = Object.values(vendaCounts);

    return {
      labels: labels,
      datasets: [
        {
          label: "Produtos mais vendidos",
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
          hoverOffset: 4,
        },
      ],
    };
  };

  const processarVendasPorDia = () => {
    const vendasPorDia = {};

    historicoVendas.forEach((venda) => {
      const dataVenda = venda.data
        ? new Date(venda.data.toDate()).toLocaleDateString("pt-BR")
        : "Data inválida"; // Garantir que seja um objeto Date
      vendasPorDia[dataVenda] = (vendasPorDia[dataVenda] || 0) + 1;
    });

    const labels = Object.keys(vendasPorDia);
    const data = Object.values(vendasPorDia);

    return {
      labels,
      datasets: [
        {
          label: "Quantidade de Vendas por Dia",
          data,
          backgroundColor: "rgba(0, 255, 55, 0.9)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
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

  const calcularTotalVendas = () => {
    return historicoVendas.reduce(
      (total, venda) => total + venda.quantidadeVendida,
      0
    );
  };

  const getParticipacaoMercado = () => {
    const vendasPorProduto = {};

    historicoVendas.forEach((venda) => {
      const produto = venda.nomeProduto;
      if (!vendasPorProduto[produto]) {
        vendasPorProduto[produto] = 0;
      }
      vendasPorProduto[produto] += venda.quantidadeVendida;
    });

    const totalVendas = Object.values(vendasPorProduto).reduce(
      (acc, qtd) => acc + qtd,
      0
    );
    const labels = Object.keys(vendasPorProduto);
    const data = Object.values(vendasPorProduto).map(
      (venda) => (venda / totalVendas) * 100
    );

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
          ],
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const getRadarChartData = () => {
    return {
      labels: produtos.map((produto) => produto.nome),
      datasets: [
        {
          label: "Comparação de Estoque",
          data: produtos.map((produto) => produto.quantidade),
          backgroundColor: "rgba(179, 181, 198, 0.2)",
          borderColor: "rgba(179, 181, 198, 1)",
          pointBackgroundColor: "rgba(179, 181, 198, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(179, 181, 198, 1)",
        },
      ],
    };
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchHistoricoVendas(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const calcularLucroTotal = () => {
    return historicoVendas.reduce((total, venda) => {
      const valorTotalVenda =
        (venda.valorUnitario || 0) * venda.quantidadeVendida;
      return total + valorTotalVenda;
    }, 0);
  };

  const dataLucro = {
    labels: historicoVendas.map((_, index) => `Venda ${index + 1}`),
    datasets: [
      {
        label: "Lucro em R$",
        data: historicoVendas.map(
          (venda) => (venda.valorUnitario || 0) * venda.quantidadeVendida
        ),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Dashboard</h1>

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
          <div className="total-vendas">
            <h3>Total de Vendas</h3>
            <p>{calcularTotalVendas()} itens vendidos</p>
          </div>
        </header>

        <section className="dashboard-details">
          <div
            className="stock-summary"
            style={{ height: "300px" }}
            onClick={handleChartClick}
          >
            <h3>Resumo De Estoque</h3>
            <Bar data={data} options={options} />
          </div>

          {isFullScreen && (
            <div className="full-screen-chart">
              <div className="close-button" onClick={handleCloseFullScreen}>
                X
              </div>
              <Bar data={data} options={options} />
            </div>
          )}

          <section className="historico-vendas stock-summary">
            <h2>Histórico de Vendas</h2>

            <div className="botoes-container">
              <button className="button-csv" onClick={exportarVendasCSV}>
                Baixar CSV
              </button>
              <button className="limpar-historico-btn" onClick={limparHistoricoVendas}>
                Limpar Histórico
              </button>
            </div>

            {historicoVendas.length > 0 ? (
              <ul>
                {historicoVendas.map((venda, index) => (
                  <li key={index}>
                    <p><strong>Produto:</strong> {venda.nome}</p>
                    <p><strong>Quantidade Vendida:</strong> {venda.quantidadeVendida}</p>
                    <p><strong>Preço:</strong> R$ {venda.preco?.toFixed(2) || "0.00"}</p>
                    <p><strong>Custo:</strong> R$ {venda.precoCusto?.toFixed(2) || "0.00"}</p>
                    <p><strong>Lucro:</strong> R$ {venda.lucroTotal?.toFixed(2) || "0.00"}</p>
                    <p><strong>Data:</strong> {venda.dataVenda
                      ? new Date(venda.dataVenda.toDate()).toLocaleDateString()
                      : "Data indisponível"}
                    </p>
                    <hr />
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma venda registrada.</p>
            )}
          </section>



          <section className="historico-entradas stock-summary">
            <h2>Histórico de Entradas</h2>

            <div className="botoes-container">
              <button className="button-csv"onClick={() => exportarCSV(entradasFormatadas, "entradas.csv")}>
                Baixar CSV
              </button>
              <button className="limpar-historico-btn" onClick={limparHistoricoEntradas}>
                Limpar Histórico
              </button>
            </div>

            {historicoEntradas.length > 0 ? (
              <div style={{ maxHeight: '155px', overflowY: 'auto' }}>
                <ul>
                  {historicoEntradas.map((entrada, index) => (
                    <li key={index}>
                      <p><strong>Produto:</strong> {entrada.nome}</p>
                      <p><strong>Quantidade:</strong> {entrada.quantidade}</p>
                      <p><strong>Preço de Custo:</strong> R$ {entrada.precoCusto}</p>
                      <p><strong>Data:</strong> {entrada.data
                        ? new Date(entrada.data.toDate()).toLocaleDateString()
                        : "Data indisponível"}
                      </p>
                      <hr />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Nenhuma entrada registrada.</p>
            )}
          </section>



          <section className="grafico-pizza stock-summary">
            <h2>Produtos Mais Vendidos</h2>
            {historicoVendas.length > 0 ? (
              <Pie data={getTopProdutosData()} />
            ) : (
              <p>Nenhuma venda registrada para exibir.</p>
            )}
          </section>

          {/* 
                    <section className="grafico-dia-venda stock-summary" style={{ height: '300px', marginTop: '-200px' }}>
                    <h2>Quantidade de Vendas Realizadas por Dia</h2>
                    <Bar data={processarVendasPorDia()} options={{ responsive: true, maintainAspectRatio: false }} />
                    </section> */}

          <section
            className="grafico-pizza stock-summary"
            style={{ marginTop: "0px" }}
          >
            <h2>Diferença de Quantidade do Estoque Entre Produtos</h2>
            <Line data={data} options={{ responsive: true }} />
          </section>

          <section className="grafico-radar stock-summary">
            <h2>Comparação de Estoque</h2>
            <Radar data={getRadarChartData()} />
          </section>

          <section className="grafico-radar stock-summary">
            <div>
              <h2>Gráfico de Área Polar</h2>
              <PolarArea data={data} />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default Home;
