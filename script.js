async function importarPDF() {
  const file = document.getElementById("pdfUpload").files[0];
  if (!file) return alert("Selecione um PDF");

  const reader = new FileReader();

  reader.onload = async () => {
    const pdf = await pdfjsLib
      .getDocument(new Uint8Array(reader.result))
      .promise;

    estoqueRecebido = {};
    let itensProcessados = 0;

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();

      const tokens = content.items.map(i => i.str.trim()).filter(Boolean);

      for (let i = 0; i < tokens.length; i++) {
        // Código: 5 ou 6 dígitos
        if (/^\d{5,6}$/.test(tokens[i])) {
          const codigo = tokens[i];

          // Procurar quantidade e valor nos próximos tokens
          let qtd = null;
          let valor = null;

          for (let j = i + 1; j < i + 12 && j < tokens.length; j++) {
            if (qtd === null && /^\d+$/.test(tokens[j])) {
              qtd = Number(tokens[j]);
            }

            if (
              valor === null &&
              tokens[j].includes("R$") &&
              tokens[j + 1]
            ) {
              valor = Number(
                tokens[j + 1]
                  .replace(".", "")
                  .replace(",", ".")
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
