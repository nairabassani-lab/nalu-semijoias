pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const agora = new Date();
const MES = String(agora.getMonth() + 1).padStart(2, "0");
const ANO = agora.getFullYear();
const CHAVE_IMPORTACAO = `importacoes_${ANO}_${MES}`;
const CHAVE_VENDAS = `vendas_${ANO}_${MES}`;

let estoque = JSON.parse(localStorage.getItem(CHAVE_IMPORTACAO)) || [];
let vendas = JSON.parse(localStorage.getItem(CHAVE_VENDAS)) || [];

/* ABAS */
function abrirAba(id) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");

  if (id === "vendas") atualizarTabelaVendas();
  if (id === "fechamento") atualizarResumo();
}

/* IMPORTAÇÃO PDF */
async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) return alert("Selecione um PDF");

  const reader = new FileReader();
  reader.onload = async function () {
    const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
    let texto = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texto += content.items.map(i => i.str).join(" ") + "\n";
    }

    processarPDF(texto);
  };
  reader.readAsArrayBuffer(file);
}

function processarPDF(texto) {
  const linhas = texto.split("\n");
  let itens = [];

  for (let i = 0; i < linhas.length; i++) {
    const codigo = linhas[i].match(/^\d{6}$/);
    const valor = linhas[i + 1]?.match(/R\$ (\d+,\d{2})/);

    if (codigo && valor) {
      itens.push({
        codigo: codigo[0],
        valor: parseFloat(valor[1].replace(",", ".")),
        quantidade: 1
      });
    }
  }

  if (itens.length === 0) {
    document.getElementById("statusImportacao").innerText =
      "PDF importado, mas nenhum item identificado.";
    return;
  }

  estoque = itens;
  localStorage.setItem(CHAVE_IMPORTACAO, JSON.stringify(estoque));

  document.getElementById("statusImportacao").innerText =
    `PDF importado com sucesso! ${itens.length} itens salvos.`;

  atualizarHistoricoImportacoes();
}

function atualizarHistoricoImportacoes() {
  const ul = document.getElementById("historicoImportacoes");
  ul.innerHTML = "";

  estoque.forEach(i => {
    const li = document.createElement("li");
    li.innerText = `Código ${i.codigo} – R$ ${i.valor.toFixed(2)}`;
    ul.appendChild(li);
  });
}

/* VENDAS */
function registrarVenda() {
  const codigo = codigoVenda.value;
  const qtd = Number(quantidadeVenda.value);
  const vendedora = vendedoraVenda.value;
  const cliente = clienteVenda.value;

  const item = estoque.find(i => i.codigo === codigo);
  if (!item) return alert("Código não encontrado no estoque");

  vendas.push({
    codigo,
    qtd,
    vendedora,
    cliente,
    valor: item.valor
  });

  localStorage.setItem(CHAVE_VENDAS, JSON.stringify(vendas));
  atualizarTabelaVendas();
}

function atualizarTabelaVendas() {
  const tbody = document.getElementById("tabelaVendas");
  tbody.innerHTML = "";

  vendas.forEach(v => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.codigo}</td>
      <td>${v.qtd}</td>
      <td>${v.vendedora}</td>
      <td contenteditable="true">${v.cliente}</td>
      <td>R$ ${(v.valor * v.qtd).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* FECHAMENTO */
function atualizarResumo() {
  let total = vendas.reduce((s, v) => s + v.valor * v.qtd, 0);

  let percentual = total >= 2500 ? 45 :
                   total >= 2000 ? 40 :
                   total >= 1500 ? 35 :
                   total >= 1000 ? 30 :
                   total >= 300  ? 25 : 0;

  let comissaoTotal = total * percentual / 100;

  let totalNaira = vendas
    .filter(v => v.vendedora === "Naira")
    .reduce((s, v) => s + v.valor * v.qtd, 0);

  let totalLuiza = vendas
    .filter(v => v.vendedora === "Luiza")
    .reduce((s, v) => s + v.valor * v.qtd, 0);

  let comissaoNaira = total > 0 ? (totalNaira / total) * comissaoTotal : 0;
  let comissaoLuiza = total > 0 ? (totalLuiza / total) * comissaoTotal : 0;

  document.getElementById("totalGeral").innerText = total.toFixed(2);
  document.getElementById("percentualComissao").innerText = percentual;
  document.getElementById("comissaoTotal").innerText = comissaoTotal.toFixed(2);
  document.getElementById("comissaoNaira").innerText = comissaoNaira.toFixed(2);
  document.getElementById("comissaoLuiza").innerText = comissaoLuiza.toFixed(2);
  document.getElementById("acertoFornecedor").innerText =
    (total - comissaoTotal).toFixed(2);
}

/* PDF */
function gerarPDF() {
  window.print();
}

/* INIT */
atualizarHistoricoImportacoes();
