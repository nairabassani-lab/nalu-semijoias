// abas.js
export function abrirAba(aba) {
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(aba).classList.add('active');
  const idx = ['importacoes', 'vendas', 'fechamento'].indexOf(aba);
  if (idx !== -1) {
    document.querySelectorAll('nav button')[idx].classList.add('active');
  }
}
