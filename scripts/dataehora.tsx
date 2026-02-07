// Formata a data Date em DD/MM/AAAA
export const dateParaData = (date: Date | null) => { 
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR"); 
}; 

// Formata a hora Date em HH:MM
export const dateParaHora = (time: Date | null) => { 
    if (!time) return ""; 
    const t = new Date(time);
    if (isNaN(t.getTime())) return "";
    return t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); 
};

// Formata a data (DD/MM/AAAA) em Date
export const dataParaDate = (dataStr: string) => {
    if (!dataStr || dataStr === "") return null;
    const [dia, mes, ano] = dataStr.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
}

// Formata o horário (HH:MM) em Date
export const horaParaDate = (horaStr: string) =>{
    if (!horaStr || horaStr === "") return null;
    const [hora, minuto] = horaStr.split(":").map(Number);
    const agora = new Date();
    agora.setHours(hora, minuto, 0, 0); 
    return agora;
}

// Formata timestamp em (DD/MM/AAAA às HH:MM)
export const formatarData = (timestamp: any) => {
  if (!timestamp) return "";

  const data = timestamp.toDate();
  return data.toLocaleDateString("pt-BR") + " às " +
     data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}