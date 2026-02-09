// Formata timestamp em (DD/MM/AAAA às HH:MM)
export const formatarData = (timestamp: any) => {
  if (!timestamp) return "";

  const data = timestamp.toDate();
  return data.toLocaleDateString("pt-BR") + " às " +
     data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}