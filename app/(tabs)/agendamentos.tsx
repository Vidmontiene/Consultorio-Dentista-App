import { TouchableOpacity, View, Text, Modal, TextInput, Keyboard, Platform, Alert, ScrollView } from 'react-native';
import { db } from "../../firebaseConfig";
import * as banco from "@/scripts/banco";
import { normalizarData, verHora } from '@/scripts/dataehora';
import React, { useEffect, useState } from 'react';
import { info } from '@/estilos/info';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { enviarWhats } from '@/scripts/whats';
import { CheckBox } from 'react-native-elements';
import { styles } from '@/estilos/lista';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { modal } from '@/estilos/modal';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';

export default function Agendamentos() {

  // Dados do usuário logado
  const [role, setRole] = useState('');
  const [id, setId] = useState('');

  // Dados do DB
  const [dentistas, setDentistas] = useState<any[]>([]);
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [nome, setNome] = useState('');
  const [doutor, setDoutor] = useState('');
  const [numero, setNumero] = useState('');
  const [obs, setObs] = useState('');
  const [hora, setHora] = useState<Date | null>(null); 
  const [data, setData] = useState<Date | null>(new Date());
  const [idItem, setidItem] = useState('');

  // UseStates de abrir/fechar
  const [mostrarPassados, setMostrarPassados] = useState(false);
  const [agenda, setAgenda] = useState(false);
  const [showData, setShowData] = useState(false); 
  const [showHora, setShowHora] = useState(false);

  // Carregamento
  const [carregando, setCarregando] = useState(true);

  // Tipo de registro da agenda
  type Agendamento = {
    idDoutor: string;
    nome: string;
    obs: string;
    data: any;
    concluido: boolean;
    id: string;
    numero: string;
  };

  // Passado e futuro
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

  // Pega agendamentos
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

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const lista: Agendamento[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Agendamento, "id">)
        }));

        setLista(lista);
      },
      (error) => {
        if (error.code === "permission-denied") return;
        console.log("Erro Firestore:", error);       
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

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const lista: any[] = [];

        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setDentistas(lista);
      },
      (error) => {
        if (error.code === "permission-denied") return;
        console.log("Erro Firestore:", error);       
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

  // Capitaliza a primeira letra da string
  const primeiraMaiuscula = (texto: string) => {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  // Formata o dia para ficar no título
  const formatarTituloDia = (timestamp: string) => {
    const data = new Date(Number(timestamp));
    const hoje = new Date();

    // zera horas pra comparar só dia
    hoje.setHours(0,0,0,0);
    const dataCompare = new Date(data);
    dataCompare.setHours(0,0,0,0);

    const diffDias = Math.round(
      (dataCompare.getTime() - hoje.getTime()) / 86400000
    );

    // HOJE / AMANHÃ
    let prefixo = "";

    if (diffDias === 0) prefixo = "Hoje";
    else if (diffDias === 1) prefixo = "Amanhã";
    else {
      prefixo = data.toLocaleDateString("pt-BR", {
        weekday: "long",
      }).replace("-feira", "");
  }

  // DIA
  const dia = data.getDate();

  // MÊS
  let mes = data.toLocaleDateString("pt-BR", { month: "long" });

  return `${primeiraMaiuscula(prefixo)} • ${dia} ${"de " + primeiraMaiuscula(mes)}`;
  };

  // Preenche states
  const preencherStates = (item: Agendamento) => {
    setObs(item.obs);
    setidItem(item.id);
    setNome(item.nome);
    setDoutor(item.idDoutor);
    setNumero(item.numero);

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
    setNumero('');
  };

  // Lida com mudança na data 
  const onChange = (event: any, dataSelecionada: any) => {
    const dataAtual = dataSelecionada || data;
    setShowData(false);
    setData(dataAtual);
  };

  // Lida com mudanças no numero 
  const mudancaNumero = (num: string) => {
    num = num.replace(/[^0-9]/g, "")
    setNumero(num.trim());
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
      let numT = numero.trim();

      // Põe no DB
      const ref = doc(db, "agendamentos", idItem);
      await updateDoc(ref, {
        nome: nomeT,
        idDoutor: doutor,
        data: Timestamp.fromDate(dataHoraSelecionada),
        obs: obsT,
        numero: numT
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
      <View style={info.container_info}>

        <View style={info.borda}></View>
        <View style={info.container_hora}>
          <Text style={info.txt_hora}>{verHora(item.data)}</Text>  

          {role === "dentista" && (
            <CheckBox
              checked={item.concluido || false}
              onPress={() => alternarCheck(item.id, item)}
              checkedColor='#F0C10C'
              uncheckedColor="gray"
              size={28}
              containerStyle={{
                padding: 0,
                margin: 0,
                backgroundColor: 'transparent'
              }}
            />
          )}
        </View>

        <View style={info.container_principal}>

          <Text style={info.txt_nome}>{item.nome}</Text>

          <Text style={info.txt_info}>
            {pegarNomeDoutor(item.idDoutor)}
          </Text>        


          {item.numero !== '' && (
            <Text style={info.txt_info}>
              {item.numero}
            </Text>
          )}  


          {item.obs !== '' && (
            <Text style={info.txt_info}>
              {item.obs}
            </Text>
          )}  
        </View>

        <View style={info.container_botoes}>

          <View style={info.linha_botoes}>
            <TouchableOpacity onPress={() => enviarWhats(item)}>
              <FontAwesome name="whatsapp" size={30} color='#58C57F' />
            </TouchableOpacity>          

            <TouchableOpacity onPress={() => preencherStates(item)}>
              <MaterialIcons name="edit" size={30} color="gray" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmarDelete(item)}>
              <FontAwesome name="trash-o" size={30} color='gray' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  };

  // Renderiza a agenda do passado
  const ItemAgendaPassado = ({ item }: Props) => {
    return (
      <View style={info.container_info}>

        <View style={info.borda}></View>
        <View style={info.container_hora}>
          <Text style={info.txt_hora}>{verHora(item.data)}</Text>  

          {role === "dentista" && (
            <CheckBox
              checked={item.concluido || false}
              onPress={() => alternarCheck(item.id, item)}
              checkedColor='#F0C10C'
              uncheckedColor="gray"
              size={28}
              containerStyle={{
                padding: 0,
                margin: 0,
                backgroundColor: 'transparent'
              }}
            />
          )}
        </View>

        <View style={info.container_principal}>

          <Text style={info.txt_nome}>{item.nome}</Text>

          <Text style={info.txt_info}>
            {pegarNomeDoutor(item.idDoutor)}
          </Text>        

          {item.numero !== '' && (
            <Text style={info.txt_info}>
              {item.numero}
            </Text>
          )}  

          {item.obs !== '' && (
            <Text style={info.txt_info}>
              {item.obs}
            </Text>
          )}  
        </View>

        <View style={[info.container_botoes, {justifyContent: 'flex-end', paddingRight: 5}]}>

          <TouchableOpacity onPress={() => confirmarDelete(item)}>
            <FontAwesome name="trash-o" size={33} color='gray' style={info.img_botao}  />
          </TouchableOpacity>
      
        </View>
      </View>
    )
  };

  if (carregando) return null;

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

        {/*Numero*/}
        <TextInput 
          style={modal.input} 
          placeholder='Número' 
          placeholderTextColor={'gray'}
          value={numero} 
          keyboardType="numeric"
          maxLength={13}
          onChangeText={mudancaNumero} />

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

