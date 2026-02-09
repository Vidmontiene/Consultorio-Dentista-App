import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { File, Directory, Paths } from "expo-file-system";
import { LinhaRelatorio, Totais } from "./relatorio";
import * as banco from "@/scripts/banco";

// Calcula largura
function autoSizeColumns(data: any[]) {
  const colWidths: number[] = [];

  data.forEach(row => {
    Object.keys(row).forEach((key, i) => {
      const value = row[key] ? row[key].toString() : "";
      colWidths[i] = Math.max(colWidths[i] || 10, value.length + 2);
    });
  });

  return colWidths.map(w => ({ wch: w }));
}

// Define a linha da planilha
type LinhaExcel = {
  Nome?: string;
  Data?: string | number;
  CriadoPor?: string | number;
  Entrada?: string | number;
  Saida?: string | number;
  Forma?: string;
  Doutor?: string;
  ValorDoutor?: number | string;
  TaxaCartao?: number | string;
  Clinica?: number | string;
};

// Define usuário
type UsuarioInfo = {
  nome: string;
  porcentagem: number;
};

export async function exportarRelatorioExcel(
  linhas: LinhaRelatorio[],
  totais: Totais | null,
  anterior: Totais | null,
  nomesUsuarios: Record<string, UsuarioInfo>,
  nomesDentistas: Record<string, UsuarioInfo>,
  mes: any,
  ano: any
  ) {

  const dados: LinhaExcel[] = linhas.map(l => ({
    Nome: l.nome,
    Data: l.data,
    CriadoPor: nomesUsuarios[l.criadoPor].nome ?? "",
    Entrada: l.tipo === "entrada" ? l.entrada : "",
    Saida: l.tipo === "saida" ? -l.saida : "",
    Forma: l.formaPagamento,
    Dentista: l.idDoutor ? 
      `${nomesDentistas[l.idDoutor]?.nome ?? ""} (${nomesDentistas[l.idDoutor]?.porcentagem ?? 0}%)`
      : 
      "",
    ValorDoutor: l.valorDoutor,
    TaxaCartao: -l.valorCartao,
    Clinica: l.tipo === "entrada" ? l.valorClinica : -l.valorClinica
  }));

  // Saldo, entrada, saida
  if (totais) {
    const caixa = await banco.getCaixa();
    dados.push({});
    dados.push({
      Nome: "TOTAL DO MÊS",
      Data: `Caixa total: R$ ${caixa}`,
      Entrada: `R$ ${totais.entrada}`,
      Saida: `R$ -${totais.saida}`,
      Forma: `Saldo: R$ ${totais.saldo}`,
      TaxaCartao: `R$ -${totais.cartao}`,
      Clinica: `Receita: R$ ${totais.clinica}`
    });

    dados.push({});

    // Dados do mes anterior
    if (anterior) {
      dados.push({
        Nome: `MÊS ANTERIOR`,
        Data: `Receita: R$ ${anterior.clinica}`,
      })
    };

    // Saldo de cada dentista
    const totalPorDentista: Record<string, number> = {};

    linhas.forEach(l => {
      if (!l.idDoutor) return;
      totalPorDentista[l.idDoutor] =
        (totalPorDentista[l.idDoutor] ?? 0) + l.valorDoutor;
    });

    dados.push({});

    dados.push({ Nome: "TOTAL POR DENTISTA" });
    Object.entries(totalPorDentista).forEach(([id, valor]) => {
      dados.push({
        Nome: nomesDentistas[id].nome ?? id,
        Data: valor
      });
    });
  }

  // cria planilha
  const worksheet = XLSX.utils.json_to_sheet(dados);
  worksheet["!cols"] = autoSizeColumns(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");

  const base64 = XLSX.write(workbook, {
    type: "base64",
    bookType: "xlsx"
  });

  // Novosistema de arquivos
  const pasta = new Directory(Paths.cache, "relatorios");

  try {
    await pasta.create({ intermediates: true });
  } catch (err: any) {
    if (!err.message.includes("already exists")) {
      throw err;
    }
  }

  const file = new File(pasta, `relatorio-${mes}-${ano}.xlsx`);
  console.log(file)
  await file.write(base64, { encoding: "base64" });


  await Sharing.shareAsync(file.uri, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: `Relatório ${mes}-${ano}`
  });
}

