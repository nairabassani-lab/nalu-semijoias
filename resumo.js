// resumo.js
import { vendas } from './dados.js';

export function atualizarResumo() {
  let total = vendas.reduce((s, v) => s + v.valor * v.qtd, 0);
  let percentual =
    total >= 2500 ? 45 :
    total >= 2000 ? 40 :
    total >= 1500 ? 35 :
    total >= 1000 ? 30 :
    total >= 300  ? 25 : 0;
  let comissaoTotal = total * percentual / 100;
  let totalNaira = vendas.filter(v => v.vendedora === "Naira").reduce((s, v) => s + v.valor * v.qtd, 0);
  let totalLuiza = vendas.filter(v => v.vendedora === "Luiza").reduce((s, v) => s + v.valor * v.qtd, 0);
  let comissaoNaira = total ? (totalNaira / total) * comissaoTotal : 0;
  let comissaoLuiza = total ? (totalLuiza / total) * comissaoTotal : 0;

  document.getElementById("totalGeral").innerText = total.toFixed(2);
  document.getElementById("percentualComissao").innerText = percentual;
  document.getElementById("comissaoTotal").innerText = comissaoTotal.toFixed(2);
  document.getElementById("comissaoNaira").innerText = comissaoNaira.toFixed(2);
  document.getElementById("comissaoLuiza").innerText = comissaoLuiza.toFixed(2);
  document.getElementById("acertoFornecedor").innerText = (total - comissaoTotal).toFixed(2);
}
