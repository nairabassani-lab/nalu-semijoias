let usuarioLogado = "";
let catalogo = {};
let estoqueRecebido = {};
let vendas = [];

const agora = new Date();
const chaveMes = `${agora.getFullYear()}-${agora.getMonth()+1}`;

function salvar() {
  localStorage.setItem("vendas_" + chaveMes, JSON.stringify(vendas));
}

function carregar() {
  vendas = JSON.parse(localStorage.getItem("vendas_" + chaveMes)) || [];
  atualizarTabela();
  calcularResumo();
}

function login() {
  usuarioLogado = document.getElementById("usuario").value;
  if (!usuarioLogado) return alert("Selecione o usuário");
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  carregar();
}

async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  const reader = new FileReader();

  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result)).promise;
    catalogo = {};
    estoqueRecebido = {};

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const text = (await page.getTextContent()).items.map(i => i.str);

      for (let i = 0; i < text.length; i++) {
        if (/^\d{5,6}$/.test(text[i])) {
          const codigo = text[i];
          const qtd = Number(text[i+4]);
          const valor = Number(text[i+6].replace("R$","").replace(".","").replace(",","."));
          catalogo[codigo] = valor;
          estoqueRecebido[codigo] = (estoqueRecebido[codigo]||0)+qtd;
        }
      }
    }

    let html = "<h3>Relatório de Estoque Recebido</h3><ul>";
    Object.keys(estoqueRecebido).forEach(c =>
      html += `<li>${c} - ${estoqueRecebido[c]} peças</li>`
    );
    html += "</ul>";
    document.getElementById("relatorioPDF").innerHTML = html;
  };

  reader.readAsArrayBuffer(file);
}

function adicionarVenda() {
  const codigo = document.getElementById("codigo").value;
  const qtd = Number(document.getElementById("quantidade").value);
  const cliente = document.getElementById("cliente").value;
  const vendedora = document.getElementById("vendedora").value;

  if (!catalogo[codigo]) return alert("Código não encontrado");

  vendas.push({
    codigo, qtd, cliente, vendedora,
    total: qtd * catalogo[codigo]
  });

  salvar();
  atualizarTabela();
  calcularResumo();
}

function atualizarTabela() {
  const tbody = document.getElementById("listaVendas");
  tbody.innerHTML = "";

  vendas.forEach((v,i) => {
    tbody.innerHTML += `
      <tr>
        <td>${v.codigo}</td>
        <td>${v.qtd}</td>
        <td contenteditable onblur="vendas[${i}].cliente=this.innerText;salvar()">${v.cliente}</td>
        <td>${v.vendedora}</td>
        <td>R$ ${v.total.toFixed(2)}</td>
      </tr>`;
  });
}

function calcularResumo() {
  const total = vendas.reduce((s,v)=>s+v.total,0);
  const perc = total>=5000?0.1:total>=3000?0.08:0.05;
  const comissaoTotal = total*perc;

  let n=0,l=0;
  vendas.forEach(v=>{
    if(v.vendedora==="Naira") n+=v.total;
    if(v.vendedora==="Luiza") l+=v.total;
  });

  document.getElementById("totalGeral").innerText = total.toFixed(2);
  document.getElementById("comissaoTotal").innerText = comissaoTotal.toFixed(2);
  document.getElementById("comissaoNaira").innerText = (n/total*comissaoTotal||0).toFixed(2);
  document.getElementById("comissaoLuiza").innerText = (l/total*comissaoTotal||0).toFixed(2);
}
