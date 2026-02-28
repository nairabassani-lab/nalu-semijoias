
let usuarioLogado = "";
let vendas = [];

function login() {
  const user = document.getElementById("usuario").value;
  if (!user) return alert("Selecione o usuário");

  usuarioLogado = user;
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function adicionarVenda() {
  const codigo = document.getElementById("codigo").value.trim();
  const qtd = parseInt(document.getElementById("quantidade").value);

  if (!catalogo[codigo]) {
    alert("Código não encontrado no catálogo");
    return;
  }

  if (qtd > catalogo[codigo].estoque) {
    alert("Quantidade maior que o estoque disponível");
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

function gerarRelatorio() {
  let texto = `Relatório de Acerto\nVendedora: ${usuarioLogado}\n\n`;

  vendas.forEach(v => {
    texto += `${v.codigo} | Qtd: ${v.qtd} | Total: R$ ${(v.qtd * v.valor).toFixed(2)}\n`;
  });

  texto += `\nTotal Venda: R$ ${document.getElementById("totalVenda").innerText}`;
  texto += `\nComissão: R$ ${document.getElementById("comissao").innerText}`;

  alert(texto);
}
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

    let textoCompleto = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      textoCompleto += strings.join(" ") + " ";
    }

    processarTextoPDF(textoCompleto);
  };

  reader.readAsArrayBuffer(file);
}
