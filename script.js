/*********************************
 * CONFIGURAÇÃO PDF.JS (VERSÃO 2)
 *********************************/
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

/*********************************
 * VARIÁVEIS GLOBAIS
 *********************************/
let usuarioLogado = "";
let vendas = [];
let catalogo = {};

/*********************************
 * LOGIN
 *********************************/
function login() {
  const user = document.getElementById("usuario").value;
  if (!user) return alert("Selecione o usuário");

  usuarioLogado = user;
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

/*********************************
 * IMPORTAR PDF
 *********************************/
async function importarPDF() {
  const fileInput = document.getElementById("pdfUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecione um PDF primeiro");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const typedarray = new Uint8Array(this.result);

    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    let blocos = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      const textos = content.items
        .map(i => i.str.trim())
        .filter(t => t !== "");

      blocos = blocos.concat(textos);
    }

    processarPDF(blocos);
  };

  reader.readAsArrayBuffer(file);
}

/*********************************
 * PROCESSAMENTO DO PDF
 *********************************/
function processarPDF(blocos) {
  let encontrados = 0;

  for (let i = 0; i < blocos.length; i++) {

    // Código (somente números, geralmente 5 ou 6 dígitos)
    if (/^\d{5,}$/.test(blocos[i])) {
      const codigo = blocos[i];

      let descricao = "";
      let quantidade = 0;
      let valorUnitario = 0;

      let j = i + 1;

      // Descrição (até achar quantidade)
      while (j < blocos.length && !/^\d+$/.test(blocos[j])) {
        if (!blocos[j].includes("R$")) {
          descricao += blocos[j] + " ";
        }
        j++;
      }

      // Quantidade
      if (/^\d+$/.test(blocos[j])) {
        quantidade = parseInt(blocos[j]);
        j++;
      }

      // Valor unitário
      while (j < blocos.length) {
        if (blocos[j].includes("R$")) {
          valorUnitario = parseFloat(
            blocos[j]
              .replace("R$", "")
              .replace(".", "")
              .replace(",", ".")
              .trim()
          );
          break;
        }
        j++;
      }

      if (!isNaN(valorUnitario) && valorUnitario > 0) {
        catalogo[codigo] = {
          nome: descricao.trim(),
          valor: valorUnitario,
          estoque: 999
        };
        encontrados++;
      }
    }
  }

  alert(`PDF importado com sucesso! ${encontrados} produtos carregados.`);
}

/*********************************
 * REGISTRO DE VENDAS
 *********************************/
function adicionarVenda() {
  const codigo = document.getElementById("codigo").value.trim();
  const qtd = parseInt(document.getElementById("quantidade").value);

  if (!catalogo[codigo]) {
    alert("Código não encontrado no catálogo");
    return;
  }

  vendas.push({
    codigo,
    qtd,
    valor: catalogo[codigo].valor
  });

  atualizarTabela();
}

function atualizarTabela() {
  const tbody = document.getElementById("listaVendas");
  tbody.innerHTML = "";

  let total = 0;

  vendas.forEach(v => {
    const subtotal = v.qtd * v.valor;
    total += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>${v.codigo}</td>
        <td>${v.qtd}</td>
        <td>R$ ${v.valor.toFixed(2)}</td>
        <td>R$ ${subtotal.toFixed(2)}</td>
      </tr>
    `;
  });

  calcularComissao(total);
}

/*********************************
 * COMISSÃO
 *********************************/
function calcularComissao(total) {
  let percentual = 0;

  if (total > 2500) percentual = 50;
  else if (total > 2000) percentual = 45;
  else if (total > 1500) percentual = 40;
  else if (total > 1000) percentual = 35;
  else if (total > 300) percentual = 30;

  const comissao = total * (percentual / 100);
  const fornecedor = total - comissao;

  document.getElementById("totalVenda").innerText = total.toFixed(2);
  document.getElementById("percentual").innerText = percentual;
  document.getElementById("comissao").innerText = comissao.toFixed(2);
  document.getElementById("fornecedor").innerText = fornecedor.toFixed(2);
}

/*********************************
 * RELATÓRIO
 *********************************/
function gerarRelatorio() {
  let texto = `Relatório de Acerto\nVendedora: ${usuarioLogado}\n\n`;

  vendas.forEach(v => {
    texto += `${v.codigo} | Qtd: ${v.qtd} | Total: R$ ${(v.qtd * v.valor).toFixed(2)}\n`;
  });

  texto += `\nTotal Venda: R$ ${document.getElementById("totalVenda").innerText}`;
  texto += `\nComissão: R$ ${document.getElementById("comissao").innerText}`;

  alert(texto);
}
