import { excluirImportacoesExceto } from './dados.js';

// Função utilitária para excluir todas as importações exceto a de 18:17:52
window.excluirImportacoesExceto181752 = function() {
	excluirImportacoesExceto('18:17:52');
	window.preencherSelectImportacoes();
	alert('Importações excluídas, exceto a de 18:17:52');
}
// Função para salvar vendas do dia (por planilha selecionada)
window.salvarVendasDoDia = function salvarVendasDoDia() {
	const select = document.getElementById('selectImportacaoVendas');
	const idxImport = select ? parseInt(select.value) : 0;
	const importacoes = listarImportacoesSalvas();
	const planilha = importacoes[idxImport]?.data || '';
	let vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
	// Marca vendas do dia como "salvas" (poderia ser por data, mas aqui é por planilha)
	vendas = vendas.map(v => v.planilha === planilha ? { ...v, salva: true } : v);
	localStorage.setItem('vendas', JSON.stringify(vendas));
	alert('Vendas do dia salvas para a planilha selecionada!');
}

// Função para atualizar fechamento filtrando vendas pela planilha selecionada
window.atualizarFechamento = function atualizarFechamento() {
	const select = document.getElementById('selectImportacaoFechamento');
	const idxImport = select ? parseInt(select.value) : 0;
	const importacoes = listarImportacoesSalvas();
	const planilha = importacoes[idxImport]?.data || '';
	let vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
	vendas = vendas.filter(v => v.planilha === planilha);
	// Atualiza totais na tela
	let totalGeral = 0, comissaoTotal = 0, comissaoNaira = 0, comissaoLuiza = 0;
	let percentualComissao = 0;
	vendas.forEach(v => {
		totalGeral += v.valor;
	});
	// Lógica de comissão por faixa
	if (totalGeral > 2500) percentualComissao = 45;
	else if (totalGeral > 2000) percentualComissao = 40;
	else if (totalGeral > 1500) percentualComissao = 35;
	else if (totalGeral > 1000) percentualComissao = 30;
	else if (totalGeral > 300) percentualComissao = 25;
	else percentualComissao = 0;
	if (percentualComissao > 0) percentualComissao += 5; // Pagamento à vista só se houver comissão
	comissaoTotal = percentualComissao > 0 ? totalGeral * (percentualComissao / 100) : 0;
	// Divisão entre vendedoras
	vendas.forEach(v => {
		if (v.vendedora === 'Naira') comissaoNaira += v.valor * (percentualComissao / 100);
		if (v.vendedora === 'Luiza') comissaoLuiza += v.valor * (percentualComissao / 100);
	});
	document.getElementById('totalGeral').textContent = totalGeral.toFixed(2);
	document.getElementById('comissaoTotal').textContent = comissaoTotal.toFixed(2);
	document.getElementById('percentualComissao').textContent = percentualComissao;
	document.getElementById('comissaoNaira').textContent = comissaoNaira.toFixed(2);
	document.getElementById('comissaoLuiza').textContent = comissaoLuiza.toFixed(2);
	document.getElementById('acertoFornecedor').textContent = (totalGeral - comissaoTotal).toFixed(2);
}
import { listarImportacoesSalvas, salvarVendas } from './dados.js';
import { importarPDF } from './pdf-import.js';

// Função global para registrar venda vinculada à planilha selecionada
window.registrarVenda = function registrarVenda() {
	const select = document.getElementById('selectImportacaoVendas');
	const idxImport = select ? parseInt(select.value) : 0;
	const importacoes = listarImportacoesSalvas();
	const estoque = importacoes[idxImport]?.itens || [];
	const codigo = document.getElementById('codigoVenda').value.trim();
	const quantidade = parseInt(document.getElementById('quantidadeVenda').value);
	const vendedora = document.getElementById('vendedoraVenda').value;
	const cliente = document.getElementById('clienteVenda').value.trim();
	if (!codigo || !quantidade || !vendedora) {
		alert('Preencha código, quantidade e vendedora!');
		return;
	}
	// Buscar item no estoque selecionado
	const itemEstoque = estoque.find(item => String(item.codigo) === codigo);
	if (!itemEstoque) {
		alert('Código não encontrado na planilha selecionada!');
		return;
	}
	// Montar venda
	const venda = {
		codigo,
		quantidade,
		vendedora,
		cliente,
		valor: itemEstoque.valorUnitario * quantidade,
		data: new Date().toLocaleString(),
		planilha: importacoes[idxImport]?.data || ''
	};
	// Salvar venda no localStorage
	let vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
	vendas.push(venda);
	localStorage.setItem('vendas', JSON.stringify(vendas));
	// Atualizar tabela de vendas na tela
	atualizarTabelaVendas();
	// Limpar campos
	document.getElementById('codigoVenda').value = '';
	document.getElementById('quantidadeVenda').value = 1;
	document.getElementById('clienteVenda').value = '';
}

// Atualizar tabela de vendas na tela
window.atualizarTabelaVendas = function atualizarTabelaVendas() {
	const tbody = document.querySelector('#vendas table tbody');
	if (!tbody) return;
	let vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
	tbody.innerHTML = '';
	vendas.forEach(venda => {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td>${venda.codigo}</td><td>${venda.quantidade}</td><td>${venda.vendedora}</td><td>${venda.cliente}</td><td>R$ ${venda.valor.toFixed(2)}</td>`;
		tbody.appendChild(tr);
	});
}

// Atualizar tabela ao carregar página
window.addEventListener('DOMContentLoaded', () => {
	window.atualizarTabelaVendas();
});
// (Removido import duplicado)

// Preencher selects de importações salvas nas abas Vendas e Fechamento
window.preencherSelectImportacoes = function preencherSelectImportacoes() {
	const importacoes = listarImportacoesSalvas();
	const selectVendas = document.getElementById('selectImportacaoVendas');
	const selectFechamento = document.getElementById('selectImportacaoFechamento');
	if (selectVendas) {
		selectVendas.innerHTML = '';
		importacoes.forEach((imp, idx) => {
			const opt = document.createElement('option');
			opt.value = idx;
			opt.textContent = imp.data;
			selectVendas.appendChild(opt);
		});
	}
	if (selectFechamento) {
		selectFechamento.innerHTML = '';
		importacoes.forEach((imp, idx) => {
			const opt = document.createElement('option');
			opt.value = idx;
			opt.textContent = imp.data;
			selectFechamento.appendChild(opt);
		});
	}
}

// Chamar ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
	window.preencherSelectImportacoes();
});
// Função global para exportar tabela de importações para Excel
window.exportarExcel = function exportarExcel() {
	const tabela = document.getElementById('tabelaImportacoes');
	if (!tabela) {
		alert('Tabela não encontrada!');
		return;
	}
	// Montar array de dados
	const ws_data = [];
	// Cabeçalho
	const ths = tabela.querySelectorAll('thead th');
	ws_data.push(Array.from(ths).map(th => th.innerText));
	// Linhas
	const trs = tabela.querySelectorAll('tbody tr');
	trs.forEach(tr => {
		const tds = tr.querySelectorAll('td');
		ws_data.push(Array.from(tds).map(td => td.innerText));
	});
	// Criar planilha
	const ws = XLSX.utils.aoa_to_sheet(ws_data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Importacoes');
	// Salvar arquivo
	XLSX.writeFile(wb, 'importacoes.xlsx');
}
import { abrirAba } from './abas.js';
import { atualizarResumo } from './resumo.js';

window.abrirAba = abrirAba;
window.importarPDF = importarPDF;
window.atualizarResumo = atualizarResumo;
