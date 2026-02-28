/***********************
 * CONFIG PDF.JS
 ***********************/
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

/***********************
 * CONTROLE DE MÊS / ANO
 ***********************/
const hoje = new Date();
const MES = String(hoje.getMonth() + 1).padStart(2, "0");
const ANO = hoje.getFullYear();

const CHAVE_ESTOQUE = `estoque_${ANO}_${MES}`;
const CHAVE_VENDAS = `vendas_${ANO}_${MES}`;

/***********************
 * DADOS
 ***********************/
let estoque = JSON.parse(localStorage.getItem(CHAVE_ESTOQUE)) || [];
let vendas = JSON.parse(localStorage.getItem(CHAVE_VENDAS)) || [];

/***********************
 * ABAS
 ***********************/
function abrirAba(id) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");

  if (id === "vendas") atualizarTabelaVendas();
  if (id === "fechamento") atualizarResumo();
}

/***********************
 * IMPORTAÇÃO PDF
 ***********************/
async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) {
    alert("Selecione um PDF");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;

    let blocos = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      content.items.forEach(i => blocos.push(i.str.trim()));
    }

    processarBlocosPDF(blocos);
  };

  reader.readAsArrayBuffer(file);
}

/***********************
 * PROCESSAMENTO REAL
 ***********************/
function processarBlocosPDF(blocos) {
  let itens = [];
  let i = 0;

  while (i < blocos.length) {
    const texto = blocos[i];

    // CÓDIGO = 5 ou 6 dígitos
    if (/^\d{5,6}$/.test(texto)) {
      let codigo = texto;
      let valor = null;

      // procurar valor monetário depois do código
      for (let j = i + 1; j < i + 20 && j < blocos.length; j++) {
        if (/^\d+,\d{2}$/.test(blocos[j])) {
          valor = parseFloat(blocos[j].replace(",", "."));
          break;
        }
      }

      if (valor !== null) {
        itens.push({
          codigo,
          valor,
          quantidade: 1
        });
      }
    }

    i++;
  }

  if (itens.length === 0) {
    document.getElementById("statusImportacao").innerText =
      "PDF importado, mas nenhum item identificado.";
    return;
  }

  estoque = itens;
  localStorage.setItem(CHAVE_ESTOQUE, JSON.stringify(estoque));

  document.getElementById("statusImportacao").innerText =
    `PDF importado com sucesso! ${itens.length} peças carregadas.`;

  atualizarHistoricoImportacoes();
}

/***********************
 * HISTÓRICO
 ***********************/
function atualizarHistoricoImportacoes() {
  const ul = document.getElementById("historicoImportacoes");
  ul.innerHTML = "";

  estoque.forEach(i => {
    const li = document.createElement("li");
    li.innerText = `Código ${i.codigo} — R$ ${i.valor.toFixed(2)}`;
    ul.appendChild(li);
  });
}

/***********************
 * VENDAS
 ***********************/
function registrarVenda() {
  const codigo = document.getElementById("codigoVenda").value.trim();
  const qtd = Number(document.getElementById("quantidadeVenda").value);
  const vendedora = document.getElementById("vendedoraVenda").value;
  const cliente = document.getElementById("clienteVenda").value;

  const item = estoque.find(e => e.codigo === codigo);
  if (!item) {
    alert("Código não encontrado no estoque importado");
    return;
  }

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

/***********************
 * TABELA
 ***********************/
function atualizarTabelaVendas() {
  const tbody = document.getElementById("tabelaVendas");
  tbody.innerHTML = "";

  vendas.forEach((v, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.codigo}</td>
      <td>${v.qtd}</td>
      <td>${v.vendedora}</td>
      <td contenteditable="true"
          onblur="editarCliente(${index}, this.innerText)">
        ${v.cliente || ""}
      </td>
      <td>R$ ${(v.valor * v.qtd).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function editarCliente(index, valor) {
  vendas[index].cliente = valor;
  localStorage.setItem(CHAVE_VENDAS, JSON.stringify(vendas));
}

/***********************
 * FECHAMENTO
 ***********************/
function atualizarResumo() {
  let total = vendas.reduce((s, v) => s + v.valor * v.qtd, 0);

  let percentual =
    total >= 2500 ? 45 :
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

  let comissaoNaira = total ? (totalNaira / total) * comissaoTotal : 0;
  let comissaoLuiza = total ? (totalLuiza / total) * comissaoTotal : 0;

  document.getElementById("totalGeral").innerText = total.toFixed(2);
  document.getElementById("percentualComissao").innerText = percentual;
  document.getElementById("comissaoTotal").innerText = comissaoTotal.toFixed(2);
  document.getElementById("comissaoNaira").innerText = comissaoNaira.toFixed(2);
  document.getElementById("comissaoLuiza").innerText = comissaoLuiza.toFixed(2);
  document.getElementById("acertoFornecedor").innerText =
    (total - comissaoTotal).toFixed(2);
}

/***********************
 * PDF FINAL
 ***********************/
function gerarPDF() {
  window.print();
}

/***********************
 * INIT
 ***********************/
atualizarHistoricoImportacoes();
