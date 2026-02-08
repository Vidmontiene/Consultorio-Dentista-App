import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Interface das linhas
export interface LinhaRelatorio {
  id: string;
  nome: string;
  criadoPor: string;
  data: string;
  tipo: string;
  formaPagamento: string;
  idDoutor: string;
  valorBruto: number;
  valorDoutor: number;
  valorCartao: number;
  valorClinica: number;
}

// Interface do total
export interface Totais {
  bruto: number;
  doutor: number;
  cartao: number;
  clinica: number;
}

type RelatorioSnapshot = {
  linhas: LinhaRelatorio[];
  totais: Totais;
};

// Retorna as linhas da planilha
export const escutarRelatorio = (callback: (dados: RelatorioSnapshot) => void) => {

  const unsubscribe = onSnapshot(collection(db, "transacao"), (snapshot) => {

    const linhas: LinhaRelatorio[] = [];
    const totais: Totais = { bruto: 0, doutor: 0, cartao: 0, clinica: 0 };

    snapshot.forEach(doc => {
      const d = doc.data();

      const linha: LinhaRelatorio = {
        id: doc.id,
        nome: d.nome,
        criadoPor: d.criadoPor,
        data: d.data?.toDate().toLocaleDateString("pt-BR"),
        tipo: d.tipo,
        formaPagamento: d.formaPagamento,
        idDoutor: d.idDoutor,
        valorBruto: d.valorBruto ?? 0,
        valorDoutor: d.valorDoutor ?? 0,
        valorCartao: d.valorCartao ?? 0,
        valorClinica: d.valorClinica ?? 0
      };

      linhas.push(linha);

      totais.bruto += linha.valorBruto;
      totais.doutor += linha.valorDoutor;
      totais.cartao += linha.valorCartao;
      totais.clinica += linha.valorClinica;
    });

    callback({ linhas, totais });
  });

  return unsubscribe;
};
