import ExcelJS from "exceljs";
import db from "../db/connection";

const COR_PRIMARIA = "FF1A1A2E";
const COR_ACCENT = "FF16213E";
const COR_DESTAQUE = "FF0F3460";
const COR_MELHOR_BG = "FFD1FAE5";
const COR_INDISPONIVEL_BG = "FFFEE2E2";
const COR_INDISPONIVEL = "FFF87171";
const COR_HEADER_TEXT = "FFFFFFFF";
const COR_ZEBRA = "FFF8FAFC";
const COR_TEXTO = "FF1E293B";
const COR_MUTED = "FF64748B";

function aplicarEstiloHeader(row: ExcelJS.Row, bgColor: string) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: COR_HEADER_TEXT }, size: 10, name: "Calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
  });
  row.height = 32;
}

function aplicarEstiloCell(
  cell: ExcelJS.Cell,
  opcoes: { bold?: boolean; cor?: string; bg?: string; align?: ExcelJS.Alignment["horizontal"]; numFmt?: string }
) {
  if (opcoes.bg) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opcoes.bg } };
  cell.font = { name: "Calibri", size: 10, bold: opcoes.bold ?? false, color: { argb: opcoes.cor ?? COR_TEXTO } };
  cell.alignment = { horizontal: opcoes.align ?? "left", vertical: "middle" };
  if (opcoes.numFmt) cell.numFmt = opcoes.numFmt;
}

export class ExportService {
  async exportarComparativoCotacao(cotacao_id: number): Promise<ExcelJS.Buffer> {
    const cotacao = await db("cotacoes").where({ id: cotacao_id }).first();
    if (!cotacao) throw new Error("Cotação não encontrada");

    const itens = await db("cotacao_itens").where({ cotacao_id });

    const fornecedores = await db("cotacao_fornecedores as cf")
      .join("fornecedores as f", "cf.fornecedor_id", "f.id")
      .where("cf.cotacao_id", cotacao_id)
      .select(
        "cf.id as cotacao_fornecedor_id",
        "f.id as fornecedor_id",
        "f.nome as fornecedor_nome",
        "cf.status",
        "cf.respondido_em"
      );

    const respostas = await db("cotacao_respostas as cr")
      .join("cotacao_fornecedores as cf", "cr.cotacao_fornecedor_id", "cf.id")
      .where("cf.cotacao_id", cotacao_id)
      .select("cr.*");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CotaWeb";
    workbook.created = new Date();

    this._sheetComparativo(workbook, cotacao, itens, fornecedores, respostas);
    this._sheetResumoFornecedores(workbook, cotacao, itens, fornecedores, respostas);
    this._sheetDetalhado(workbook, itens, fornecedores, respostas);

    return workbook.xlsx.writeBuffer();
  }

  private _sheetComparativo(
    workbook: ExcelJS.Workbook,
    cotacao: any,
    itens: any[],
    fornecedores: any[],
    respostas: any[]
  ) {
    const sheet = workbook.addWorksheet("Comparativo", {
      views: [{ state: "frozen", xSplit: 3, ySplit: 3 }],
    });

    const dataExport = new Date().toLocaleDateString("pt-BR");
    const titulo = cotacao.titulo ?? `Cotação #${cotacao.id}`;
    const totalCols = 3 + fornecedores.length + 2;

    sheet.mergeCells(1, 1, 1, totalCols);
    const cellTitulo = sheet.getCell(1, 1);
    cellTitulo.value = `COMPARATIVO DE COTAÇÕES — ${titulo.toUpperCase()}`;
    cellTitulo.font = { name: "Calibri", size: 13, bold: true, color: { argb: COR_HEADER_TEXT } };
    cellTitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_PRIMARIA } };
    cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 40;

    sheet.mergeCells(2, 1, 2, totalCols);
    const cellSub = sheet.getCell(2, 1);
    cellSub.value = `Exportado em ${dataExport}  ·  Status: ${cotacao.status}  ·  ${itens.length} produto(s)  ·  ${fornecedores.length} fornecedor(es)`;
    cellSub.font = { name: "Calibri", size: 9, color: { argb: COR_HEADER_TEXT }, italic: true };
    cellSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_ACCENT } };
    cellSub.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(2).height = 22;

    const headerRow = sheet.getRow(3);
    const headers = ["#", "Produto", "Qtd", "Un"];
    fornecedores.forEach((f) => headers.push(f.fornecedor_nome));
    headers.push("Menor Preço", "Fornecedor Vencedor");
    headerRow.values = headers;
    aplicarEstiloHeader(headerRow, COR_DESTAQUE);

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 28;
    sheet.getColumn(3).width = 10;
    sheet.getColumn(4).width = 8;
    fornecedores.forEach((_, idx) => { sheet.getColumn(5 + idx).width = 18; });
    sheet.getColumn(5 + fornecedores.length).width = 16;
    sheet.getColumn(6 + fornecedores.length).width = 24;

    itens.forEach((item, rowIdx) => {
      const isZebra = rowIdx % 2 === 0;
      const row = sheet.getRow(4 + rowIdx);

      const precosPorFornecedor = fornecedores.map((forn) => {
        const resp = respostas.find(
          (r) => r.cotacao_fornecedor_id === forn.cotacao_fornecedor_id && r.cotacao_item_id === item.id
        );
        return { preco: resp?.preco_unitario ? Number(resp.preco_unitario) : null, disponivel: resp?.disponivel ?? false };
      });

      const precosValidos = precosPorFornecedor.filter((p) => p.disponivel && p.preco !== null).map((p) => p.preco as number);
      const menorPreco = precosValidos.length > 0 ? Math.min(...precosValidos) : null;
      const idxVencedor = menorPreco !== null ? precosPorFornecedor.findIndex((p) => p.preco === menorPreco && p.disponivel) : -1;
      const bg = isZebra ? COR_ZEBRA : "FFFFFFFF";

      row.getCell(1).value = rowIdx + 1;
      aplicarEstiloCell(row.getCell(1), { cor: COR_MUTED, align: "center", bg });

      row.getCell(2).value = item.produto;
      aplicarEstiloCell(row.getCell(2), { bold: true, bg });

      row.getCell(3).value = Number(item.quantidade);
      aplicarEstiloCell(row.getCell(3), { align: "center", bg });

      row.getCell(4).value = item.unidade;
      aplicarEstiloCell(row.getCell(4), { align: "center", bg });

      precosPorFornecedor.forEach((p, fIdx) => {
        const cell = row.getCell(5 + fIdx);
        const isMelhor = fIdx === idxVencedor;
        if (p.preco !== null && p.disponivel) {
          cell.value = p.preco;
          cell.numFmt = 'R$ #,##0.00';
          aplicarEstiloCell(cell, { bold: isMelhor, cor: isMelhor ? "FF166534" : COR_TEXTO, bg: isMelhor ? COR_MELHOR_BG : bg, align: "right" });
        } else {
          cell.value = "—";
          aplicarEstiloCell(cell, { cor: COR_MUTED, bg: COR_INDISPONIVEL_BG, align: "center" });
        }
      });

      const cellMenor = row.getCell(5 + fornecedores.length);
      if (menorPreco !== null) {
        cellMenor.value = menorPreco;
        cellMenor.numFmt = 'R$ #,##0.00';
        aplicarEstiloCell(cellMenor, { bold: true, cor: "FF166534", bg: COR_MELHOR_BG, align: "right" });
      } else {
        cellMenor.value = "Sem resp.";
        aplicarEstiloCell(cellMenor, { cor: COR_MUTED, align: "center" });
      }

      const cellVenc = row.getCell(6 + fornecedores.length);
      cellVenc.value = idxVencedor >= 0 ? fornecedores[idxVencedor].fornecedor_nome : "—";
      aplicarEstiloCell(cellVenc, {
        bold: idxVencedor >= 0,
        cor: idxVencedor >= 0 ? "FF166534" : COR_MUTED,
        bg: idxVencedor >= 0 ? COR_MELHOR_BG : bg,
      });

      row.height = 22;
    });

    const totalRowNum = 4 + itens.length;
    const totalRow = sheet.getRow(totalRowNum);
    sheet.mergeCells(totalRowNum, 2, totalRowNum, 4);
    totalRow.getCell(2).value = "TOTAL GERAL (soma dos menores preços × qtd)";
    aplicarEstiloCell(totalRow.getCell(2), { bold: true, bg: "FFF1F5F9", cor: COR_PRIMARIA });
    totalRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    fornecedores.forEach((_, fIdx) => {
      const colNum = 5 + fIdx;
      const colLetter = sheet.getColumn(colNum).letter;
      const cell = totalRow.getCell(colNum);
      cell.value = { formula: `IFERROR(SUMIF(${colLetter}4:${colLetter}${3 + itens.length},"<>—",${colLetter}4:${colLetter}${3 + itens.length}),0)` };
      cell.numFmt = 'R$ #,##0.00';
      aplicarEstiloCell(cell, { bold: true, bg: "FFF1F5F9", align: "right" });
    });

    totalRow.height = 28;
  }

  private _sheetResumoFornecedores(
    workbook: ExcelJS.Workbook,
    cotacao: any,
    itens: any[],
    fornecedores: any[],
    respostas: any[]
  ) {
    const sheet = workbook.addWorksheet("Resumo por Fornecedor");

    sheet.mergeCells("A1:F1");
    const tituloCell = sheet.getCell("A1");
    tituloCell.value = "RESUMO POR FORNECEDOR";
    tituloCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: COR_HEADER_TEXT } };
    tituloCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_PRIMARIA } };
    tituloCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 36;

    const headerRow = sheet.getRow(2);
    headerRow.values = ["#", "Fornecedor", "Itens Respondidos", "Itens Disponíveis", "Total (se vencesse tudo)", "Status"];
    aplicarEstiloHeader(headerRow, COR_DESTAQUE);

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 24;
    sheet.getColumn(6).width = 18;

    fornecedores.forEach((forn, idx) => {
      const isZebra = idx % 2 === 0;
      const row = sheet.getRow(3 + idx);
      const bg = isZebra ? COR_ZEBRA : "FFFFFFFF";

      const respostasForn = respostas.filter((r) => r.cotacao_fornecedor_id === forn.cotacao_fornecedor_id);
      const disponiveis = respostasForn.filter((r) => r.disponivel).length;
      const totalSeFosse = respostasForn
        .filter((r) => r.disponivel)
        .reduce((acc, r) => {
          const item = itens.find((i) => i.id === r.cotacao_item_id);
          return acc + (item ? Number(r.preco_unitario) * Number(item.quantidade) : 0);
        }, 0);

      row.getCell(1).value = idx + 1;
      aplicarEstiloCell(row.getCell(1), { cor: COR_MUTED, align: "center", bg });

      row.getCell(2).value = forn.fornecedor_nome;
      aplicarEstiloCell(row.getCell(2), { bold: true, bg });

      row.getCell(3).value = `${respostasForn.length} / ${itens.length}`;
      aplicarEstiloCell(row.getCell(3), { align: "center", bg });

      row.getCell(4).value = disponiveis;
      aplicarEstiloCell(row.getCell(4), { align: "center", bg });

      row.getCell(5).value = totalSeFosse;
      row.getCell(5).numFmt = 'R$ #,##0.00';
      aplicarEstiloCell(row.getCell(5), { bold: true, align: "right", bg });

      const statusLabel = forn.status === "respondido" ? "Respondido" : forn.status === "recusado" ? "Recusado" : "Aguardando";
      const statusBg = forn.status === "respondido" ? COR_MELHOR_BG : forn.status === "recusado" ? COR_INDISPONIVEL_BG : "FFFEF9C3";
      const statusCor = forn.status === "respondido" ? "FF166534" : forn.status === "recusado" ? "FF991B1B" : "FF92400E";

      row.getCell(6).value = statusLabel;
      aplicarEstiloCell(row.getCell(6), { align: "center", bg: statusBg, cor: statusCor, bold: true });
      row.height = 22;
    });
  }

  private _sheetDetalhado(
    workbook: ExcelJS.Workbook,
    itens: any[],
    fornecedores: any[],
    respostas: any[]
  ) {
    const sheet = workbook.addWorksheet("Detalhado por Item");

    sheet.mergeCells("A1:H1");
    const tituloCell = sheet.getCell("A1");
    tituloCell.value = "DETALHE DE PREÇOS POR ITEM";
    tituloCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: COR_HEADER_TEXT } };
    tituloCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_PRIMARIA } };
    tituloCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 36;

    const headerRow = sheet.getRow(2);
    headerRow.values = ["#", "Produto", "Qtd", "Un", "Fornecedor", "Preço Unit.", "Preço Total", "Disponível"];
    aplicarEstiloHeader(headerRow, COR_DESTAQUE);

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 28;
    sheet.getColumn(3).width = 10;
    sheet.getColumn(4).width = 8;
    sheet.getColumn(5).width = 26;
    sheet.getColumn(6).width = 16;
    sheet.getColumn(7).width = 16;
    sheet.getColumn(8).width = 14;

    let rowNum = 3;
    itens.forEach((item) => {
      const precosForn = fornecedores.map((forn) => {
        const resp = respostas.find(
          (r) => r.cotacao_fornecedor_id === forn.cotacao_fornecedor_id && r.cotacao_item_id === item.id
        );
        return { forn, resp };
      });

      const precosValidos = precosForn.filter((p) => p.resp?.disponivel && p.resp?.preco_unitario).map((p) => Number(p.resp.preco_unitario));
      const menorPreco = precosValidos.length > 0 ? Math.min(...precosValidos) : null;
      const startRow = rowNum;

      precosForn.forEach(({ forn, resp }, fIdx) => {
        const row = sheet.getRow(rowNum);
        const isMelhor = menorPreco !== null && resp?.disponivel && Number(resp?.preco_unitario) === menorPreco;
        const bg = isMelhor ? COR_MELHOR_BG : fIdx % 2 === 0 ? COR_ZEBRA : "FFFFFFFF";

        if (fIdx === 0) {
          row.getCell(1).value = item.id;
          row.getCell(2).value = item.produto;
          row.getCell(3).value = Number(item.quantidade);
          row.getCell(4).value = item.unidade;
          aplicarEstiloCell(row.getCell(1), { cor: COR_MUTED, align: "center", bg: "FFFFFFFF" });
          aplicarEstiloCell(row.getCell(2), { bold: true, bg: "FFFFFFFF" });
          aplicarEstiloCell(row.getCell(3), { align: "center", bg: "FFFFFFFF" });
          aplicarEstiloCell(row.getCell(4), { align: "center", bg: "FFFFFFFF" });
        }

        row.getCell(5).value = forn.fornecedor_nome;
        aplicarEstiloCell(row.getCell(5), { bg, bold: isMelhor, cor: isMelhor ? "FF166534" : COR_TEXTO });

        if (resp?.preco_unitario && resp?.disponivel) {
          row.getCell(6).value = Number(resp.preco_unitario);
          row.getCell(6).numFmt = 'R$ #,##0.00';
          row.getCell(7).value = Number(resp.preco_unitario) * Number(item.quantidade);
          row.getCell(7).numFmt = 'R$ #,##0.00';
          aplicarEstiloCell(row.getCell(6), { align: "right", bg, bold: isMelhor, cor: isMelhor ? "FF166534" : COR_TEXTO });
          aplicarEstiloCell(row.getCell(7), { align: "right", bg, bold: isMelhor, cor: isMelhor ? "FF166534" : COR_TEXTO });
        } else {
          row.getCell(6).value = "—";
          row.getCell(7).value = "—";
          aplicarEstiloCell(row.getCell(6), { align: "center", cor: COR_MUTED, bg: COR_INDISPONIVEL_BG });
          aplicarEstiloCell(row.getCell(7), { align: "center", cor: COR_MUTED, bg: COR_INDISPONIVEL_BG });
        }

        const disponivel = resp?.disponivel ?? false;
        row.getCell(8).value = disponivel ? "Sim" : "Não";
        aplicarEstiloCell(row.getCell(8), {
          align: "center",
          bold: true,
          cor: disponivel ? "FF166534" : "FF991B1B",
          bg: disponivel ? COR_MELHOR_BG : COR_INDISPONIVEL_BG,
        });

        row.height = 20;
        rowNum++;
      });

      if (fornecedores.length > 1) {
        sheet.mergeCells(startRow, 1, startRow + fornecedores.length - 1, 1);
        sheet.mergeCells(startRow, 2, startRow + fornecedores.length - 1, 2);
        sheet.mergeCells(startRow, 3, startRow + fornecedores.length - 1, 3);
        sheet.mergeCells(startRow, 4, startRow + fornecedores.length - 1, 4);
      }

      const sepRow = sheet.getRow(rowNum);
      for (let c = 1; c <= 8; c++) {
        sepRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      }
      sepRow.height = 4;
      rowNum++;
    });
  }
}
