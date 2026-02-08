import { autenticacao, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Pega taxa do cartão
export const getTaxaCartao = async () => {
  const docRef = doc(db, "configuracoes", 'geral');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()){
    const dados = docSnap.data();
    return dados.porcentagemCartao;
  }
  return "";
};

// Pega porcentagem do dentista com base no id
export const getPorcentagemDentista = async ( id : string ) => {
  const docRef = doc(db, "usuario", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()){
    const dados = docSnap.data();
    return dados.porcentagem;
  }
  return "";
};

// Pega id do usuário logado
export const getIdLogado = async() => {
  const usuarioLogado = autenticacao.currentUser;
  if (usuarioLogado){
    return usuarioLogado.uid;
  }
  return ""
};

// Pega role do usuário logado
export const getRole = async() => {
  const id = await getIdLogado();
  const docRef = doc(db, "usuario", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()){
    const dados = docSnap.data();
    return dados.role;
  }
  return "";

};

const cache: Record<string, string> = {};
export const getNomeCache = async (id: string, buscar: (id: string) => Promise<string>) => {

    // já existe em memória
    if (cache[id]) return cache[id];

    // busca no banco
    const nome = await buscar(id);

    cache[id] = nome;
    return nome;
};

export const getNomeBanco = async (id?: string): Promise<string> => {

  if (!id) return "—";

  const docRef = doc(db, "usuario", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return "—";

  const dados = docSnap.data();
  return dados.nome ?? "—";
};



