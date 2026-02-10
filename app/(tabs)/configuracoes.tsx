import { Platform, StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, Keyboard, Alert, ScrollView } from 'react-native';
import { modal } from '@/estilos/modal';
import { CustomRadioButton } from '@/estilos/radioButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, updatePassword } from '@firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { secondaryAuth } from "@/scripts/secondaryauth";
import { db } from '@/firebaseConfig';
import { autenticacao } from '@/firebaseConfig';
import { router } from 'expo-router';
import { botao } from '@/estilos/botoes';
import * as banco from "@/scripts/banco";

export default function Configuracoes() {

  // Modais
  const [add, setAdd] = useState(false);
  const [taxa, setTaxa] = useState(false);
  const [alterarSenha, setAlterarSenha] = useState(false);

  // Valores
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [porcent, setPorcent] = useState('');
  const [checked, setChecked] = useState(0);  // 0 = funcionário, 1 = doutor, 2 = admin

  // Valores do DB
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [cargoUsuario, setCargoUsuario] = useState("");
  const [cartao, setCartao] = useState("");

  // Para trocar a senha
  const [novaSenha, setNovaSenha] = useState('');

  // Zera os dados
  const zerarUseStates = () => {
    setNome('');
    setNovaSenha('');
    setEmail('');
    setSenha('');
    setPorcent('');
    setChecked(0);
  }

  // Aceita apenas numeros
  const mudarNum = ( texto: string ) => {

    let valor = texto.replace(/[^0-9.,]/g, "").replace(",", ".");

    // apenas um ponto decimal
    const partes = valor.split(".");
    if (partes.length > 2) {
      valor = partes[0] + "." + partes.slice(1).join("");
    }

    // limita para 2 casas
    if (partes[1]?.length > 2) {
      valor = partes[0] + "." + partes[1].slice(0, 2);
    }

    // limita entre 0 e 100
    const numero = parseFloat(valor);
    if (!isNaN(numero)) {
      if (numero > 100) valor = "100";
      if (numero < 0) valor = "0";
    }

    if (add === true){
      setPorcent(valor);
    }
    else{
      setCartao(valor)
    }
  }

  // Cadastra novo usuário
  const salvarUsu = async() => {
    try{

      let nomeT = nome.trim();
      let emailT = email.trim();

      // Não permite vazio
      if (!emailT || !senha || !nomeT || (checked === 1 && !porcent)) {
        Alert.alert("Preencha todos os campos", "Existem campos vazios.");
        return;
      }

      // Cria conta e pega uid
      const usuario = await createUserWithEmailAndPassword(secondaryAuth, emailT, senha);
      const uid = usuario.user.uid;

      // Define cargo
      let cargo = "";
      if (checked === 0) cargo = "funcionario";
      if (checked === 1) cargo = "dentista";
      if (checked === 2) cargo = "admin";

      // Cadastra no db
      await setDoc(doc(db, "usuario", uid), {
        nome: nomeT,
        email: emailT,
        role: cargo,
        porcentagem: checked === 1 ? Number(porcent) : 0,
        criadoEm: serverTimestamp(),
        uid: uid
      });

      Alert.alert("Usuário adicionado", `A conta de ${nomeT} foi criada com sucesso!`);
      zerarUseStates();
      setAdd(false);
    }

    catch ( error:any ){
      console.log(error);
      let titulo = "Erro";
      let msg = error.code;
      let e = error.code;

      // Tratamento de erro
      switch (e){
        case "auth/email-already-in-use":
          titulo = "Email inválido";
          msg = "Este email já está em uso.";
          break;

        case "auth/invalid-email":
          titulo = "Email inválido";
          msg = "Verifique se escreveu o email corretamente.";
          break;

        case "auth/weak-password":
          titulo = "Senha muito curta";
          msg = "A senha deve ter pelo menos 6 caracteres.";
          break;

        case "auth/missing-password":
          titulo = "Digite uma senha";
          msg = "A senha deve ter pelo menos 6 caracteres.";
          break;

        case "auth/too-many-requests":
          titulo = "Muitas contas criadas pelo mesmo usuário";
          msg = "tente novamente mais tarde.";
          break;

        case "auth/network-request-failed":
          titulo = "Erro de conexão";
          msg = "Verifique sua conexão com a internet."   
          break;

        case "permission-denied":
          titulo = "Sem permissão"
          msg = "Você não tem permissão para alterar este registro.";
          break;
      }

      Alert.alert(titulo, msg);
    }
  }

  // Salva nova taxa de cartão
  const salvarTaxa = async() => {

    try{
      await setDoc(doc(db, "configuracoes", "geral"), {
        porcentagemCartao: Number(cartao)
      });
    }
    catch (error : any){
      console.log(error);
      Alert.alert(`Criação falhou`,  error.message);
    }

    setTaxa(false);
  }

  // Reautentica para trocar a senha
  const reautenticar = async () => {
    const user = autenticacao.currentUser;
    if (!user) return;

    let emailT = email.trim();
    const cred = EmailAuthProvider.credential(emailT, senha);
    await reauthenticateWithCredential(user, cred);
  };

  // Troca senha do usuário cadastrado
  const trocarSenha = async () => {
    try {
      await reautenticar();
      const user = autenticacao.currentUser;

      if (!user) {
        Alert.alert("Usuário não autenticado", "Entre ou crie uma conta antes.");
        return;
      }

      await updatePassword(user, novaSenha);
      Alert.alert("Senha alterada com sucesso!", "Sua nova senha já está sendo utilizada.");

      zerarUseStates();
      setAlterarSenha(false);
    } 
    catch (error:any) {
      console.log(error);
      let titulo = "Erro";
      let msg = error.code;
      let e = error.code;

      // Tratamento de erros
      switch (e) {
        case "auth/weak-password":
          titulo = "Senha muito curta";
          msg = "A senha deve ter pelo menos 6 caracteres.";
          break;

        case 'auth/user-disabled':
          titulo = "Conta desativada";
          msg = "Essa conta não existe mais.";
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

        case 'auth/too-many-requests':
          titulo = "Muitas tentativas erradas";
          msg = "Aguarde um pouco para tentar novamente.";
          break;    

      }
      Alert.alert(titulo, msg);
    }
  };

  // Pega o nome e cargo do usuário logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(autenticacao, async (user) => {

    if (!user) return;
      
    const nome = await banco.getNome();
    setNomeUsuario(nome);
    const cargo = await banco.getRole();
    setCargoUsuario(cargo);
    const cartao = await banco.getTaxaCartao();
    setCartao(String(cartao));

    return unsubscribe;
    })
  }, []);

  return (
    <ScrollView style={{backgroundColor: '#fafafaff'}}>
    <View style={styles.container}>

      <Text style={styles.titulo}>Configurações</Text>

      {/*Adicionar usuário*/}
      <TouchableOpacity style={botao.botao} 
        onPress={() => cargoUsuario === 'funcionario' ?
          Alert.alert(
            "Acesso negado", 
            "Somente administradores e dentistas podem cadastrar novo usuário!")
          :
          setAdd(true)
        }>
        <Ionicons name="person-add-sharp" size={31} style={[botao.img]} />
        <View style={botao.container_botao}>
          <Text style={botao.titulo_botao}>Adicionar Usuário</Text>
          <Text style={botao.txt_botao}>Clique para adicionar</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} style={botao.seta} />
      </TouchableOpacity>

      {/*Editar usuário*/}
      <TouchableOpacity style={botao.botao}
        onPress={() => cargoUsuario != 'admin' ?
          Alert.alert(
            "Acesso negado", 
            "Somente administradores podem editar usuários!")
          :
          router.push('../usuarios')
        }>
        <Ionicons name="person-remove-sharp" size={31} style={[botao.img]} />
        <View style={botao.container_botao}>
          <Text style={botao.titulo_botao}>Editar/Remover Usuário</Text>
          <Text style={botao.txt_botao}>Clique para editar</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} style={botao.seta} />
      </TouchableOpacity>

      {/*Editar taxa cartão*/}
      <TouchableOpacity style={botao.botao} onPress={() => setTaxa(true)}>
        <Ionicons name="card" size={31} style={[botao.img]} />
        <View style={botao.container_botao}>
          <Text style={botao.titulo_botao}>Editar Taxa do Cartão</Text>
          <Text style={botao.txt_botao}>{`Taxa atual: ${cartao}%`}</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} style={botao.seta} />
      </TouchableOpacity>

      {/*Alterar Senha*/}
      <TouchableOpacity style={botao.botao}  onPress={() => setAlterarSenha(true)}>
        <FontAwesome6 name="key" size={31} style={[botao.img]}/>
        <View style={botao.container_botao}>
          <Text style={botao.titulo_botao}>Alterar Senha</Text>
          <Text style={botao.txt_botao}>Clique para alterar</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} style={botao.seta} />
      </TouchableOpacity>

      {/*Sair da conta*/}
      <TouchableOpacity style={botao.botao}  onPress={() => autenticacao.signOut()}>
        <FontAwesome5 name="door-closed" size={31} style={[botao.img]} />
        <View style={botao.container_botao}>
          <Text style={botao.titulo_botao}>Sair da conta</Text>
          <Text style={botao.txt_botao}>Nome logado: {nomeUsuario}</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} style={botao.seta} />
      </TouchableOpacity>

      {/*Modal adicionar usuário*/}
      <Modal animationType="fade" transparent visible={add} onRequestClose={() => {setAdd(false), zerarUseStates()}}>
      <View style={modal.fundo_modal}>

        <TextInput 
          style={modal.input} 
          placeholder='Nome' 
          value={nome} 
          onChangeText={setNome} />

        <TextInput 
          style={modal.input} 
          placeholder='Email' 
          autoCapitalize="none"
          value={email} 
          keyboardType='email-address'
          onChangeText={setEmail} />

        <TextInput
          style={modal.input} 
          autoCapitalize="none"
          placeholder="Senha" 
          value={senha} 
          onChangeText={setSenha}  
          secureTextEntry/>

        <CustomRadioButton
          label="Funcionário"
          value="Funcionário"
          flex={false}
          selected={checked === 0}
          onPress={() => {setChecked(0), Keyboard.dismiss()}}
        />

        <CustomRadioButton
          label="Dentista"
          value="Dentista"
          flex={false}
          selected={checked === 1}
          onPress={() => {setChecked(1), Keyboard.dismiss()}}
        />

        <CustomRadioButton
          label="Administrador"
          value="Administrador"
          flex={false}
          selected={checked === 2}
          onPress={() => {setChecked(2), Keyboard.dismiss()}}
        />

        {checked === 1 ? 
          <View style={modal.container_percent}>
          <TextInput 
            style={modal.input_percent} 
            placeholder='Porcentagem do dentista' 
            value={porcent} 
            onChangeText={mudarNum} 
            keyboardType='decimal-pad'/>
          <Text style={modal.percentSymbol}>%</Text>
          </View>
          :
          <View style={styles.espaco}></View>
        }

        <TouchableOpacity style={modal.botao} onPress={salvarUsu}>
          <Text style={modal.texto}>Salvar</Text>
        </TouchableOpacity>  


      </View>
      </Modal>

      {/*Modal de taxa*/}
      <Modal animationType="fade" transparent visible={taxa} onRequestClose={() => {setTaxa(false), zerarUseStates()}}>
      <View style={modal.fundo_modal}>

        <View style={modal.container_percent}>
        <TextInput 
          style={modal.input_percent} 
          placeholder='Taxa do cartão' 
          value={cartao} 
          onChangeText={mudarNum} 
          keyboardType='decimal-pad'/>
        <Text style={modal.percentSymbol}>%</Text>
        </View>
  
        <TouchableOpacity style={modal.botao} onPress={salvarTaxa}>
          <Text style={modal.texto}>Salvar</Text>
        </TouchableOpacity>  

      </View>
      </Modal>

      {/*Modal de alterar senha*/}
      <Modal 
        animationType="fade" 
        transparent visible={alterarSenha} 
        onRequestClose={() => {setAlterarSenha(false), zerarUseStates()}}>
        <View style={modal.fundo_modal}>

        <TextInput 
          style={modal.input} 
          placeholder="Email" value={email} 
          onChangeText={setEmail} 
          keyboardType='email-address' 
          autoCapitalize="none"/>

        <TextInput 
          style={modal.input} 
          placeholder="Senha atual" 
          value={senha} 
          onChangeText={setSenha}  
          secureTextEntry 
          autoCapitalize="none"/>
  
        <TextInput 
          style={modal.input} 
          placeholder="Nova senha" 
          value={novaSenha} 
          onChangeText={setNovaSenha}  
          secureTextEntry 
          autoCapitalize="none"/>

        <TouchableOpacity style={modal.botao} onPress={trocarSenha}>
          <Text style={modal.texto}>Alterar</Text>
        </TouchableOpacity>  

      </View>
      </Modal>

    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafaff',
    paddingHorizontal: 10,
    height: "100%",
    flex: 1,
    paddingTop: 20,
  },

  titulo:{
    fontWeight: 'bold',
    fontSize: Platform.OS === "ios" ? 23 : 21,
    marginBottom: 20
  },

  espaco:{
    marginVertical: 5,
    height: 50,
    width: '90%'
  }

});