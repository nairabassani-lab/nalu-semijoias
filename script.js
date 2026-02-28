/*************************************
 * CONFIGURAÇÃO PDF.js (OBRIGATÓRIA)
 *************************************/
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
}

/*************************************
 * VARIÁVEIS GLOBAIS
 *************************************/
let usuarioLogado = "";
let vendas = [];

/*
  Catálogo global
  Será preenchido via PDF
*/
if (typeof catalogo === "undefined") {
  window.catalogo = {};
}

/*************************************
 * LOGIN
 *************************************/
function login() {
  const user = document.getElementById("usuario").value;

  if (!user) {
    alert("Selecione o usuário");
    return;
  }

  usuarioLogado = user;
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

/*************************************
 * ADICIONAR VENDA
 *************************************/
function adicionarVenda() {
  const codigo = document.getElementById("codigo").value.trim();
  const qtd = parseInt(document.getElementById("quantidade").value);

  if (!catalogo[codigo]) {
    alert("Código não encontrado no catálogo");
    return;
  }

  if (!qtd || qtd <= 0) {
    alert("Quantidade inválida");
    return;
  }

  vendas.push({
    codigo: codigo,
    descricao: catalogo[codigo].nome,
    qtd: qtd,
    valor: catalogo[codigo].valor
  });

  atualizarTabela();
}

/*************************************
 * ATUALIZAR TABELA
 *************************************/
function atualizarTabela() {
  const tbody = document.getElementById("listaVendas");
  tbody.innerHTML = "";

  let total = 0;

  vendas.forEach(v => {
    const subtotal = v.qtd * v.valor;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.codigo}</td>
      <td>${v.qtd}</td>
      <td>R$ ${v.valor.toFixed(2)}</td>
      <td>R$ ${subtotal.toFixed(2)}</td>
    `;

    tbody.appendChild(tr);
  });

  calcularComissao(total);
}

/*************************************
 * CÁLCULO DE COMISSÃO
 * (já inclui +5% pagamento à vista)
 *************************************/
function calcularComissao(total) {
  let percentual = 0;

  if (total > 2500) percentual = 45;
  else if (total > 2000) percentual = 40;
  else if (total > 1500) percentual = 35;
  else if (total > 1000) percentual = 30;
  else if (total > 300) percentual = 25;

  // bônus pagamento à vista
  percentual += 5;

  const comissao = total * (percentual / 100);
  const fornecedor = total - comissao;

  document.getElementById("totalVenda").innerText = total.toFixed(2);
  document.getElementById("percentual").innerText = percentual;
  document.getElementById("comissao").innerText = comissao.toFixed(2);
  document.getElementById("fornecedor").innerText = fornecedor.toFixed(2);
}

/*************************************
 * GERAR RELATÓRIO
 *************************************/
function gerarRelatorio() {
  let texto = `RELATÓRIO DE ACERTO\n`;
  texto += `Vendedora: ${usuarioLogado}\n\n`;

  vendas.forEach(v => {
    texto += `${v.codigo} - ${v.descricao}\n`;
    texto += `Qtd: ${v.qtd} | Total: R$ ${(v.qtd * v.valor).toFixed(2)}\n\n`;
  });

  texto += `TOTAL DA VENDA: R$ ${document.getElementById("totalVenda").innerText}\n`;
  texto += `COMISSÃO: R$ ${document.getElementById("comissao").innerText}\n`;
  texto += `VALOR FORNECEDOR: R$ ${document.getElementById("fornecedor").innerText}`;

  alert(texto);
}

/*************************************
 * IMPORTAR PDF
 *************************************/
async function importarPDF() {
  const fileInput = document.getElementById("pdfUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecione um PDF primeiro");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    try {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let textoCompleto = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        textoCompleto += strings.join(" ") + " ";
      }

      processarTextoPDF(textoCompleto);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao ler o PDF. Ele pode ser apenas imagem.");
    }
  };

  reader.readAsArrayBuffer(file);
}

/*************************************
 * PROCESSAR TEXTO DO PDF
 *************************************/
function processarTextoPDF(texto) {
  /*
    Layout esperado:
    495987 PU Ouro Berloque Medalha São Bento 1 R$ 144,90 R$ 0,00 R$ 144,90
  */

  const textoLimpo = texto
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const regex =
    /(\d{5,6})\s+(.+?)\s+(\d+)\s+R\$\s?(\d{1,4},\d{2})/g;

  let encontrados = 0;
  let match;

  while ((match = regex.exec(textoLimpo)) !== null) {
    const codigo = match[1];
    const descricao = match[2].trim();
    const valor = parseFloat(match[4].replace(",", "."));

    if (!catalogo[codigo]) {
      catalogo[codigo] = {
        nome: descricao,
        valor: valor,
        estoque: 999,
        foto: "https://via.placeholder.com/80"
      };
      encontrados++;
    }
  }

  if (encontrados === 0) {
    alert(
      "PDF importado, mas nenhum produto foi identificado.\n" +
      "Verifique se o layout do PDF é o mesmo do catálogo padrão."
    );
  } else {
    alert(`PDF importado com sucesso! ${encontrados} produtos carregados.`);
  }
}
