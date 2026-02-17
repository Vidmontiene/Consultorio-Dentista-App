import { StyleSheet, TouchableOpacity, View, Text, Modal, TextInput, Keyboard, Platform, Alert } from 'react-native';
import { db } from "../../firebaseConfig";
import * as banco from "@/scripts/banco";
import { Picker } from '@react-native-picker/picker';
import { modal } from '@/estilos/modal';
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore';
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Transacoes() {

  const [entrada, setEntrada] = useState(false);
  const [saida, setSaida] = useState(false);
  const [agenda, setAgenda] = useState(false);

  const [pagamento, setPagamento] = useState('pix');
  const [obs, setObs]= useState('');
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(0); 
  const [hora, setHora] = useState<Date | null>(null); 
  const [data, setData] = useState<Date | null>(new Date());

  const [doutor, setDoutor] = useState('');

  const [dentistas, setDentistas] = useState<any[]>([]);
  const [texto, setTexto] = useState('0,00');

  const [showData, setShowData] = useState(false); 
  const [showHora, setShowHora] = useState(false);

  // Lida com mudanças na moeda
  const mudarValor = ( moeda: string ) => {
    
    const apenasNumeros = moeda.replace(/\D/g, '');

    if (apenasNumeros.length === 0) {
      setTexto('');
      setValor(0);
      return;
    }

    const numero = parseInt(apenasNumeros, 10) / 100;

    setValor(numero);

    const formatado = numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    setTexto(formatado);
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

  const zerarUseStates = () => {
    setPagamento('pix');
    setNome('');
    setValor(0);
    setDoutor('');
    setTexto('0,00');
    setData(new Date());
    setObs('');
    setNumero('');
  };

  // Salva entrada
  const salvarTransacao = async( tipo: string ) => {
    try{
      
      let nomeT = nome.trim();

      // Não permite vazio
      if ( !nomeT || valor === 0 || data === null ) {
        alert("Preencha todos os campos");
        return;
      }

      let valorDoutor = 0;
      let valorCartao = 0;
      let aposCartao = valor;

      // Pega a porcentagem do cartão
      if ( pagamento === 'cartao' && tipo === 'entrada'){
        const porcentagemCartao = await banco.getTaxaCartao();
        valorCartao = valor * ((porcentagemCartao)/100);
      }
      aposCartao -= valorCartao;

      // pega a porcentagem do dentista
      if (doutor != ''  && tipo === 'entrada') {
        const porcentagemDentista = await banco.getPorcentagemDentista(doutor);
        valorDoutor = aposCartao * (porcentagemDentista/100);
      }

      // Separa o valor da clínica
      const  valorClinica = aposCartao - valorDoutor;

      // Pega informaçoes do usuário logado
      let id = await banco.getIdLogado();

      // Cadastra no db
      await addDoc(collection(db, "transacao"), {
        nome: nomeT,
        formaPagamento: pagamento,
        criadoPor: id,
        tipo: tipo,
        valorBruto: valor,
        data: Timestamp.fromDate(data),
        idDoutor: doutor,
        valorClinica: valorClinica,
        valorDoutor: valorDoutor,
        valorCartao: valorCartao
      });

      // Coloca no caixa
      if (pagamento === "dinheiro") {
        const delta = tipo === "entrada" ? +valorClinica : -valorClinica;
        await banco.atualizarCaixa(delta);
      }

      Alert.alert(`Registro ${nomeT} criado com sucesso!`, "As informações foram salvas.");
    }
    catch ( error:any ){
      console.log(error);
      alert(`Criação falhou`);
    }

    zerarUseStates();
    setEntrada(false);
    setSaida(false);
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

      // Cadastra no db
      await addDoc(collection(db, "agendamentos"), {
        nome: nomeT,
        idDoutor: doutor,
        data: Timestamp.fromDate(dataHoraSelecionada),
        obs: obsT,
        numero: numT,
        concluido: false
      });


      Alert.alert(`Agendamento de concluído!`, `O agendamento de ${nomeT} está salvo.`);
    }
    catch ( error:any ){
      console.log(error);
      alert(`Criação falhou`);
    }

    zerarUseStates();
    setAgenda(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nova Transação</Text>

      <TouchableOpacity style={styles.botao} onPress={() => setEntrada(true)}>
        <Text style={styles.texto}>Entrada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao} onPress={() => setSaida(true)}>
        <Text style={styles.texto}>Saída</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao} onPress={() => setAgenda(true)}>
        <Text style={styles.texto}>Agendar</Text>
      </TouchableOpacity>

      {/*Modal de entrada*/}
      <Modal animationType="fade" transparent visible={entrada} onRequestClose={() => {setEntrada(false); zerarUseStates()}}>
      <View style={modal.fundo_modal}>

        {/*Nome*/}
        <TextInput 
          style={modal.input} 
          placeholder='Nome da transação' 
          placeholderTextColor={'gray'}
          value={nome} 
          onChangeText={setNome} />

        {/*Data*/}
        <TouchableOpacity style={[modal.input, {justifyContent: 'center'}]} onPress={() => {setShowData(true), Keyboard.dismiss()}}>
          <Text style={[modal.txt_data, data? { color: 'black'} : {color: '#6d6c6c'}]}>
            {data ? data.toLocaleDateString("pt-BR") : "Data da transação"}
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

        {/*Forma de pagamento*/}
        <View style={[modal.input, {justifyContent: 'center'}]}>
          <Picker
            selectedValue={pagamento}
            onValueChange={(itemValue) => setPagamento(itemValue)}
          >
            <Picker.Item label="Pix" value="pix" style={{color: "gray"}}/>
            <Picker.Item label="Cartão" value="cartao" style={{color: "gray"}}/>
            <Picker.Item label="Dinheiro" value="dinheiro" style={{color: "gray"}}/>
          </Picker>
        </View>

        {/*Valor Bruto*/}
        <View style={modal.container_percent}>
          <Text style={[modal.percentSymbol, {color: 'black'}]}>R$</Text>
          <TextInput 
            style={modal.input_percent}  
            value={texto} 
            onChangeText={mudarValor} 
            keyboardType='decimal-pad'/>  
        </View>

        {/*Doutor responsável (se houver)*/}
        <View style={[modal.input, {justifyContent: 'center'}]}>
          <Picker
            selectedValue={doutor}
            onValueChange={(itemValue) => setDoutor(itemValue)}
          >
            <Picker.Item label="Sem doutor responsável" value="" style={{color: "gray"}}/>
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
        <TouchableOpacity style={[modal.botao, {marginBottom: 50}]} onPress={() => salvarTransacao('entrada')}>
          <Text style={modal.texto}>Salvar</Text>
        </TouchableOpacity>  
      
      </View>
      </Modal>

      {/*Modal de saída*/}
      <Modal animationType="fade" transparent visible={saida} onRequestClose={() => {setSaida(false); zerarUseStates()}}>
      <View style={modal.fundo_modal}>

        {/*Nome*/}
        <TextInput 
          style={modal.input} 
          placeholder='Nome da transação' 
          value={nome} 
          onChangeText={setNome} 
          placeholderTextColor={'gray'}/>

        {/*Data*/}
        <TouchableOpacity style={[modal.input, {justifyContent: 'center'}]} onPress={() => {setShowData(true), Keyboard.dismiss()}}>
          <Text style={[modal.txt_data, data? { color: 'black'} : {color: '#6d6c6c'}]}>
            {data ? data.toLocaleDateString("pt-BR") : "Data da transação"}
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

        {/*Forma de pagamento*/}
        <View style={[modal.input, {justifyContent: 'center'}]}>
          <Picker
            selectedValue={pagamento}
            onValueChange={(itemValue) => setPagamento(itemValue)}
          >
            <Picker.Item label="Pix" value="pix" style={{color: "gray"}}/>
            <Picker.Item label="Cartão" value="cartao" style={{color: "gray"}}/>
            <Picker.Item label="Dinheiro" value="dinheiro" style={{color: "gray"}}/>
          </Picker>
        </View>

        {/*Valor Bruto*/}
        <View style={modal.container_percent}>
          <Text style={[modal.percentSymbol, {color: 'black'}]}>R$</Text>
          <TextInput 
            style={modal.input_percent}  
            value={texto} 
            onChangeText={mudarValor} 
            keyboardType='decimal-pad'/>  
        </View>


        {/*Botão de salvar*/}
        <TouchableOpacity style={[modal.botao, {marginBottom: 50}]} onPress={() => salvarTransacao('saida')}>
          <Text style={modal.texto}>Salvar</Text>
        </TouchableOpacity>  
      
      </View>
      </Modal>

      {/*Modal de agendamento*/}
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


});
