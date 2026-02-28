/********************************
 * PDF.JS CONFIG
 ********************************/
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

/********************************
 * DATA / MÊS / ANO
 ********************************/
const hoje = new Date();
const MES = String(hoje.getMonth() + 1).padStart(2, "0");
const ANO = hoje.getFullYear();

const KEY_ESTOQUE = `estoque_${ANO}_${MES}`;
const KEY_VENDAS = `vendas_${ANO}_${MES}`;

/********************************
 * DADOS
 ********************************/
let estoque = JSON.parse(localStorage.getItem(KEY_ESTOQUE)) || [];
let vendas = JSON.parse(localStorage.getItem(KEY_VENDAS)) || [];

/********************************
 * IMPORTAR PDF
 ********************************/
async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) {
    alert("Selecione o PDF");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
    let blocos = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      content.items.forEach(i => {
        const t = i.str.trim();
        if (t) blocos.push(t);
      });
    }

    processarPDF(blocos);
  };

  reader.readAsArrayBuffer(file);
}

/********************************
 * PROCESSAMENTO REAL DO PDF
 ********************************/
function processarPDF(blocos) {
  let itens = [];
  let i = 0;

  while (i < blocos.length) {
    const atual = blocos[i];

    // CÓDIGO (5 ou 6 dígitos)
    if (/^\d{5,6}$/.test(atual)) {
      let codigo = atual;
      let quantidade = 1;
      let valor = null;

      // procurar quantidade e valor nos próximos blocos
      for (let j = i + 1; j < i + 25 && j < blocos.length; j++) {
        // quantidade (normalmente 1 ou 2)
        if (/^[1-9]$/.test(blocos[j])) {
          quantidade = parseInt(blocos[j]);
        }

        // valor precedido por R$
        if (
          blocos[j] === "R$" &&
          j + 1 < blocos.length &&
          /^\d+,\d{2}$/.test(blocos[j + 1])
        ) {
          valor = parseFloat(blocos[j + 1].replace(",", "."));
          break;
        }

        // valor já junto
        if (/^R\$\s*\d+,\d{2}$/.test(blocos[j])) {
          valor = parseFloat(
            blocos[j].replace("R$", "").trim().replace(",", ".")
          );
          break;
        }
      }

      if (valor !== null) {
        itens.push({
          codigo,
          quantidade,
          valor
        });
      }
    }

    i++;
  }

  if (itens.length === 0) {
    alert("PDF importado, mas nenhum item identificado.");
    return;
  }

  estoque = itens;
  localStorage.setItem(KEY_ESTOQUE, JSON.stringify(estoque));

  alert(`PDF importado com sucesso! ${itens.length} itens carregados.`);
}

/********************************
 * REGISTRAR VENDA
 ********************************/
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

  localStorage.setItem(KEY_VENDAS, JSON.stringify(vendas));
  atualizarResumo();
}

/********************************
 * FECHAMENTO / COMISSÕES
 ********************************/
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
