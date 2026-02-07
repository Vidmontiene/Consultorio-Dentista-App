import { signInWithEmailAndPassword } from '@firebase/auth';
import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { autenticacao } from "../firebaseConfig";

export default function Index() {

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Loga o usuário
  const logar = async() => {
    try{
      const usuario = await signInWithEmailAndPassword(autenticacao, email, senha);
    }
    catch ( error:any ){
      console.log(error);
      alert(`Login falhou: ${error.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Título</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Email" value={email} 
        onChangeText={setEmail} 
        keyboardType='email-address' 
        autoCapitalize="none"/>
      <TextInput 
        style={styles.input} 
        placeholder="Senha" 
        value={senha} 
        onChangeText={setSenha}  
        secureTextEntry 
        autoCapitalize="none"/>

      <TouchableOpacity style={styles.botao} onPress={logar}>
        <Text style={styles.texto}>Login</Text>
      </TouchableOpacity>

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
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 30,
  },
  input:{
    height: 50,
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E8EAF6',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 15,
    paddingHorizontal: 15, 
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, 
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
  }

});
