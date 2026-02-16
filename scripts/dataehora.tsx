import { serverTimestamp, Timestamp } from "firebase/firestore";

// Formata timestamp em (DD/MM/AAAA às HH:MM)
export const formatarData = (timestamp: any, hora: boolean) => {
  if (!timestamp) return "";

  const data = timestamp.toDate();

  if (hora) {
    return data.toLocaleDateString("pt-BR") + " às " +
    data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });  
  }
    return data.toLocaleDateString("pt-BR") 
};

// Formata timestamp em (DD/MM/AAAA às HH:MM)
export const verHora = (timestamp: any ) => {
  if (!timestamp) return "";

  const data = timestamp.toDate();
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });  

};

export const normalizarData = (valor: any) => {
  if (!valor) return null;

  // Timestamp do Firestore
  if (valor?.toDate) return valor.toDate();

  // já é Date
  if (valor instanceof Date) return valor;
};

export const resolverTimestamp = (valor: any) => {
  if (!valor) return serverTimestamp();

  // já é Timestamp do Firestore
  if (valor instanceof Timestamp) return valor;

  // veio do DatePicker
  if (valor instanceof Date) return Timestamp.fromDate(valor);

  // serverTimestamp ainda não resolvido
  if (typeof valor === "object" && valor?.seconds !== undefined) return valor;

  return serverTimestamp();
};