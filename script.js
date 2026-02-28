/***********************
 * VARIÁVEIS GLOBAIS
 ***********************/
let usuarioLogado = "";
let catalogo = {};              // codigo -> { valor }
let vendas = [];                // vendas do mês
let estoqueRecebido = {};       // codigo -> qtd recebida
let vendedoras = ["Naira", "Luiza"];

/***********************
 * LOGIN
 ***********************/
function login() {
  const usuario = document.getElementById("usuario").value;
  if (!usuario) {
    alert("Selecione o usuário");
    return;
  }

  usuarioLogado = usuario;
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

/***********************
 * IMPORTAR PDF (ROBUSTO)
 ***********************/
async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) {
    alert("Selecione um PDF");
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    const pdf = await pdfjsLib
      .getDocument(new Uint8Array(reader.result))
      .promise;

    catalogo = {};
    estoqueRecebido = {};
    let itensProcessados = 0;

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      const tokens = content.items
        .map(i => i.str.trim())
        .filter(Boolean);

      for (let i = 0; i < tokens.length; i++) {
        // Código (5 ou 6 dígitos)
        if (/^\d{5,6}$/.test(tokens[i])) {
          const codigo = tokens[i];

          let qtd = null;
          let valor = null;

          for (let j = i + 1; j < i + 12 && j < tokens.length; j++) {
            if (qtd === null && /^\d+$/.test(tokens[j])) {
              qtd = Number(tokens[j]);
            }

            if (
              valor === null &&
              tokens[j] === "R$" &&
              tokens[j + 1]
            ) {
              valor = Number(
                tokens[j + 1].replace(".", "").replace(",", ".")
              );
            }

            if (qtd !== null && valor !== null) break;
          }

          if (qtd !== null && valor !== null) {
            catalogo[codigo] = { valor };
            estoqueRecebido[codigo] =
              (estoqueRecebido[codigo] || 0) + qtd;
            itensProcessados++;
          }
        }
      }
    }

    mostrarRelatorioPDF();
    alert(`PDF importado com sucesso! ${itensProcessados} itens processados.`);
  };

  reader.readAsArrayBuffer(file);
}

/***********************
 * REGISTRAR VENDA
 ***********************/
function adicionarVenda() {
  const codigo = document.getElementById("codigo").value.trim();
  const qtd = Number(document.getElementById("quantidade").value);

  if (!catalogo[codigo]) {
    alert("Código não encontrado no catálogo");
    return;
  }

  const valorUnit = catalogo[codigo].valor;
  const total = qtd * valorUnit;

  vendas.push({
    codigo,
    qtd,
    valorUnit,
    total,
    vendedora: usuarioLogado,
    cliente: "",
    data: new Date()
  });

  atualizarTabela();
  calcularResumo();

  document.getElementById("codigo").value = "";
  document.getElementById("quantidade").value = 1;
}

/***********************
 * TABELA DE VENDAS
 ***********************/
function atualizarTabela() {
  const tbody = document.getElementById("listaVendas");
  tbody.innerHTML = "";

  vendas.forEach((v, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${v.codigo}</td>
      <td>${v.qtd}</td>
      <td>R$ ${v.valorUnit.toFixed(2)}</td>
      <td>R$ ${v.total.toFixed(2)}</td>
    `;

    tbody.appendChild(tr);
  });
}

/***********************
 * RESUMO E COMISSÕES
 ***********************/
function calcularResumo() {
  const totalVenda = vendas.reduce((s, v) => s + v.total, 0);

  let percentual = 0;
  if (totalVenda >= 5000) percentual = 10;
  else if (totalVenda >= 3000) percentual = 8;
  else percentual = 5;

  const comissaoTotal = totalVenda * (percentual / 100);
  const fornecedor = totalVenda - comissaoTotal;

  document.getElementById("totalVenda").innerText =
    totalVenda.toFixed(2);
  document.getElementById("percentual").innerText = percentual;
  document.getElementById("comissao").innerText =
    comissaoTotal.toFixed(2);
  document.getElementById("fornecedor").innerText =
    fornecedor.toFixed(2);
}

/***********************
 * RELATÓRIO DO PDF
 ***********************/
function mostrarRelatorioPDF() {
  console.log("RELATÓRIO DE ESTOQUE RECEBIDO");
  Object.keys(estoqueRecebido).forEach(cod => {
    console.log(
      `Código ${cod} - Recebido: ${estoqueRecebido[cod]}`
    );
  });
}

/***********************
 * RELATÓRIO FINAL
 ***********************/
function gerarRelatorio() {
  let texto = "RELATÓRIO DE VENDAS\n\n";

  vendas.forEach(v => {
    texto += `Código: ${v.codigo} | Qtd: ${v.qtd} | Total: R$ ${v.total.toFixed(
      2
    )} | Vendedora: ${v.vendedora}\n`;
  });

  alert(texto);
}
