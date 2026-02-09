import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Interface das linhas
export interface LinhaRelatorio {
  id: string;
  nome: string;
  tipo : string;
  criadoPor: string;
  data: string;
  entrada: number;
  saida: number;
  formaPagamento: string;
  idDoutor: string;
  valorDoutor: number;
  valorCartao: number;
  valorClinica: number;
}

// Interface do total
export interface Totais {
  saldo: number;
  entrada : number;
  saida: number;
  doutor: number;
  cartao: number;
  clinica: number;
  caixa: number;
}

type RelatorioSnapshot = {
  linhas: LinhaRelatorio[];
  totais: Totais;
};

// Retorna as linhas da planilha
export const escutarRelatorio = (callback: (dados: RelatorioSnapshot) => void) => {

  const unsubscribe = onSnapshot(collection(db, "transacao"), (snapshot) => {

    const linhas: LinhaRelatorio[] = [];
    const totais: Totais = { saldo: 0, doutor: 0, cartao: 0, clinica: 0, entrada: 0, saida: 0, caixa: 0 };

    snapshot.forEach(doc => {
      const d = doc.data();

      const linha: LinhaRelatorio = {
        id: doc.id,
        nome: d.nome,
        criadoPor: d.criadoPor,
        data: d.data?.toDate().toLocaleDateString("pt-BR"),
        entrada: d.tipo === 'entrada' ? d.valorBruto : 0,
        saida: d.tipo === 'saida' ? d.valorBruto : 0,
        formaPagamento: d.formaPagamento,
        idDoutor: d.idDoutor,
        tipo: d.tipo,
        valorDoutor: d.valorDoutor ?? 0,
        valorCartao: d.valorCartao ?? 0,
        valorClinica: d.valorClinica ?? 0
      };

      linhas.push(linha);

      totais.entrada += linha.entrada;
      totais.saida += linha.saida;
      totais.doutor += linha.valorDoutor;
      totais.cartao += linha.valorCartao;

      if (linha.formaPagamento === "dinheiro" && linha.tipo === 'entrada') {
        totais.caixa += linha.entrada
      }
      else if (linha.formaPagamento === "dinheiro" && linha.tipo === 'saida') {
        totais.caixa -= linha.saida
      }

      totais.clinica = linha.tipo === "entrada" ? totais.clinica + linha.valorClinica : totais.clinica - linha.valorClinica;
    });

    totais.saldo = totais.entrada = totais.saida

    callback({ linhas, totais });
  });

  return unsubscribe;
};
