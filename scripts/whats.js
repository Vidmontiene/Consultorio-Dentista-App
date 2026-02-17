import { Linking } from 'react-native';
import { formatarData } from './dataehora';

export const enviarWhats = (item) => {

  if (item.numero === ''){
    return;
  }

  const numero = formataNumero(item.numero);
  const mensagem = formataMsg(item);

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

  Linking.openURL(url).catch(() => {
    alert('Não foi possível abrir o WhatsApp');
  });
};

// Constrói a msg 
const formataMsg = (item) => {

  const msg = `Olá, ${item.nome}! Confirma sua consulta dia ${formatarData(item.data, true)}?`
  return msg

}

// Formata número 5521XXXXXXXXX
const formataNumero = (n) => {

  // remove zero inicial (021..., 011...)
  if (n.startsWith('0')) {
    n = n.substring(1);
  }

  // Já tem 55 então ok
  if (n.startsWith('55')) {
    return n;
  }

  // Não tem 5521
  if (n.length === 8 || n.length === 9) {
    return '5521' + n; // adiciona 21
  }

  // tem DDD, mas sem país 
  if (n.length === 10 || n.length === 11) {
    return '55' + n;
  }

  // fallback
  return n;
};

