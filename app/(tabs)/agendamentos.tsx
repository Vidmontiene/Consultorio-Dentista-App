import { StyleSheet, TouchableOpacity, View, Text, Modal, TextInput, Keyboard, Platform, Alert, FlatList, ScrollView } from 'react-native';
import { db } from "../../firebaseConfig";
import * as banco from "@/scripts/banco";
import { normalizarData, verHora } from '@/scripts/dataehora';
import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { CheckBox } from 'react-native-elements';
import { styles } from '@/estilos/lista';
import { formatarData } from '@/scripts/dataehora';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { modal } from '@/estilos/modal';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';

export default function Agendamentos() {

  const [role, setRole] = useState('');
  const [id, setId] = useState('');

  const [dentistas, setDentistas] = useState<any[]>([]);
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [nome, setNome] = useState('');
  const [doutor, setDoutor] = useState('');
  const [obs, setObs] = useState('');
  const [hora, setHora] = useState<Date | null>(null); 
  const [data, setData] = useState<Date | null>(new Date());
  const [idItem, setidItem] = useState('');

  const [mostrarPassados, setMostrarPassados] = useState(false);
  const [agenda, setAgenda] = useState(false);

  const [showData, setShowData] = useState(false); 
  const [showHora, setShowHora] = useState(false);

  const [carregando, setCarregando] = useState(true);

  type Agendamento = {
    idDoutor: string;
    nome: string;
    obs: string;
    data: any
    concluido: boolean
    id: string
  };

  type SecoesAgenda = {
    futuros: Record<string, Agendamento[]>;
    passados: Record<string, Agendamento[]>;
  };

  type Props = {
    item: Agendamento;
  };

  // Carrega role e id
  useEffect(() => {
    const carregarRole = async () => {
      const r = await banco.getRole();
      const id = await banco.getIdLogado();

      setRole(r);
      setId(id);
      setCarregando(false);
    };
    carregarRole();
  }, []);

  // Pega alterações pendentes
  useEffect(() => {
    let q
    if (role !== "dentista"){
      q = query(
        collection(db, "agendamentos"),
        orderBy("data", "asc")
      );    
    }
    else{
      q = query(
        collection(db, "agendamentos"),
        where("idDoutor", "==", id),
        orderBy("data", "asc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: Agendamento[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Agendamento, "id">)
      }));

      setLista(lista);
      setCarregando(false);
    });

    return unsubscribe;
  }, [role]);

  // Carrega doutores
  useEffect(() => {

    const q = query(
      collection(db, "usuario"),
      where("role", "==", "dentista"),
      orderBy('nome')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const lista: any[] = [];

      snapshot.forEach((doc) => {
        lista.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setDentistas(lista);
    });

    return unsubscribe;

  }, []);

  // Muda o valor quando clica no checkbox
  const alternarCheck = async (id: string, item: Agendamento) => {

    const novoValor = !item.concluido;

    // Muda na ui
    setLista(old =>
      old.map(item =>
        item.id === id ? 
          { ...item, concluido: novoValor  }
          : item
      )
    );

    // Muda no DB
    const ref = doc(db, "agendamentos", item.id);
    await updateDoc(ref, {
      concluido: novoValor 
    });
  };

  // Confirma se quer mesmo deletar
  const confirmarDelete = (item : Agendamento) => {

    Alert.alert(
      `Desmarcar consulta?`, 
      "Essa ação não poderá ser revertida.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Desmarcar",
          style: "destructive",
          onPress: () => deletar(item)
        }
      ],
      { cancelable: true }
    );
  };

  // Deleta consulta
  const deletar = async(item: Agendamento) => {
    try {
      await deleteDoc(doc(db, "agendamentos", item.id));

      Alert.alert("Consulta desmarcada", `A consulta de ${item.nome} foi desmarcada`);

      } 
      catch (error) {
        console.log(error);
        alert("Erro ao desmarcar consulta");
      }

  };

  // Separa por dia
  const agruparPorDia = (dados: Agendamento[]): SecoesAgenda => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    const futuros: Record<string, Agendamento[]> = {};
    const passados: Record<string, Agendamento[]> = {};

    dados.forEach(item => {
      const data = normalizarData(item.data);
      if (!data) return;

      // zera horário
      data.setHours(0,0,0,0);

      // timestamp do dia (chave segura)
      const chave = data.getTime().toString();

      if (data.getTime() < hoje.getTime()) {
        if (!passados[chave]) passados[chave] = [];
        passados[chave].push(item);
      } else {
        if (!futuros[chave]) futuros[chave] = [];
        futuros[chave].push(item);
      }
    });

    return { futuros, passados };
  };

  const { futuros, passados } = agruparPorDia(lista);

  const diasFuturos = Object.keys(futuros)
    .sort((a, b) => Number(a) - Number(b));

  const diasPassados = Object.keys(passados)
    .sort((a, b) =>  Number(a) - Number(b));

  // Coloca letras maiusculas no titulo
  const capitalizarTitulo = (texto: string) => {
    const ignorar = ["de", "da", "do", "das", "dos", "e"];

    return texto
      .split(" ")
      .map((palavra, index) => {
        const limpa = palavra.toLowerCase();

        // primeira palavra sempre maiúscula
        if (index === 0) {
          return limpa.charAt(0).toUpperCase() + limpa.slice(1);
        }

        // palavras que não capitalizam
        if (ignorar.includes(limpa)) {
          return limpa;
        }

        // capitaliza normalmente
        return limpa.charAt(0).toUpperCase() + limpa.slice(1);
      })
      .join(" ");
  };

  // Formata o dia para ficar no título
  const formatarTituloDia = (timestamp: string) => {
    const data = new Date(Number(timestamp));

    const titulo = data.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    return capitalizarTitulo(titulo);
  };

  // Preenche states
  const preencherStates = (item: Agendamento) => {
    setObs(item.obs);
    setidItem(item.id);
    setNome(item.nome);
    setDoutor(item.idDoutor);

    const dateObj = item.data.toDate();

    // Data (zera horário)
    const soData = new Date(dateObj);
    soData.setHours(0, 0, 0, 0);

    // Hora (mantém hora, mas zera dia)
    const soHora = new Date(dateObj);
    soHora.setFullYear(1970, 0, 1);

    setData(soData);
    setHora(soHora);
    setAgenda(true)
  };

  // Zera states
  const zerarUseStates = () => {
    setObs('');
    setidItem('');
    setNome('');
    setDoutor('');
    setData(new Date());
    setHora(null);  
  };

  // Lida com mudança na data 
  const onChange = (event: any, dataSelecionada: any) => {
    const dataAtual = dataSelecionada || data;
    setShowData(false);
    setData(dataAtual);
  };

  // Retorna o nome do doutor
  const pegarNomeDoutor = (id: string) => {
    const d = dentistas.find(d => d.id === id);
    return d ? d.nome : "Carregando...";
  };

  // Salva na agenda
  const salvarAgenda = async () => {
    try{   
      let nomeT = nome.trim();

      // Não permite vazio
      if ( !nomeT || doutor === '' || data === null || hora === null ) {
        alert("Nome, horário e doutor são campos obrigatórios!");
        return;
      }

      // Junta data + hora
      const dataHoraSelecionada = new Date(data);

      dataHoraSelecionada.setHours(
        hora.getHours(),
        hora.getMinutes(),
        0,
        0
      );

      const agora = new Date();

      // Não permite data pasada
      if (dataHoraSelecionada < agora) {
        alert("Não é possível agendar em horário passado!");
        return;
      } 

      let obsT = obs.trim();

      // Põe no DB
      const ref = doc(db, "agendamentos", idItem);
      await updateDoc(ref, {
        nome: nomeT,
        idDoutor: doutor,
        data: Timestamp.fromDate(dataHoraSelecionada),
        obs: obsT,
      });


      Alert.alert(`Agendamento de editado!`, `O agendamento de ${nomeT} foi editado.`);
    }
    catch ( error:any ){
      console.log(error);
      alert(`Edição falhou`);
    }

    zerarUseStates();
    setAgenda(false);
  };

  // Renderiza a agenda atual
  const ItemAgenda = ({ item }: Props) => {
    return (
      <View style={styles.informacoes}>

        {/*Checkbox para dentista*/}
        {role === "dentista" &&(
          <CheckBox
            checked={item.concluido || false}
            onPress={() => alternarCheck(item.id, item)}
            checkedColor='#F0C10C'
            uncheckedColor="gray"
            size={33}
            containerStyle={{ padding: 0, margin: 0, backgroundColor: 'transparent', alignSelf: 'center' }}
          />
        )}

        {/*Informações*/}
        <TouchableOpacity style={[styles.botao_info, item.concluido && styles.botao_info_concluido]}>
          <Text style={styles.txt_botao}>
            <Text style={styles.txt_botao_negrito}>Paciente: </Text>
            {item.nome}
          </Text>

          <Text style={styles.txt_botao}>
            <Text style={styles.txt_botao_negrito}>Horário: </Text>
            {verHora(item.data)}
          </Text>

          {role != 'dentista' &&(
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Dentista: </Text>
              {pegarNomeDoutor(item.idDoutor)}
            </Text>        
          )}

          {item.obs !== '' && (
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Observação: </Text>
              {item.obs}
            </Text>
          )}
        </TouchableOpacity>

        {/*Botões de editar e excluir*/}
        <View style={styles.botoes_controle}>

          <TouchableOpacity onPress={() => preencherStates(item)}>
            <MaterialIcons name="edit" size={33} color="gray"  style={[styles.botao_controle, {alignSelf: 'center'}]} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => confirmarDelete(item)}>
            <FontAwesome name="trash-o" size={33} color='gray' style={[styles.botao_controle, {alignSelf: 'center'}]} />
          </TouchableOpacity>

        </View>

      </View>
    )
  };

  if (carregando) return null;

  // Renderiza a agenda do passado
  const ItemAgendaPassado = ({ item }: Props) => {
    return (
      <View style={styles.informacoes}>

        {/*Checkbox para dentista*/}
        {role === "dentista" &&(
          <CheckBox
            checked={item.concluido || false}
            onPress={() => alternarCheck(item.id, item)}
            checkedColor='#F0C10C'
            uncheckedColor="gray"
            size={33}
            containerStyle={{ padding: 0, margin: 0, backgroundColor: 'transparent', alignSelf: 'center' }}
          />
        )}

        {/*Informações*/}
        <TouchableOpacity style={[styles.botao_info, item.concluido && styles.botao_info_concluido]}>
          <Text style={styles.txt_botao}>
            <Text style={styles.txt_botao_negrito}>Paciente: </Text>
            {item.nome}
          </Text>

          <Text style={styles.txt_botao}>
            <Text style={styles.txt_botao_negrito}>Horário: </Text>
            {verHora(item.data)}
          </Text>

          {role != 'dentista' &&(
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Dentista: </Text>
              {pegarNomeDoutor(item.idDoutor)}
            </Text>        
          )}

          {item.obs !== '' && (
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Observação: </Text>
              {item.obs}
            </Text>
          )}
        </TouchableOpacity>

        {/*Botões de editar e excluir*/}
        <View style={styles.botoes_controle}>
          <TouchableOpacity onPress={() => confirmarDelete(item)}>
            <FontAwesome name="trash-o" size={33} color='gray' style={[styles.botao_controle, {alignSelf: 'center'}]} />
          </TouchableOpacity>

        </View>

      </View>
    )
  };


  return (
    <ScrollView style={{padding: 5, backgroundColor: 'white'}}>

      {/* BOTÃO PASSADOS */}
      {diasPassados.length > 0 && (
        <TouchableOpacity onPress={() => setMostrarPassados(!mostrarPassados)}>
          <Text style={{marginVertical: 5, fontSize: 15}}>
            {mostrarPassados ? "Ocultar anteriores" : "Ver anteriores"}
          </Text>
        </TouchableOpacity>
      )}

      {/* PASSADOS */}
      {mostrarPassados && diasPassados.map(dia => (
        <View key={dia}>
          <Text style={[styles.titulo_data, {opacity:0.5}]}>
            {formatarTituloDia(dia)}
          </Text>

          {passados[dia].map(item => (
            <ItemAgendaPassado key={item.id} item={item} />
          ))}
        </View>
      ))}

      {/* FUTUROS */}
      {diasFuturos.map(dia => (
        <View key={dia}>
          <Text style={styles.titulo_data}>{formatarTituloDia(dia)}</Text>

          {futuros[dia].map(item => (
            <ItemAgenda key={item.id} item={item} />
          ))}
        </View>
      ))}

      {/*Modal de editar agendamento*/}
      <Modal animationType="fade" transparent visible={agenda} onRequestClose={() => {setAgenda(false); zerarUseStates()}}>
      <View style={modal.fundo_modal}>

        {/*Nome*/}
        <TextInput 
          style={modal.input} 
          placeholder='Nome do paciente' 
          placeholderTextColor={'gray'}
          value={nome} 
          onChangeText={setNome} />

        {/*Data e hora*/}
        <View style={modal.container_botao}>
          <TouchableOpacity style={[modal.input, {justifyContent: 'center', flex: 1}]} onPress={() => {setShowData(true), Keyboard.dismiss()}}>
            <Text style={[modal.txt_data, data? { color: 'black'} : {color: '#6d6c6c'}]}>
              {data ? data.toLocaleDateString("pt-BR") : "Data da consulta"}
            </Text>
          </TouchableOpacity>
          {showData && Platform.OS === 'android' && (
            <DateTimePicker
              value={data || new Date()}
              mode="date"
              display="default"
              onChange={onChange}
            />
          )}

          <TouchableOpacity style={[modal.input, {justifyContent: 'center', flex: 1}]} onPress={() => {setShowHora(true), Keyboard.dismiss()}}>
            <Text style={[modal.txt_data, hora? { color: 'black'} : {color: '#6d6c6c'}]}>
              {hora ? hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Horário"}
            </Text>
          </TouchableOpacity>
          {showHora && Platform.OS === 'android' && (
            <DateTimePicker
              value={hora || new Date()}
              mode="time"
              display="spinner"
              onChange={(event, selectedTime) => { setShowHora(false);
                if (selectedTime) setHora(selectedTime);
              }}
            />
          )}
        </View>

        {/*Obs*/}
        <TextInput 
          style={modal.input} 
          placeholder='Observação' 
          placeholderTextColor={'gray'}
          value={obs} 
          onChangeText={setObs} />

        {/*Doutor*/}
        <View style={[modal.input, {justifyContent: 'center'}]}>
          <Picker
            selectedValue={doutor}
            onValueChange={(itemValue) => setDoutor(itemValue)}
          >
            <Picker.Item label="Selecione o doutor" value="" style={{color: "gray"}}/>
            {dentistas.map((item) => (
              <Picker.Item
                key={item.id}
                label={item.nome}
                value={item.id} 
                style={{color: "gray"}}
              />
            ))}
          </Picker>
        </View>

        {/*Botão de salvar*/}
        <TouchableOpacity style={[modal.botao, {marginBottom: 50}]} onPress={() => salvarAgenda()}>
          <Text style={modal.texto}>Salvar</Text>
        </TouchableOpacity>  
      
      </View>
      </Modal>

    </ScrollView>
  );

}


