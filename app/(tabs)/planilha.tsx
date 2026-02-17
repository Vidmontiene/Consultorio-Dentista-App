import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ScrollView, SectionList, TouchableOpacity, Alert, Modal, TextInput, Keyboard, Platform } from "react-native";
import { escutarRelatorio, LinhaRelatorio, Totais } from "@/scripts/relatorio";
import { Picker } from '@react-native-picker/picker';
import * as banco from "@/scripts/banco";
import { exportarRelatorioExcel } from "@/scripts/exportarExcel";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { db } from "@/firebaseConfig";
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { useFocusEffect } from "expo-router";
import { modal } from "@/estilos/modal";
import { CustomRadioButton } from "@/estilos/radioButton";
import DateTimePicker from "@react-native-community/datetimepicker";
import usuarios from "../usuarios";

export default function RelatorioScreen() {

  // Linhas da planilha
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);

  // Dados importantes para a planilha
  const [nomesDentistas, setNomesDentistas] = useState<Record<string, UsuarioInfo>>({});
  const [nomesUsuarios, setNomesUsuarios] = useState<Record<string, UsuarioInfo>>({});
  const [dentistasLista, setDentistasLista] = useState<string[]>([]);
  const [totaisPorDentista, setTotaisPorDentista] = useState<Record<string, number>>({});

  const [caixaDB, setCaixaDB] = useState(0);
  const [role, setRole] = useState('');
  const [idLogado, setIdLogado] = useState('');

  // Data selecionada
  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth()+1);
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());

  // useStates para editar
  const [pagamento, setPagamento] = useState('pix');
  const [tipo, setTipo] = useState('');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(0);
  const [data, setData] = useState<Date | null>(null);
  const [texto, setTexto] = useState('0,00');
  const [doutor, setDoutor] = useState('');
  const [id, setId] = useState('');

  // Cópias para caixa
  const [pagamentoCopy, setPagamentoCopy] = useState('pix');
  const [valorClinicaCopy, setValorClinicaCopy] = useState(0);
  const [tipoCopy, setTipoCopy] = useState('');

  const [editar, setEditar] = useState(false);
  const [showData, setShowData] = useState(false); 

  const [dentistas, setDentistas] = useState<any[]>([]);

  type RelatorioSnapshot = {
    linhas: LinhaRelatorio[];
    totais: Totais;
  };

  type UsuarioInfo = {
    nome: string;
    porcentagem: number;
  };

  // Lida com mudança na data 
  const onChange = (event: any, dataSelecionada: any) => {
    const dataAtual = dataSelecionada || data;
    setShowData(false);
    setData(dataAtual);
  };

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

  // Preenche os states do registro clicado
  const preencherStates = async (item: LinhaRelatorio) => {
    setNome(item.nome);
    setValor(item.entrada != 0 ? item.entrada : item.saida);
    setTexto(item.entrada != 0 ? String(item.entrada) : String(item.saida));
    setPagamento(item.formaPagamento);
    setData(item.data.toDate());
    setId(item.id);
    setTipo(item.tipo);
    setDoutor(item.idDoutor);

    //Para o caixa
    setValorClinicaCopy(item.valorClinica);
    setTipoCopy(item.tipo);
    setPagamentoCopy(item.formaPagamento);

    // Abre modal de editar
    setEditar(true);
  };

  // Salva as mudanças
  const salvar = async() => {
    try {
      let nomeT = nome.trim();

      // Não permite vazio
      if ( !nomeT || valor === 0 ) {
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

      // Se for adm já salva direto
      if (role === 'admin'){

        // Tira caixa antigo 
        if (pagamentoCopy === "dinheiro") {
          const delta = tipoCopy === "entrada" ? -valorClinicaCopy : +valorClinicaCopy;
          await banco.atualizarCaixa(delta);
        }

        // Põe no DB
        const ref = doc(db, "transacao", id);
        await updateDoc(ref, {
          nome: nomeT,
          formaPagamento: pagamento,
          idDoutor: doutor,
          tipo: tipo,
          data: data ? Timestamp.fromDate(data) : serverTimestamp(),
          valorBruto: valor,
          valorDoutor: valorDoutor,
          valorCartao: valorCartao,
          valorClinica: valorClinica
        });

        // Coloca no caixa
        if (pagamento === "dinheiro") {
          const delta = tipo === "entrada" ? +valorClinica : -valorClinica;
          await banco.atualizarCaixa(delta);
          await carregarCaixa();
        }

        Alert.alert("Registro atualizado!", `${nomeT} foi atualizado.`);
      }   
      
      // Se for funcionário salva a pendência
      else {
        const ref = doc(db, "transacao", id);
        const snap = await getDoc(ref);
        
        if (!snap.exists()) {
          alert("Registro não encontrado");
          return;
        }

        const dadosAntigos = snap.data();

        const dadosNovos = {
          nome: nomeT,
          formaPagamento: pagamento,
          idDoutor: doutor,
          tipo: tipo,
          data: data ? Timestamp.fromDate(data) : dadosAntigos.data,
          valorBruto: valor,
          valorDoutor: valorDoutor,
          valorCartao: valorCartao,
          valorClinica: valorClinica
        };

        const usuarioRef = doc(db, "usuario", idLogado);
        const usuarioSnap = await getDoc(usuarioRef);
        const nomeUsuario = usuarioSnap.data()?.nome || "Usuário";

        // Coloca na alteração pendente
        const solicitacaoRef = await addDoc(collection(db, "alteracoesPendentes"), {
          transacaoId: id,
          solicitadoPor: idLogado,
          solicitadoPorNome: nomeUsuario,
          tipo: "edicao",
          antes: { ...dadosAntigos },
          depois: { ...dadosNovos },
          status: "pendente",
          criadoEm: serverTimestamp(),
          analisadoPor: null,
          analisadoEm: null
        }); 

        Alert.alert(
          "Enviado para aprovação",
          "O administrador precisa aprovar a alteração."
        );
      } 
    }
    catch (error) {
      console.log(error);
      alert("Erro ao atualizar");
    }
    setEditar(false);
  };

  // Confirma se quer mesmo deletar
  const confirmarDelete = (item : LinhaRelatorio) => {

    Alert.alert(
      `Deletar "${item.nome}?"`, 
      "Essa ação não poderá ser revertida.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => deletar(item)
        }
      ],
      { cancelable: true }
    );
  };

  // Deleta registro
  const deletar = async (item: LinhaRelatorio) => {
      try {

        // Se for adm já deleta
        if (role == 'admin'){
          // Deleta o registro
          await deleteDoc(doc(db, "transacao", item.id));

          // Tira caixa antigo 
          if (item.formaPagamento === "dinheiro") {
            const delta = item.tipo === "entrada" ? -item.valorClinica : +item.valorClinica;
            await banco.atualizarCaixa(delta);
            await carregarCaixa();
          }

          Alert.alert("Registro deletado!", `${nome} foi deletado.`);
        }
        
        // Se for funcionário salva a pendência
        else {   
          const usuarioRef = doc(db, "usuario", idLogado);
          const usuarioSnap = await getDoc(usuarioRef);
          const nomeUsuario = usuarioSnap.data()?.nome || "Usuário";

          const ref = doc(db, "transacao", id);
          const snap = await getDoc(ref);
          
          if (!snap.exists()) {
            alert("Registro não encontrado");
            return;
          }
          const dadosAntigos = snap.data();

          // Coloca na alteração pendente
          const solicitacaoRef = await addDoc(collection(db, "alteracoesPendentes"), {
            transacaoId: id,
            solicitadoPor: idLogado,
            solicitadoPorNome: nomeUsuario,
            tipo: "deletar",
            antes: { ...dadosAntigos },
            depois: { ...dadosAntigos },
            status: "pendente",
            criadoEm: serverTimestamp(),
            analisadoPor: null,
            analisadoEm: null
          }); 

          Alert.alert(
            "Enviado para aprovação",
            "O administrador precisa aprovar a exclusão."
          );
        } 
      } 
      catch (error) {
        console.log(error);
        alert("Erro ao deletar registro");
      }
  };

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  // anos baseados nos dados existentes
  const anosDisponiveis = [
    ...new Set(
      linhas
        .map(l => {
          if (!l.data) return null;

          return l.data.toDate().getFullYear();
        })
        .filter((ano): ano is number => ano !== null)
    )
  ];

  function criarDataMes(mes: number, ano: number) {
    return new Date(ano, mes - 1, 1);
  }

  function getMesAnterior(data: Date) {
    return new Date(data.getFullYear(), data.getMonth() - 1, 1);
  }

  const dataSelecionada = criarDataMes(mesSelecionado, anoSelecionado);
  const mesAnterior = getMesAnterior(dataSelecionada);
  const mesAnteriorNumero = mesAnterior.getMonth() + 1;
  const anoAnteriorNumero = mesAnterior.getFullYear();

  // Pega as linhas do mes e ano selecionados
  const linhasFiltradas = linhas
  .filter(l => {
    if (!l.data) return false;

    const d = l.data.toDate();
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();

    return mes === mesSelecionado && ano === anoSelecionado;
  })
  .sort((a, b) => a.data.toMillis() - b.data.toMillis());

  // Pega as linhas do mes anterior
  const linhasMesAnterior = linhas.filter(l => {
    if (!l.data) return false;

    const d = l.data.toDate();
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();

    return mes === mesAnteriorNumero && ano === anoAnteriorNumero;
  });

  // Totais do mes anterioir
  const totaisMesAnterior = linhasMesAnterior.reduce(
    (acc, l) => ({
      entrada: l.tipo === "entrada" ? acc.entrada + l.entrada : acc.entrada,

      caixa: l.tipo === 'entrada' && l.formaPagamento === 'dinheiro' ?
        acc.caixa + l.valorClinica : l.tipo === 'saida' && l.formaPagamento === 'dinheiro' ?
        acc.caixa - l.valorClinica : acc.caixa,
      saida: l.tipo === "saida" ? acc.saida + l.saida : acc.saida,
      saldo: l.tipo === "entrada" ? acc.saldo + l.entrada : acc.saldo - l.saida,
      cartao: acc.cartao + l.valorCartao,
      clinica: l.tipo === 'entrada'
        ? acc.clinica + l.valorClinica
        : acc.clinica - l.valorClinica,
      doutor: (acc.doutor ?? 0) + l.valorDoutor,
    }),
    { saldo: 0, cartao: 0, clinica: 0, doutor: 0, entrada:0, saida: 0, caixa: 0 } as Totais
  );

  // totais do mês e ano selecionados
  const totaisFiltrados = linhasFiltradas.reduce(
    (acc, l) => ({
      // conta acc, para cada linha l
      entrada: l.tipo === "entrada" ? acc.entrada + l.entrada : acc.entrada,
      caixa: l.tipo === 'entrada' && l.formaPagamento === 'dinheiro' ?
        acc.caixa + l.valorClinica : l.tipo === 'saida' && l.formaPagamento === 'dinheiro' ?
        acc.caixa - l.valorClinica: acc.caixa,
      saida: l.tipo === "saida" ? acc.saida + l.saida : acc.saida,
      saldo: l.tipo === "entrada" ? acc.saldo + l.entrada : acc.saldo - l.saida,
      cartao: acc.cartao + l.valorCartao,
      clinica: l.tipo === 'entrada'? acc.clinica + l.valorClinica : acc.clinica - l.valorClinica,
      doutor: (acc.doutor ?? 0) + l.valorDoutor,
    }),
    { saldo: 0, cartao: 0, clinica: 0, doutor: 0, entrada:0, saida: 0, caixa: 0} as Totais
  );

  // totais por dentista do mês
  const totaisPorDentistaFiltrado: Record<string, number> = {};
  linhasFiltradas.forEach(l => {
    if (!l.idDoutor) return;
    totaisPorDentistaFiltrado[l.idDoutor] =
      (totaisPorDentistaFiltrado[l.idDoutor] ?? 0) + l.valorDoutor;
  });

  // Carrega usuário logado primeiro
  useEffect(() => {
    const carregar = async () => {

      const role = await banco.getRole();   
      setRole(role);

      if (role !== "admin") {
        const id = await banco.getIdLogado();
        setIdLogado(id);
      } 
      else {
        setIdLogado("admin");
      }
    };

    carregar();
  }, []);

  useEffect(() => {

    if (!idLogado) return;

    const unsubscribe = escutarRelatorio(async (dados: RelatorioSnapshot) => {

      const { linhas, totais } = dados;
      
      setLinhas(linhas);
      setTotais(totais);

      const idsCriador = [
        ...new Set(linhas.map(l => l.criadoPor).concat(idLogado))
      ];

      const idsDoutor = [
        ...new Set(linhas.map(l => l.idDoutor).concat(idLogado))
      ];

      const [usuarios, dentistas] = await Promise.all([
        buscarMapaUsuarios(idsCriador),
        buscarMapaUsuarios(idsDoutor)
      ]);

      setNomesUsuarios(usuarios);
      setNomesDentistas(dentistas);

      // lista de dentistas dinamica (colunas)
      const idsDentistas = [
        ...new Set(linhas.map(l => l.idDoutor).filter(Boolean))
      ] as string[];

      setDentistasLista(idsDentistas);

      // Totais por dentista
      const totaisPorDentista: Record<string, number> = {};

      linhas.forEach(l => {
        if (!l.idDoutor) return;
        totaisPorDentista[l.idDoutor] =
          (totaisPorDentista[l.idDoutor] ?? 0) + l.valorDoutor;
      });

      setTotaisPorDentista(totaisPorDentista);

    });

    return () => unsubscribe();

  }, [idLogado]); 

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

  const buscarMapaUsuarios = async (ids: string[]) => {

    const unicos = [...new Set(ids.filter(Boolean))];

    const resultados = await Promise.all(
      unicos.map(async (id) => {
        const usuario = await banco.getUsuarioCache(id);
        return { id, ...usuario };
      })
    );

    const mapa: Record<string, { nome: string; porcentagem: number }> = {};

    resultados.forEach(r => {
      mapa[r.id] = {
        nome: r.nome,
        porcentagem: r.porcentagem
      };
    });

    return mapa;
  };

  // Carrega o valor da caixa
  useFocusEffect(
    useCallback(() => {
      carregarCaixa();
    }, [])
  );

  const carregarCaixa = async() => {
    const caixa = await banco.getCaixa();
    setCaixaDB(caixa.toFixed(2));
  }

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

  // Renderiza as linhas do administrador
  const renderItemAdmin = ({ item }: { item: LinhaRelatorio }) => (
    <View style={styles.row}>

      <Text style={styles.cel}>{item.nome}</Text>

      <Text style={styles.cel}>{item.data.toDate().toLocaleDateString("pt-BR")}</Text>

      <Text style={styles.cel}>
        {nomesUsuarios[item.criadoPor]?.nome ?? "—"}
      </Text>

      <Text style={[styles.cel, {color: '#6AA84F'}]}>
        {item.entrada != 0 ? `R$ ${item.entrada}` : ""}
      </Text>

      <Text style={[styles.cel, {color: '#E06666'}]}>
        {item.saida != 0 ? `R$ -${item.saida}` : ""}
      </Text>

      <Text style={styles.cel}>{formataForma(item.formaPagamento)}</Text>

      {dentistasLista.map(id => (
        <Text key={id} style={styles.cel}>
          {id === item.idDoutor
            ? `R$ ${item.valorDoutor.toFixed(2)}`
            : ""}
        </Text>
      ))}

      <Text style={[styles.cel, {color: '#E06666'}]}>
        {item.valorCartao != 0 ?`R$ -${item.valorCartao.toFixed(2)}`: ""}
      </Text>

      <Text style={item.tipo === 'entrada'? 
        [styles.cel, {color: '#6AA84F'}] 
        : 
        [styles.cel, {color: '#E06666'}]}>{
          
        item.tipo === 'entrada' ? 
        `R$ ${item.valorClinica.toFixed(2)}`
        : 
        `R$ -${item.valorClinica.toFixed(2)}` 
      }</Text>

      <TouchableOpacity style={styles.cel} onPress={async () => await preencherStates(item)}>
        <MaterialIcons name="edit" size={24} color="black" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.cel} onPress={() => confirmarDelete(item)}>
        <FontAwesome name="trash-o" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );

  // Renderiza as linhas do funcionário
  const renderItemFuncionario = ({ item }: { item: LinhaRelatorio }) => (
    <View style={styles.row}>

      <Text style={styles.cel}>{item.nome}</Text>

      <Text style={styles.cel}>{item.data.toDate().toLocaleDateString("pt-BR")}</Text>

      <Text style={styles.cel}>
        {nomesUsuarios[item.criadoPor]?.nome ?? "—"}
      </Text>

      <Text style={styles.cel}>{formataForma(item.formaPagamento)}</Text>

      <TouchableOpacity style={styles.cel} onPress={async () => await preencherStates(item)}>
        <MaterialIcons name="edit" size={24} color="black" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.cel} onPress={() => confirmarDelete(item)}>
        <FontAwesome name="trash-o" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );

  // Renderiza as linhas do administrador
  const renderItemDentista = ({ item }: { item: LinhaRelatorio }) => (
    <View style={styles.row}>

      <Text style={styles.cel}>{item.nome}</Text>

      <Text style={styles.cel}>{item.data.toDate().toLocaleDateString("pt-BR")}</Text>

      <Text style={[styles.cel, {color: '#6AA84F'}] }>
        {idLogado === item.idDoutor ? `R$ ${item.valorDoutor.toFixed(2)}` : ""}
      </Text>

      <Text style={styles.cel}>
        {nomesUsuarios[item.criadoPor]?.nome ?? "—"}
      </Text>

      <Text style={styles.cel}>{formataForma(item.formaPagamento)}</Text>

    </View>
  );

  return (
    <>
      {/*Planilha de adminstrador*/}
      {role === 'admin' &&(
        <>
          <View style={styles.linhaPickers}>

            {/*Mes*/}
            <View style={styles.pickerMes}>
              <Picker
                selectedValue={mesSelecionado}
                onValueChange={(itemValue) => setMesSelecionado(itemValue)}
              >
                {meses.map((nome, i) => (
                  <Picker.Item key={i} label={nome} value={i + 1} />
                ))}
              </Picker>
            </View>

            {/*Ano*/}
            <View style={styles.pickerAno}>
              <Picker
                selectedValue={anoSelecionado}
                onValueChange={(itemValue) => setAnoSelecionado(itemValue)}
              >
                {anosDisponiveis.map((ano) => (
                  <Picker.Item key={ano} label={String(ano)} value={Number(ano)} />
                ))}
              </Picker>
            </View>

            {/*Botão de exportar*/}
            <TouchableOpacity  
              style={styles.botao}
              onPress={() => exportarRelatorioExcel(
                linhasFiltradas,    // Linhas do mês
                totaisFiltrados,    // Totais do mês
                totaisMesAnterior,  // Totais do mes anterior
                nomesUsuarios,      // Struct que relaciona id com nome do usuário
                nomesDentistas,     // Struct que relaciona id com nome e porcentagem do dentista
                mesSelecionado,     // Mes selecionado
                anoSelecionado      // Ano selecionado
              )}>
              <Text style={{fontSize: 16}}>Exportar</Text>
            </TouchableOpacity>

          </View>

          {/*Planilha*/}
          <ScrollView horizontal>
          <View style={{ flex: 1 }}>

            <View style={styles.row}>
              <Text style={[styles.cel_header, {width: 200}]}>Receita do mês anterior:</Text>
              <Text style={styles.cel}>R$ {totaisMesAnterior.clinica.toFixed(2)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={[styles.cel_header, {width: 200}]}>Caixa do mês atual:</Text>
              <Text style={styles.cel}>R$ {totaisFiltrados.caixa.toFixed(2)}</Text>
            </View>
          
            {/*Cabeçalho*/}
            <View style={[styles.row, styles.header]}>
              <Text style={styles.cel_header}>Nome</Text>
              <Text style={styles.cel_header}>Data</Text>
              <Text style={styles.cel_header}>Criado por</Text>
              <Text style={styles.cel_header}>Entrada</Text>
              <Text style={styles.cel_header}>Saída</Text>
              <Text style={styles.cel_header}>Forma</Text>

              {dentistasLista.map(id => {
                const d = nomesDentistas[id];

                return (
                  <Text key={id} style={styles.cel_header}>
                    {d ? `${d.porcentagem}% ${d.nome}` : "—"}
                  </Text>
                );
              })}

              <Text style={styles.cel_header}>Taxa Cartão</Text>
              <Text style={styles.cel_header}>Clínica</Text>
              <Text style={styles.cel_header}></Text>
              <Text style={styles.cel_header}></Text>
            </View>

            <FlatList
              data={linhasFiltradas}
              renderItem={renderItemAdmin}
              keyExtractor={(item) => item.id}
            />

            {/*Rodapé*/}
            {linhasFiltradas.length > 0 && (
              <View style={styles.footer}>
                <Text style={styles.total}>TOTAL</Text> 

                <Text style={styles.total}>
                  {`Caixa total: \nR$ ${caixaDB}`}
                </Text>      

                <Text style={styles.total}></Text> 

                <Text style={styles.total}>
                  {`Entrada: \nR$ ${totaisFiltrados.entrada.toFixed(2)}`}  
                </Text> 

                <Text style={styles.total}>
                  {`Saída: \nR$ -${totaisFiltrados.saida.toFixed(2)}`} 
                </Text>        

                <Text style={styles.total}>
                  {`Saldo: \nR$ ${totaisFiltrados.saldo.toFixed(2)}`} 
                </Text> 

                {dentistasLista.map(id => (
                  <Text key={id} style={styles.total}>
                    {`${nomesDentistas[id].nome}: \nR$ ${(totaisPorDentistaFiltrado[id] ?? 0).toFixed(2)}`}
                  </Text>
                ))}

                <Text style={styles.total}>
                  {`Cartão: \nR$ -${totaisFiltrados.cartao.toFixed(2)}`} 
                </Text>

                <Text style={styles.total}>
                  {`Receita: \nR$ ${totaisFiltrados.clinica.toFixed(2)}`}
                </Text>
              </View>
            )}

          </View>
          </ScrollView>
        </>
      )}

      {/*Planilha de funcionário*/}
      { role === 'funcionario' && (
        <>
          <View style={styles.linhaPickers}>

            {/*Mes*/}
            <View style={styles.pickerMes}>
              <Picker
                selectedValue={mesSelecionado}
                onValueChange={(itemValue) => setMesSelecionado(itemValue)}
              >
                {meses.map((nome, i) => (
                  <Picker.Item key={i} label={nome} value={i + 1} />
                ))}
              </Picker>
            </View>

            {/*Ano*/}
            <View style={styles.pickerAno}>
              <Picker
                selectedValue={anoSelecionado}
                onValueChange={(itemValue) => setAnoSelecionado(itemValue)}
              >
                {anosDisponiveis.map((ano) => (
                  <Picker.Item key={ano} label={String(ano)} value={Number(ano)} />
                ))}
              </Picker>
            </View>
          </View>

          {/*Planilha*/}
          <ScrollView horizontal>
          <View style={{ flex: 1 }}>

            <View style={styles.row}>
              <Text style={[styles.cel_header, {width: 200}]}>Caixa do mês atual:</Text>
              <Text style={styles.cel}>R$ {totaisFiltrados.caixa.toFixed(2)}</Text>
            </View>
          
            {/*Cabeçalho*/}
            <View style={[styles.row, styles.header]}>
              <Text style={styles.cel_header}>Nome</Text>
              <Text style={styles.cel_header}>Data</Text>
              <Text style={styles.cel_header}>Criado por</Text>
              <Text style={styles.cel_header}>Forma</Text>
              <Text style={styles.cel_header}></Text>
              <Text style={styles.cel_header}></Text>
            </View>

            <FlatList
              data={linhasFiltradas}
              renderItem={renderItemFuncionario}
              keyExtractor={(item) => item.id}
            />

            {/*Rodapé*/}
            {linhasFiltradas.length > 0 && (
              <View style={styles.footer}>
                <Text style={styles.total}>TOTAL</Text> 

                <Text style={styles.total}>
                  {`Caixa total: \nR$ ${caixaDB}`}
                </Text>      

                <Text style={styles.total}></Text> 
      
              </View>
            )}

          </View>
          </ScrollView>
        </>
      )}

      {/*Planilha de dentista*/}
      {role === 'dentista' && (
        <>
          <View style={styles.linhaPickers}>

            {/*Mes*/}
            <View style={styles.pickerMes}>
              <Picker
                selectedValue={mesSelecionado}
                onValueChange={(itemValue) => setMesSelecionado(itemValue)}
              >
                {meses.map((nome, i) => (
                  <Picker.Item key={i} label={nome} value={i + 1} />
                ))}
              </Picker>
            </View>

            {/*Ano*/}
            <View style={styles.pickerAno}>
              <Picker
                selectedValue={anoSelecionado}
                onValueChange={(itemValue) => setAnoSelecionado(itemValue)}
              >
                {anosDisponiveis.map((ano) => (
                  <Picker.Item key={ano} label={String(ano)} value={Number(ano)} />
                ))}
              </Picker>
            </View>

          </View>

          {/*Planilha*/}
          <ScrollView horizontal>
          <View style={{ flex: 1 }}>

            <View style={styles.row}>
              <Text style={[styles.cel_header, {width: 200}]}>Caixa do mês atual:</Text>
              <Text style={styles.cel}>R$ {totaisFiltrados.caixa.toFixed(2)}</Text>
            </View>
          
            {/*Cabeçalho*/}
            <View style={[styles.row, styles.header]}>
              <Text style={styles.cel_header}>Nome</Text>
              <Text style={styles.cel_header}>Data</Text>
              <Text style={styles.cel_header}>
                {nomesDentistas[idLogado]
                  ? `${nomesDentistas[idLogado].porcentagem}% ${nomesDentistas[idLogado].nome}`
                  : "Carregando..."}
              </Text>
              <Text style={styles.cel_header}>Criado por</Text>
              <Text style={styles.cel_header}>Forma</Text>
            </View>

            <FlatList
              data={linhasFiltradas}
              renderItem={renderItemDentista}
              keyExtractor={(item) => item.id}
            />

            {/*Rodapé*/}
            {linhasFiltradas.length > 0 && (
              <View style={styles.footer}>
                <Text style={styles.total}>TOTAL</Text> 

                <Text style={styles.total}>
                  {`Caixa total: \nR$ ${caixaDB}`}
                </Text>      

                <Text style={styles.total}>
                  {nomesDentistas[idLogado]
                    ? `${nomesDentistas[idLogado].nome}: \nR$ ${(totaisPorDentistaFiltrado[idLogado] ?? 0).toFixed(2)}`
                    : ""}
                </Text> 

                <Text style={styles.total}></Text> 

                <Text style={styles.total}></Text> 
              </View>
            )}

          </View>
          </ScrollView>
        </>
      )}

      {/*Modal de editar*/}
      <Modal animationType="fade" transparent visible={editar} onRequestClose={() => {setEditar(false)}}>
      <View style={modal.fundo_modal}>

        <View style={{flexDirection: 'row',  width: '90%'}}>
          <CustomRadioButton
            flex={true}
            label="Entrada"
            value="entrada"
            selected={tipo === 'entrada'}
            onPress={() => {setTipo('entrada'); Keyboard.dismiss()}}
          />
          <CustomRadioButton
            flex={true}
            label="Saída"
            value="saida"
            selected={tipo === 'saida'}
            onPress={() => {setTipo('saida'); Keyboard.dismiss()}}
          />
        </View>

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

        {/*Doutor responsável (se houver)*/}
        {tipo === "entrada" ? 
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
          :
          <View style={{height: 50, marginVertical: 5,}}>  
          </View> 
        }

        {/*Botão de salvar*/}
        <TouchableOpacity style={[modal.botao, {marginBottom: 50}]} onPress={salvar}>
          <Text style={modal.texto}>Salvar</Text>
        </TouchableOpacity>  
      
      </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#5f5d5d",
    borderWidth:1,
    paddingVertical: 10
  },

  cel: {
    width: 130, 
    paddingHorizontal: 4,
    fontSize: 12,
  },

  cel_header: {
    width: 130, 
    paddingHorizontal: 4,
    fontSize: 13,
    fontWeight: 'bold',
  },

  header: { 
    backgroundColor: "#ddd" ,
  },

  footer: { 
    flexDirection: "row", 
    backgroundColor: '#F0C10C', 
    padding: 10 
  },

  total: {
    width: 130,
    padding: 6,
    fontWeight: "bold",
    backgroundColor: '#F0C10C',
    color: 'white'
  },

  filtroContainer:{
    paddingVertical:10,
    gap: 8,
  },

  linhaPickers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 5,
    marginVertical: 10
  },

  pickerMes: {
    flex: 4,
    backgroundColor: '#F0C10C',
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center'
  },

  pickerAno: {
    flex: 3,
    backgroundColor: '#F0C10C',
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center'
  },

  botao: {
    flex: 2, 
    height: 50,
    backgroundColor: '#F0C10C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
