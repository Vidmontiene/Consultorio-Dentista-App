import { signInWithEmailAndPassword } from '@firebase/auth';
import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
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
      let titulo = "Erro";
      let msg = error.code;
      let e = error.code;

      // Tratamento de erros
      switch (e) {
        case 'auth/invalid-email':
          titulo = "Email inválido";
          msg = "Verifique se escreveu o email corretamente.";
          break;

        case 'auth/too-many-requests':
          titulo = "Muitas tentativas erradas";
          msg = "Aguarde um pouco para tentar novamente.";
          break;

        case 'auth/network-request-failed':
          titulo = "Erro de conexão";
          msg = "Verifique sua conexão com a internet."   
          break;
        
        case 'auth/wrong-password': 
          titulo = "Senha incorreta";
          msg = "Verifique se digitou a senha corretamente.";
          break;

        case 'auth/invalid-credential':
          titulo = "Email ou senha incorretos";
          msg = "Verifique se digitou as informações corretamente.";
          break;

        case 'auth/user-disabled':
          titulo = "Conta desativada";
          msg = "Essa conta não existe mais.";
          break;    

        case 'auth/user-not-found':
          titulo = "Usuário não encontrado";
          msg = "Não existe conta com essas informações.";
          break;    

      }
      Alert.alert(titulo, msg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Consultório</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Email" value={email} 
        onChangeText={setEmail} 
        keyboardType='email-address' 
        autoCapitalize="none"
        placeholderTextColor={'gray'} />
        
      <TextInput 
        style={styles.input} 
        placeholder="Senha" 
        value={senha} 
        onChangeText={setSenha}  
        secureTextEntry 
        autoCapitalize="none"
        placeholderTextColor={'gray'}/>

      <TouchableOpacity style={styles.botao} onPress={async() => {logar(), Keyboard.dismiss()}}>
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
    maxWidth: 600
  },
  botao:{
    width: '90%',
    alignItems: 'center',
    marginVertical: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F0C10C',
    maxWidth: 600
  },
  texto:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17
  }

});
