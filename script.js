pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

let usuarioLogado = "";
let vendas = [];
let estoqueRecebido = {};

function login() {
  const user = document.getElementById("usuario").value;
  if (!user) return alert("Selecione o usuário");
  usuarioLogado = user;
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function adicionarVenda() {
  const codigo = codigoEl().value.trim();
  const qtd = Number(qtdEl().value);
  const vendedora = vendEl().value;
  const cliente = clienteEl().value;
  const mesAno = mesAnoEl().value;

  if (!codigo || !qtd || !vendedora || !mesAno)
    return alert("Preencha código, quantidade, vendedora e mês");

  if (!catalogo[codigo]) return alert("Código não encontrado");

  vendas.push({
    codigo,
    qtd,
    valor: catalogo[codigo].valor,
    vendedora,
    cliente,
    mesAno
  });

  atualizarTabela();
  limparCampos();
}

function atualizarTabela() {
  const tbody = document.getElementById("listaVendas");
  tbody.innerHTML = "";

  let totalGeral = 0;
  let porVendedora = { Naira: 0, Luiza: 0 };

  vendas.forEach((v, i) => {
    const subtotal = v.qtd * v.valor;
    totalGeral += subtotal;
    porVendedora[v.vendedora] += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>${v.codigo}</td>
        <td>${v.qtd}</td>
        <td contenteditable onblur="editarCliente(${i}, this.innerText)">
          ${v.cliente || ""}
        </td>
        <td>${v.vendedora}</td>
        <td>R$ ${subtotal.toFixed(2)}</td>
      </tr>`;
  });

  calcularComissao(totalGeral, porVendedora);
}

function calcularPercentual(total) {
  if (total > 2500) return 50;
  if (total > 2000) return 45;
  if (total > 1500) return 40;
  if (total > 1000) return 35;
  if (total > 300) return 30;
  return 0;
}

function calcularComissao(total, porVendedora) {
  const percentual = calcularPercentual(total);
  let totalComissao = 0;

  let resumoHTML = "<h3>Comissão por Vendedora</h3>";

  for (let v in porVendedora) {
    const com = porVendedora[v] * (percentual / 100);
    totalComissao += com;
    resumoHTML += `<p>${v}: R$ ${porVendedora[v].toFixed(2)} | Comissão: R$ ${com.toFixed(2)}</p>`;
  }

  totalVendaEl().innerText = total.toFixed(2);
  percentualEl().innerText = percentual;
  comissaoEl().innerText = totalComissao.toFixed(2);
  fornecedorEl().innerText = (total - totalComissao).toFixed(2);
  document.getElementById("resumoVendedoras").innerHTML = resumoHTML;
}

async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) return alert("Selecione um PDF");

  const reader = new FileReader();
  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result)).promise;
    let encontrados = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      const linhas = text.items.map(i => i.str).join(" ");

      const regex = /(\d{5,6}).*?(\d+)\sR\$\s([\d.,]+)/g;
      let match;

      while ((match = regex.exec(linhas)) !== null) {
        const codigo = match[1];
        const qtd = Number(match[2]);
        const valor = Number(match[3].replace(".", "").replace(",", "."));

        catalogo[codigo] = { valor };
        estoqueRecebido[codigo] = (estoqueRecebido[codigo] || 0) + qtd;
        encontrados++;
      }
    }

    mostrarRelatorioPDF();
    alert(`PDF importado com sucesso! ${encontrados} itens processados.`);
  };

  reader.readAsArrayBuffer(file);
}

function mostrarRelatorioPDF() {
  let html = "<h3>Relatório de Estoque (PDF)</h3><ul>";
  for (let c in estoqueRecebido) {
    const vendido = vendas
      .filter(v => v.codigo === c)
      .reduce((s, v) => s + v.qtd, 0);
    html += `<li>${c} | Recebido: ${estoqueRecebido[c]} | Vendido: ${vendido}</li>`;
  }
  html += "</ul>";
  document.getElementById("relatorioPDF").innerHTML = html;
}

/* UTIL */
const codigoEl = () => document.getElementById("codigo");
const qtdEl = () => document.getElementById("quantidade");
const vendEl = () => document.getElementById("vendedoraVenda");
const clienteEl = () => document.getElementById("cliente");
const mesAnoEl = () => document.getElementById("mesAno");
const totalVendaEl = () => document.getElementById("totalVenda");
const percentualEl = () => document.getElementById("percentual");
const comissaoEl = () => document.getElementById("comissao");
const fornecedorEl = () => document.getElementById("fornecedor");

function editarCliente(index, valor) {
  vendas[index].cliente = valor;
}

function limparCampos() {
  codigoEl().value = "";
  qtdEl().value = 1;
  vendEl().value = "";
  clienteEl().value = "";
}
