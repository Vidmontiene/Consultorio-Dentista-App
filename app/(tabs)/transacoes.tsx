import { StyleSheet, TouchableOpacity, View, Text, Modal, TextInput } from 'react-native';
import { autenticacao } from "../../firebaseConfig";
import { signOut } from 'firebase/auth';
import { useState } from 'react';

export default function Transacoes() {

  const [entrada, setEntrada] = useState(false);
  const [saida, setSaida] = useState(false);

  const [pagamento, setPagamento] = useState('');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(0);
  const [doutor, setDoutor] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nova Transação</Text>

      <TouchableOpacity style={styles.botao} onPress={() => setEntrada(true)}>
        <Text style={styles.texto}>Entrada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao}>
        <Text style={styles.texto}>Saída</Text>
      </TouchableOpacity>

      <Modal animationType="fade" transparent visible={entrada} onRequestClose={() => setEntrada(false)}>
      <View style={styles.fundo_modal}>
        <TextInput style={styles.input} placeholder='Nome da transação' value={nome} onChangeText={setNome} />


      
      </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white'
  },
  titulo:{
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 30,
  },
  botao:{
    width: '90%',
    alignItems: 'center',
    marginVertical: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F0C10C'
  },
  texto:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17
  },
  fundo_modal:{
    backgroundColor: 'white',
    margin:'auto',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    alignSelf: 'center',
    gap: 23
  },
  input:{
    height: 50,
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E8EAF6',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
    paddingHorizontal: 15, 
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, 
  }
});
