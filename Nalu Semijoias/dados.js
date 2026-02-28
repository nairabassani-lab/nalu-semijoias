// Função para excluir todas as importações, exceto a de um horário específico
export function excluirImportacoesExceto(horario) {
  let historico = JSON.parse(localStorage.getItem('historicoImportacoes') || '[]');
  historico = historico.filter(imp => imp.data.includes(horario));
  localStorage.setItem('historicoImportacoes', JSON.stringify(historico));
}
// Função para salvar uma importação com data
export function salvarImportacaoComData(itens, dataImportacao) {
  let historico = JSON.parse(localStorage.getItem('historicoImportacoes') || '[]');
  historico.push({ data: dataImportacao, itens });
  localStorage.setItem('historicoImportacoes', JSON.stringify(historico));
}

// Função para listar importações salvas
export function listarImportacoesSalvas() {
  return JSON.parse(localStorage.getItem('historicoImportacoes') || '[]');
}
// dados.js
const hoje = new Date();
const MES = String(hoje.getMonth() + 1).padStart(2, "0");
const ANO = hoje.getFullYear();

export const KEY_ESTOQUE = `estoque_${ANO}_${MES}`;
export const KEY_VENDAS = `vendas_${ANO}_${MES}`;

export let estoque = JSON.parse(localStorage.getItem(KEY_ESTOQUE)) || [];
export let vendas = JSON.parse(localStorage.getItem(KEY_VENDAS)) || [];
export let cabecalhoImportacao = JSON.parse(localStorage.getItem('cabecalhoImportacao')) || null;

export function salvarEstoque(novoEstoque) {
  estoque = novoEstoque;
  localStorage.setItem(KEY_ESTOQUE, JSON.stringify(estoque));
}

export function salvarVendas(novasVendas) {
  vendas = novasVendas;
  localStorage.setItem(KEY_VENDAS, JSON.stringify(vendas));
}

export function salvarCabecalho(cabecalho) {
  cabecalhoImportacao = cabecalho;
  localStorage.setItem('cabecalhoImportacao', JSON.stringify(cabecalho));
}
