import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { autenticacao, db } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { botao } from '@/estilos/botoes';
import { Alert, FlatList, Keyboard, Modal } from "react-native";
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { modal } from '@/estilos/modal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { formatarData } from "@/scripts/dataehora";
import { CustomRadioButton } from "@/estilos/radioButton";
import { onAuthStateChanged } from "@firebase/auth";

export default function usuarios() {

  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState('');
  const [porcent, setPorcent] = useState('');
  const [checked, setChecked] = useState(0);  // 0 = funcionário, 1 = doutor, 2 = admin

  const [editar, setEditar] = useState(false);

  // Carrega os usuários no useState ao vivo por ordem alfabética
  const carregarUsuarios = async () => {

    const q = query(
      collection(db, "usuario"),
      orderBy("nome", "asc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {

      const usuarios: any[] = [];

      snapshot.forEach((doc) => {
        usuarios.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setListaUsuarios(usuarios);
      },
      (error) => {
        if (error.code === "permission-denied") return;
        console.log("Erro Firestore:", error);       
      });

    return unsubscribe;
  };

  useEffect(() => {
    carregarUsuarios();

  }, []);

  // Retorna o cargo formatado
  const getCargo = (cargo: String) => {
    if (cargo === 'funcionario') {
      return 'Funcionário';
    }
    else if (cargo === 'dentista'){
      return 'Dentista';
    }
    else {
      return 'Administrador';
    }
  };

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

    setPorcent(valor);
  };

  // Preenche useStates do usuário clicado
  const preencheStates = ( item : any ) => {
    setId(item.id);
    setNome(item.nome);
    setEmail(item.email);
    setPorcent(String(item.porcentagem));
    if (item.role === 'funcionario'){
      setChecked(0);
    }
    else if (item.role === 'dentista'){
      setChecked(1);
    }
    else{
      setChecked(2);
    }
    setEditar(true);
  };

  // Salva novos dados
  const salvar = async () => {

    try {

      let nomeT = nome.trim();

      if (!nomeT || (checked === 1 && !porcent)){
        Alert.alert("Preencha todos os campos", "Existem campos vazios.");
        return;
      }

      const ref = doc(db, "usuario", id);

      // Define cargo
      let cargo = "";
      if (checked === 0) cargo = "funcionario";
      if (checked === 1) cargo = "dentista";
      if (checked === 2) cargo = "admin";

      await updateDoc(ref, {
        nome: nomeT,
        porcentagem: checked === 1 ? Number(porcent) : 0,
        role: cargo,
        uid: id
      });

      Alert.alert("Usuário atualizado!", `Informações de ${nomeT} atualizadas`);

    } 
    catch (error) {
      console.log(error);
      alert("Erro ao atualizar");
    }

    setEditar(false);
  };

  // Confirma se quer mesmo deletar
  const confirmarDelete = () => {

    Alert.alert(
      "Tem certeza que deseja deletar este usuário?", 
      "Essa ação não poderá ser revertida.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Deletar",
          style: "destructive",
          onPress: deletar
        }
      ],
      { cancelable: true }
    );
  };

  // Deleta usuário
  const deletar = async () => {
    try {
      await deleteDoc(doc(db, "usuario", id));

      Alert.alert("Usuário deletado!", `O usuário de nome ${nome} foi deletado`);
      setEditar(false);

    } 
    catch (error) {
      console.log(error);
      alert("Erro ao deletar usuário");
    }

  };

  return (
    <View style={styles.container}>

      <FlatList
        data={listaUsuarios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

        <View>
          <TouchableOpacity style={[botao.botao, {alignItems: 'flex-start', paddingHorizontal: 5}]}
            onPress={() => preencheStates(item)}>

            {/*Muda foto dependendo do cargo */}
            {item.role === 'funcionario' ?
              <Ionicons name="person-sharp" size={31} style={[botao.img, {padding: 12}]} />
              :
              item.role === 'dentista' ?
              <FontAwesome6 name="user-doctor" size={31} style={[botao.img, {padding: 12}]} />
              :
              <MaterialIcons name="admin-panel-settings" size={31} style={[botao.img, {padding: 12}]} />
            }

            {/*Informações*/}
            <View style={botao.container_botao}>
              <Text style={botao.titulo_botao}>{item.nome}</Text>

              <Text style={botao.txt_botao}>
                <Text style={botao.txt_negrito}>Email: </Text>
                {item.email}
              </Text>

              <Text style={botao.txt_botao}>
                <Text style={botao.txt_negrito}>Cargo: </Text>
                {getCargo(item.role)}
              </Text>

              {item.role === 'dentista' ? 
              <Text style={botao.txt_botao}>
                <Text style={botao.txt_negrito}>Comissão: </Text>
                {`${item.porcentagem}%`}
              </Text>
              :
              <></>
              }

              <Text style={botao.txt_botao}>
                <Text style={botao.txt_negrito}>Criado em: </Text>
                {formatarData(item.criadoEm, true)}
              </Text>

            </View>

          </TouchableOpacity>

        </View>
        )}
      />

      {/*Modal editar usuário*/}
      <Modal animationType="fade" transparent visible={editar} onRequestClose={() => {setEditar(false)}}>
      <View style={modal.fundo_modal}>

        <TextInput 
          style={modal.input} 
          placeholder='Nome' 
          value={nome} 
          onChangeText={setNome} 
          placeholderTextColor={'gray'}/>

        <CustomRadioButton
          label="Funcionário"
          flex={false}
          value="Funcionário"
          selected={checked === 0}
          onPress={() => {setChecked(0), Keyboard.dismiss()}}
        />

        <CustomRadioButton
          label="Dentista"
          flex={false}
          value="Dentista"
          selected={checked === 1}
          onPress={() => {setChecked(1), Keyboard.dismiss()}}
        />

        <CustomRadioButton
          label="Administrador"
          flex={false}
          value="Administrador"
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

        {/*Botão de salvar/excluir*/}
        <View style={modal.container_botao}>

          <TouchableOpacity style={[modal.botao, { width: '45%' }]} onPress={salvar}>
            <Text style={modal.texto}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[modal.botao, {backgroundColor:"#d63d3dff", width: '45%'}]} onPress={confirmarDelete}>
            <Text style={modal.texto}>Deletar</Text>
          </TouchableOpacity>

        </View>

      </View>
      </Modal>

    </View>
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
  espaco:{
    marginVertical: 5,
    height: 50,
    width: '90%'
  }

})