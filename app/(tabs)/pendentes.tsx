import { StyleSheet, View, Text, TouchableOpacity, Modal, Alert, FlatList } from 'react-native';
import { modal } from '@/estilos/modal';
import { formatarData, resolverTimestamp } from '@/scripts/dataehora';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { doc, serverTimestamp, query, collection, where, orderBy, onSnapshot, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '@/firebaseConfig';
import { autenticacao } from '@/firebaseConfig';
import * as banco from "@/scripts/banco";

export default function Pendencias() {

  const [role, setRole] = useState('');
  const [info, setInfo] = useState(false);

  const [pendencias, setPendencias] = useState<AlteracaoPendente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarios, setUsuarios] = useState<Record<string, Usuario>>({});

  const [item, setItem] = useState<AlteracaoPendente>();
  const [antes, setAntes] = useState<Transacao>();
  const [depois, setDepois] = useState<Transacao>();

  type AlteracaoPendente = {
    id: string;
    transacaoId: string;
    solicitadoPor: string;
    solicitadoPorNome: string;
    tipo: string;
    antes: any;
    depois: any;
    status: string;
    criadoEm: any;
    analisadoPor: string | null;
    analisadoEm: any | null;
  };

  type Transacao = {
    criadoPor: string;
    nome: string;
    formaPagamento: string;
    idDoutor: string;
    tipo: string;
    data: any;
    valorBruto: number;
    valorDoutor: number;
    valorCartao: number;
    valorClinica: number;
  };

  type Usuario = {
    nome: string;
    porcentagem?: number;
    role?: string;
  };

  // Carrega role
  useEffect(() => {
    const carregarRole = async () => {
      const r = await banco.getRole();
      setRole(r);
    };
    carregarRole();
  }, []);

  // Pega alterações pendentes
  useEffect(() => {
    if (role !== "admin") return;

    const q = query(
      collection(db, "alteracoesPendentes"),
      where("status", "==", "pendente"),
      orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: AlteracaoPendente[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<AlteracaoPendente, "id">)
      }));

      setPendencias(lista);
      setCarregando(false);
    });

    return unsubscribe;
  }, [role]);

  // Carrega usuários
  useEffect(() => {
    const carregarUsuarios = async () => {
      const snap = await getDocs(collection(db, "usuario"));

      const mapa: Record<string, Usuario> = {};

      snap.forEach(doc => {
        mapa[doc.id] = doc.data() as Usuario;
      });

      setUsuarios(mapa);
    };

    carregarUsuarios();
  }, []);

  // Formata a forma de pagamento
  const formataForma = ( forma: string ) => {
    if (forma === 'pix'){
      return 'Pix';
    }
    else if (forma ==='cartao'){
      return 'Cartão';
    }
    else {
      return "Dinheiro";
    }
  };

  // Preenche state
  const preencherState = (item : AlteracaoPendente) => {
    setItem(item);
    setAntes(item.antes);
    setDepois(item.depois);
    setInfo(true);
  };

  // Confirma se quer mesmo mudar
  const confirmarAceitar = (item : AlteracaoPendente) => {

    Alert.alert(
      `Aceitar ${item.tipo === 'deletar' ? "exclusão" : "mudança"} de ${item.antes.nome}?`, 
      "Essa ação não poderá ser revertida.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Aceitar",
          style: "default",
          onPress: () => aceitar(item)
        }
      ],
      { cancelable: true }
    );
  };

  // Aceita a mudança
  const aceitar = async( item : AlteracaoPendente ) => {
    try {

      // Editar
      if (item.tipo === 'edicao'){
        const antes = item.antes;
        const depois = item.depois;

        // Tira caixa antigo 
        if (antes?.formaPagamento === "dinheiro") {
          const delta = antes.tipo === "entrada" ? -antes.valorClinica : +antes.valorClinica;
          await banco.atualizarCaixa(delta);
        }

        // Põe no DB
        const ref = doc(db, "transacao", item.transacaoId);
        await updateDoc(ref, {
          nome: depois?.nome,
          formaPagamento: depois?.formaPagamento,
          idDoutor: depois?.idDoutor,
          tipo: depois?.tipo,
          data: resolverTimestamp(depois?.data),
          valorBruto: depois?.valorBruto,
          valorDoutor: depois?.valorDoutor,
          valorCartao: depois?.valorCartao,
          valorClinica: depois?.valorClinica
        });

        // Coloca no caixa
        if (depois?.formaPagamento === "dinheiro") {
          const delta = depois?.tipo === "entrada" ? +depois.valorClinica : -depois.valorClinica;
          await banco.atualizarCaixa(delta);
        }
        Alert.alert("Registro atualizado!", `${depois.nome} foi atualizado.`);   
      }

      // Remover
      else {

        // Deleta o registro
        await deleteDoc(doc(db, "transacao", item.transacaoId));

        // Tira caixa antigo 
        if (antes?.formaPagamento === "dinheiro") {
          const delta = antes.tipo === "entrada" ? -antes.valorClinica : +antes.valorClinica;
          await banco.atualizarCaixa(delta);
        }

        Alert.alert("Registro deletado!", `${antes?.nome} foi deletado.`);
      }

      // Atualiza pendência
      const refPendente = doc(db, "alteracoesPendentes", item.id);
      await updateDoc(refPendente, {
        status: "aceito",
        analisadoPor: autenticacao.currentUser?.uid ?? null,
        analisadoEm: serverTimestamp()
      });

    }
    catch (error) {
      console.log(error);
      alert("Erro no processo");
    }
    setInfo(false);
  };

  // Confirma se quer mesmo deletar
  const confirmarNegar = (item : AlteracaoPendente) => {

    Alert.alert(
      `Negar pedido?`, 
      "Essa ação não poderá ser revertida.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Negar",
          style: "destructive",
          onPress: () => negar(item)
        }
      ],
      { cancelable: true }
    );
  };

  // Rejeita a mudança
  const negar = async( item : AlteracaoPendente ) => {
    if (!item?.id) return;

    try {
      const ref = doc(db, "alteracoesPendentes", item.id);

      await updateDoc(ref, {
        status: "negado",
        analisadoPor: autenticacao.currentUser?.uid ?? null,
        analisadoEm: serverTimestamp()
      });

    } 
    catch (e) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível negar a solicitação");
    }
    setInfo(false);
  };


  if (role === "admin"){
    return (
    <View style={styles.container}>

      <FlatList
        data={pendencias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

        <View style={styles.informacoes}>
          <TouchableOpacity style={styles.botao_info} onPress={() => preencherState(item)}>
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Solicitado por: </Text>
              {item.solicitadoPorNome}
            </Text>
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Data: </Text>
              {formatarData(item.criadoEm, true)}
            </Text>
            <Text style={styles.txt_botao}>
              <Text style={styles.txt_botao_negrito}>Tipo: </Text>
              {item.tipo === 'edicao' ? 'Edição' : 'Deletar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.botoes_controle}>
            <TouchableOpacity onPress={() => {confirmarAceitar(item)}}>
              <Feather name="check" size={35} color='#6AA84F' style={styles.botao_controle}/>
            </TouchableOpacity>
              
            <TouchableOpacity onPress={() => {confirmarNegar(item)}}>
              <Feather name="x" size={35} color='#E06666' style={styles.botao_controle}/>
            </TouchableOpacity>
          </View>
        </View>
        )}
      />

      {/*Modal de editar*/}
      <Modal animationType="fade" transparent visible={info} onRequestClose={() => {setInfo(false)}}>
      <View style={modal.fundo_modal_start}>

        <Text style={styles.txt}><Text style={[styles.txt, {fontWeight: 'bold'}]}>Data da solicitação: </Text>
          {formatarData(item?.criadoEm, false)}
        </Text>
        
        <Text style={styles.txt}><Text style={[styles.txt, {fontWeight: 'bold'}]}>Solicitado por: </Text>
          {item?.solicitadoPorNome}
        </Text>

        <Text style={styles.txt}><Text style={[styles.txt, {fontWeight: 'bold'}]}>Tipo: </Text>
          {item?.tipo === 'edicao' ? 'Edição' : 'Deletar'}
        </Text>
        
        <View style={styles.antes_e_depois_container}>

          {/*Antes*/}
          <View style={[styles.antes_e_depois, {borderRightWidth: 1, borderColor: 'black'}]}>
            <Text style={styles.titulo_modal}>Antes</Text>

            <Text 
              style={[styles.txt_antes, antes?.nome !== depois?.nome && { backgroundColor: '#f1a1a1' }]}
            >
              <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                {'Nome: '}
              </Text>
              {antes?.nome}
            </Text>

            <Text 
              style={[styles.txt_antes, antes?.data?.toMillis() !== depois?.data?.toMillis() && { backgroundColor: '#f1a1a1' }]}
            >
              <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                {'Data: '} 
              </Text>
              {formatarData(antes?.data, false)}
            </Text>

            <Text 
              style={[styles.txt_antes, antes?.formaPagamento !== depois?.formaPagamento && { backgroundColor: '#f1a1a1' }]}
            >
              <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                {'Pagamento: '} 
              </Text>
              {formataForma(antes ? antes.formaPagamento : "")}
            </Text>

            <Text 
              style={[styles.txt_antes, antes?.tipo !== depois?.tipo && { backgroundColor: '#f1a1a1' }]}
            >
              <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                {'Tipo: '} 
              </Text>
              {antes?.tipo === 'entrada' ? 'Entrada' : "Saída"}
            </Text>

            <Text 
              style={[styles.txt_antes, antes?.valorBruto !== depois?.valorBruto && { backgroundColor: '#f1a1a1' }]}
            >
              <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                {'Valor: '} 
              </Text>
              {`R$ ${antes?.valorBruto.toFixed(2)}`}
            </Text>

            <Text 
              style={[styles.txt_antes, antes?.idDoutor !== depois?.idDoutor && { backgroundColor: '#f1a1a1' }]}
            >
              <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                {'Doutor: '} 
              </Text>
              {usuarios[antes?.idDoutor || '']?.nome ? usuarios[antes?.idDoutor || '']?.nome : 'Nenhum'}
            </Text>

          </View>

          {/*Depois*/}
          {item?.tipo === 'edicao' &&(
            <View style={styles.antes_e_depois}>
              <Text style={styles.titulo_modal}>Depois</Text>

              <Text 
                style={[styles.txt_antes, antes?.nome !== depois?.nome && { backgroundColor: '#88c76e' }]}
              >
                <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                  {'Nome: '}
                </Text>
                {depois?.nome}
              </Text>

              <Text 
                style={[styles.txt_antes, antes?.data?.toMillis() !== depois?.data?.toMillis() && { backgroundColor: '#88c76e' }]}
              >
                <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                  {'Data: '} 
                </Text>
                {formatarData(depois?.data, false)}
              </Text>

              <Text 
                style={[styles.txt_antes, antes?.formaPagamento !== depois?.formaPagamento && { backgroundColor: '#88c76e' }]}
              >
                <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                  {'Pagamento: '} 
                </Text>
                {formataForma(depois ? depois.formaPagamento : "")}
              </Text>

              <Text 
                style={[styles.txt_antes, antes?.tipo !== depois?.tipo && { backgroundColor: '#88c76e' }]}
              >
                <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                  {'Tipo: '} 
                </Text>
                {depois?.tipo === 'entrada' ? 'Entrada' : "Saída"}
              </Text>

              <Text 
                style={[styles.txt_antes, antes?.valorBruto !== depois?.valorBruto && { backgroundColor: '#88c76e' }]}
              >
                <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                  {'Valor: '} 
                </Text>
                {`R$ ${depois?.valorBruto.toFixed(2)}`}
              </Text>

              <Text 
                style={[styles.txt_antes, antes?.idDoutor !== depois?.idDoutor && { backgroundColor: '#88c76e' }]}
              >
                <Text style={[styles.txt, {fontWeight: 'bold'}]}>
                  {'Doutor: '} 
                </Text>
                {usuarios[depois?.idDoutor || '']?.nome ? usuarios[depois?.idDoutor || '']?.nome : 'Nenhum'}
              </Text>

            </View>
          )}
          {item?.tipo === 'deletar' && (
            <View style={styles.antes_e_depois}>
              <Text style={styles.titulo_modal}>Depois</Text>
              <Text style={styles.txt_antes}></Text>
              <Text style={styles.txt_antes}></Text>
              <Text style={[styles.txt_antes, {textAlign: 'center', color: '#E06666', fontWeight: 'bold'}]}>Deletar</Text>
            </View>
          )}

        </View>

        {/*Botões de controle*/}
        <View style={styles.botoes_modal}>
            <TouchableOpacity style={{alignItems: 'center'}} 
              onPress={() => {if (!item) return; confirmarAceitar(item);}}>
              <Feather name="check" size={50} color='#6AA84F' style={styles.botao_controle}/>
              <Text style={{color: '#6AA84F', fontSize: 16}}>Aceitar</Text>
            </TouchableOpacity>
              
            <TouchableOpacity style={{alignItems: 'center'}} 
              onPress={() => {if (!item) return; confirmarNegar(item);}}>
              <Feather name="x" size={50} color='#E06666' style={styles.botao_controle}/>
              <Text style={{color: '#E06666', fontSize: 16}}>Negar</Text>
            </TouchableOpacity>
        </View>
      
      </View>
      </Modal>

    </View>
    );
  }

  else{
    return (
    <View style={styles.container}>
      <Text>Acesso negado</Text>
    </View>
    );   
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafaff',
    paddingHorizontal: 10,
    height: "100%",
    flex: 1,
    paddingTop: 20,
  },

  informacoes:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },

  txt_botao:{
    color: 'white',
    fontWeight: '500',
    fontSize: 14
  },

  txt_botao_negrito:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },

  botao_info:{
    backgroundColor: '#F0C10C', 
    borderRadius: 10,
    padding: 7,
    flex: 2
  },

  botoes_controle:{
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1
  },

  botao_controle:{
    padding: 10,
  },

  txt:{
    fontSize: 15,
  },

  txt_antes:{
    fontSize: 15,
    paddingHorizontal: 1,
    marginVertical: 1
  },

  antes_e_depois_container:{
    marginTop: 10,
    flexDirection: 'row',
  },

  antes_e_depois:{
    flex: 1
  },

  titulo_modal:{
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 17,
    marginBottom: 7
  },

  botoes_modal:{
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 50
  }
});