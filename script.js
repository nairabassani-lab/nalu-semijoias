/*************************************
 * CONFIGURAÇÃO PDF.js
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

window.catalogo = {};

/*************************************
 * LOGIN
 *************************************/
function login() {
  const user = document.getElementById("usuario").value;
  if (!user) return alert("Selecione o usuário");

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

  vendas.push({
    codigo,
    descricao: catalogo[codigo].nome,
    qtd,
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

/*************************************
 * COMISSÃO
 *************************************/
function calcularComissao(total) {
  let percentual = 0;

  if (total > 2500) percentual = 45;
  else if (total > 2000) percentual = 40;
  else if (total > 1500) percentual = 35;
  else if (total > 1000) percentual = 30;
  else if (total > 300) percentual = 25;

  percentual += 5; // pagamento à vista

  const comissao = total * (percentual / 100);
  const fornecedor = total - comissao;

  document.getElementById("totalVenda").innerText = total.toFixed(2);
  document.getElementById("percentual").innerText = percentual;
  document.getElementById("comissao").innerText = comissao.toFixed(2);
  document.getElementById("fornecedor").innerText = fornecedor.toFixed(2);
}

/*************************************
 * RELATÓRIO
 *************************************/
function gerarRelatorio() {
  let texto = `RELATÓRIO DE ACERTO\nVendedora: ${usuarioLogado}\n\n`;

  vendas.forEach(v => {
    texto += `${v.codigo} - ${v.descricao}\n`;
    texto += `Qtd: ${v.qtd} | Total: R$ ${(v.qtd * v.valor).toFixed(2)}\n\n`;
  });

  texto += `TOTAL: R$ ${document.getElementById("totalVenda").innerText}\n`;
  texto += `COMISSÃO: R$ ${document.getElementById("comissao").innerText}\n`;
  texto += `FORNECEDOR: R$ ${document.getElementById("fornecedor").innerText}`;

  alert(texto);
}

/*************************************
 * IMPORTAR PDF
 *************************************/
async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) return alert("Selecione um PDF");

  const reader = new FileReader();

  reader.onload = async function () {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise;

    let linhas = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach(item => linhas.push(item.str.trim()));
    }

    processarLinhasPDF(linhas);
  };

  reader.readAsArrayBuffer(file);
}

/*************************************
 * PROCESSAMENTO REAL DO PDF
 *************************************/
function processarLinhasPDF(linhas) {
  let codigoAtual = null;
  let descricaoAtual = [];
  let encontrados = 0;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // Detecta código (somente números 5 ou 6 dígitos)
    if (/^\d{5,6}$/.test(linha)) {
      codigoAtual = linha;
      descricaoAtual = [];
      continue;
    }

    // Linha de valores (quantidade + R$)
    const matchValor = linha.match(/^(\d+)\s+R\$\s?(\d{1,4},\d{2})/);

    if (codigoAtual && matchValor) {
      const valor = parseFloat(matchValor[2].replace(",", "."));

      catalogo[codigoAtual] = {
        nome: descricaoAtual.join(" "),
        valor: valor,
        estoque: 999,
        foto: "https://via.placeholder.com/80"
      };

      encontrados++;
      codigoAtual = null;
      descricaoAtual = [];
      continue;
    }

    // Acumula descrição
    if (codigoAtual) {
      descricaoAtual.push(linha);
    }
  }

  alert(`PDF importado com sucesso! ${encontrados} produtos carregados.`);
}
