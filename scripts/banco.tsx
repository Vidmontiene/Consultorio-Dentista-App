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

// Pega o Caixa
export const getCaixa = async () => {
  const docRef = doc(db, "caixa", 'geral');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()){
    const dados = docSnap.data();
    return dados.valor;
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

// Pega nome do usuário logado
export const getNome = async() => {
  const id = await getIdLogado();
  const docRef = doc(db, "usuario", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()){
    const dados = docSnap.data();
    return dados.nome;
  }
  return "";

};

// Define o cache
type UsuarioCache = {
  nome: string;
  porcentagem: number;
};

const cacheUsuarios: Record<string, UsuarioCache> = {};

export const getUsuarioBanco = async (id?: string): Promise<UsuarioCache> => {

  if (!id) return { nome: "", porcentagem: 0 };

  const docRef = doc(db, "usuario", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists())
    return { nome: "", porcentagem: 0 };

  const dados = docSnap.data();

  return {
    nome: dados.nome ?? "",
    porcentagem: dados.porcentagem ?? 0
  };
};

export const getUsuarioCache = async (id: string) => {

  if (cacheUsuarios[id]) return cacheUsuarios[id];

  const usuario = await getUsuarioBanco(id);

  cacheUsuarios[id] = usuario;
  return usuario;
};



