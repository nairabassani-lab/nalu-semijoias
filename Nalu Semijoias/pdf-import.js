// pdf-import.js
import { salvarEstoque, salvarCabecalho, salvarImportacaoComData } from './dados.js';

export async function importarPDF() {
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

function processarPDF(blocos) {
      // Salvar importação com data para histórico
      const dataImportacao = new Date().toLocaleString();
    // Função para categorizar pelo prefixo da descrição
    function categoriaPorDescricao(desc) {
      if (!desc) return 'Outros';
      if (/^(BR|Br|br)/.test(desc)) return 'Brinco';
      if (/^Argola/i.test(desc)) return 'Argola';
      if (/^AN/i.test(desc)) return 'Anel';
      if (/^escapulario|escapulário/i.test(desc)) return 'Escapulário';
      if (/^gargantilha/i.test(desc)) return 'Gargantilha';
      if (/^(CO|Co)/.test(desc)) return 'Corrente';
      if (/^(PU|Pu)/.test(desc)) return 'Pulseira';
      return 'Outros';
    }
  var debugItens = [];
  var itens = [];
  var i = 0;
  var cabecalhoDiv = document.getElementById("cabecalhoImportacao");

  while (i < blocos.length) {
    // Procurar início de item: código de barras (5/6 dígitos)
    if (/^\d{5,6}$/.test(blocos[i])) {
      let codigo = blocos[i];
      let descricao = '';
      let quantidade = null;
      let valorUnitario = null;
      let valorTotal = null;
      // Descrição: próximo campo textual que não seja código, valor, quantidade ou referência (aceita referência vazia)
      let j = i+1;
      while (j < blocos.length && (
        blocos[j] === '' ||
        /^\d{5,6}$/.test(blocos[j]) || // código de barras
        /^R\$/.test(blocos[j]) || // valor
        /^[1-9]\d*$/.test(blocos[j]) // quantidade
      )) {
        j++;
      }
      // Se o próximo campo for referência (alfanumérico >=4, pode conter ponto), pula para o próximo campo textual
      if (j < blocos.length && /^[A-Za-z0-9\.]{4,}$/.test(blocos[j])) {
        j++;
        while (j < blocos.length && (
          blocos[j] === '' ||
          /^\d{5,6}$/.test(blocos[j]) ||
          /^R\$/.test(blocos[j]) ||
          /^[1-9]\d*$/.test(blocos[j])
        )) {
          j++;
        }
      }
      // Descrição só é válida se começar com os prefixos desejados (inclui escapulário com acento, Br para brinco e Pu para pulseira)
      const descRegex = /^(PU|Pu|CO|gargantilha|BR|Br|escapulario|escapulário|AN|Argola)/i;
      descricao = '';
      if (blocos[j] && descRegex.test(blocos[j])) {
        descricao = blocos[j];
      }
      // Quantidade: próximo campo numérico
      let k = j+1;
      while (k < blocos.length && !/^[1-9]\d*$/.test(blocos[k])) { k++; }
      if (k < blocos.length) quantidade = parseInt(blocos[k]);
      // Valor unitário: próximo campo R$
      let l = k+1;
      while (l < blocos.length && !/^R\$\s*\d+,\d{2}$/.test(blocos[l])) { l++; }
      if (l < blocos.length) valorUnitario = parseFloat(blocos[l].replace('R$', '').replace(',', '.').trim());
      // Valor total: próximo campo R$ após valor unitário
      let m = l+1;
      while (m < blocos.length && !/^R\$\s*\d+,\d{2}$/.test(blocos[m])) { m++; }
      if (m < blocos.length) valorTotal = parseFloat(blocos[m].replace('R$', '').replace(',', '.').trim());
      // Só adiciona se todos os campos principais forem encontrados
      if (codigo && descricao && quantidade !== null && valorUnitario !== null && valorTotal !== null) {
        itens.push({ codigo, descricao, quantidade, valorUnitario, valorTotal });
        debugItens.push({ codigo, descricao, quantidade, valorUnitario, valorTotal });
      }
      // Avança para o próximo possível item
      i = m;
    } else {
      i++;
    }
  }

  if (cabecalhoDiv) {
    cabecalhoDiv.innerHTML += `<br><strong style='color:orange'>[DEBUG] Itens extraídos: ${debugItens.length}</strong>`;
    if (debugItens.length > 0) {
      cabecalhoDiv.innerHTML += `<br><strong style='color:orange'>Primeiro item:</strong> <pre style='color:orange'>${JSON.stringify(debugItens[0], null, 2)}</pre>`;
    }
  }

  const totalQtd = itens.reduce((soma, item) => soma + item.quantidade, 0);

  function extrairCabecalho(blocos) {
    const get = (label) => {
      const idx = blocos.findIndex(b => b.includes(label));
      if (idx !== -1) return blocos[idx].replace(label, '').trim();
      return '';
    };
    return {
      tipoPreco: blocos.find(b => b.includes('Tipo de Preço')) || '',
      nome: blocos.find(b => b.includes('Gravataí')) || '',
      dataAcerto: get('Data Acerto:'),
      cpf: get('CPF:'),
      endereco: blocos.find(b => b.includes('Endereço')) || '',
      pedido: get('Pedido Nº'),
      dataCriacao: get('Data Criação:'),
      usuario: get('Usuário:'),
    };
  }

  let cabecalho = extrairCabecalho(blocos);
  cabecalho.dataImportacao = new Date().toLocaleString();
  salvarCabecalho(cabecalho);

  if (itens.length === 0) {
    alert("PDF importado, mas nenhum item identificado.");
    return;
  }
  // Salva a planilha importada com a data
  salvarImportacaoComData(itens, dataImportacao);

  salvarEstoque(itens);

  if (cabecalhoDiv && cabecalho) {
    cabecalhoDiv.innerHTML = `
      <strong>Tipo de Preço:</strong> ${cabecalho.tipoPreco || ''} <br>
      <strong>Nome:</strong> ${cabecalho.nome || ''} <br>
      <strong>Data Acerto:</strong> ${cabecalho.dataAcerto || ''} <br>
      <strong>CPF:</strong> ${cabecalho.cpf || ''} <br>
      <strong>Endereço:</strong> ${cabecalho.endereco || ''} <br>
      <strong>Pedido Nº:</strong> ${cabecalho.pedido || ''} <br>
      <strong>Data Criação:</strong> ${cabecalho.dataCriacao || ''} <br>
      <strong>Usuário:</strong> ${cabecalho.usuario || ''} <br>
      <strong>Data da Importação:</strong> ${cabecalho.dataImportacao || ''}<br>
      <strong>Total de Quantidades Importadas:</strong> <span style="color:blue;">${totalQtd}</span>
    `;
  }

  const tabela = document.getElementById("tabelaImportacoes");
  if (tabela) {
    const tbody = tabela.querySelector("tbody");
    tbody.innerHTML = "";
    let totalQtd = 0;
    let totalValor = 0;
    let categorias = {};
    itens.forEach(item => {
      // Se valor total for zero ou ausente, calcula como quantidade * valor unitário
      let valorTotalCalc = (item.valorTotal && item.valorTotal > 0) ? item.valorTotal : (item.quantidade * item.valorUnitario);
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item.codigo}</td><td>${item.descricao}</td><td>${item.quantidade}</td><td>R$ ${item.valorUnitario.toFixed(2)}</td><td>R$ ${valorTotalCalc.toFixed(2)}</td>`;
      tbody.appendChild(tr);
      totalQtd += item.quantidade;
      totalValor += valorTotalCalc;
      // Totalizador de categorias
      const cat = categoriaPorDescricao(item.descricao);
      if (!categorias[cat]) categorias[cat] = 0;
      categorias[cat] += item.quantidade;
    });
    // Adiciona linha de totais
    if (itens.length > 0) {
      const trTotal = document.createElement("tr");
      trTotal.style.fontWeight = 'bold';
      trTotal.innerHTML = `<td colspan=\"2\">Totais</td><td>${totalQtd}</td><td></td><td>R$ ${totalValor.toFixed(2)}</td>`;
      tbody.appendChild(trTotal);
    }
    // Adiciona totalizador de categorias abaixo da tabela
    let resumoCat = '<div style="margin-top:10px;font-weight:bold;">Total por categoria:<ul style="margin:0;">';
    Object.entries(categorias).forEach(([cat, qtd]) => {
      resumoCat += `<li>${cat}: ${qtd}</li>`;
    });
    resumoCat += '</ul></div>';
    tabela.insertAdjacentHTML('afterend', resumoCat);
    tabela.style.display = itens.length ? "table" : "none";
  }

  alert(`PDF importado com sucesso! ${itens.length} itens carregados.`);
}
