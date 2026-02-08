import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ScrollView } from "react-native";
import { escutarRelatorio, LinhaRelatorio, Totais } from "@/scripts/relatorio";
import * as banco from "@/scripts/banco";

export default function RelatorioScreen() {

  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [nomesUsuarios, setNomesUsuarios] = useState<Record<string, string>>({});
  const [nomesDentistas, setNomesDentistas] = useState<Record<string, string>>({});
  const [dentistasLista, setDentistasLista] = useState<string[]>([]);
  const [totaisPorDentista, setTotaisPorDentista] = useState<Record<string, number>>({});
  const [role, setRole] = useState('');

  type RelatorioSnapshot = {
    linhas: LinhaRelatorio[];
    totais: Totais;
  };

  useEffect(() => {

    const unsubscribe = escutarRelatorio(async (dados: RelatorioSnapshot) => {

      const { linhas, totais } = dados;
      
      setLinhas(linhas);
      setTotais(totais);

      // busca nomes
      const [usuarios, dentistas] = await Promise.all([
        buscarMapaUsuarios(linhas.map((l: { criadoPor: any }) => l.criadoPor)),
        buscarMapaUsuarios(linhas.map((l: { idDoutor: any }) => l.idDoutor))
      ]);

      setNomesUsuarios(usuarios);
      setNomesDentistas(dentistas);

      // lista de dentistas dinamica (colunas)
      const idsDentistas = [
        ...new Set(linhas.map((l: { idDoutor: any }) => l.idDoutor).filter(Boolean))
      ] as string[];

      setDentistasLista(idsDentistas);

      // totais por dentista
      const totaisPorDentista: Record<string, number> = {};

      linhas.forEach((l: { idDoutor: string | number; valorDoutor: number }) => {
        if (!l.idDoutor) return;
        totaisPorDentista[l.idDoutor] =
          (totaisPorDentista[l.idDoutor] ?? 0) + l.valorDoutor;
      });

      setTotaisPorDentista(totaisPorDentista);

      const role = await banco.getRole();
      setRole(role);
    });

    return () => unsubscribe();

  }, []);

  const buscarMapaUsuarios = async (ids: string[]) => {

    const unicos = [...new Set(ids)];

    const resultados = await Promise.all(
      unicos.map(async (id) => {
        const nome = await banco.getNomeCache(id, banco.getNomeBanco);
        return { id, nome };
      })
    );

    const mapa: Record<string, string> = {};
    resultados.forEach(r => mapa[r.id] = r.nome);

    return mapa;
  };

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
  }

  // Formata o tipo
  const formataTipo = ( tipo: string ) => {
    if (tipo === 'saida'){
      return 'Saída';
    }
    else {
      return 'Entrada';
    }
  }

  // Renderiza as linhas
  const renderItem = ({ item }: { item: LinhaRelatorio }) => (
    <View style={styles.row}>
      <Text style={styles.cel}>{item.nome}</Text>
      <Text style={styles.cel}>{item.data}</Text>
      <Text style={styles.cel}>{nomesUsuarios[item.criadoPor] ?? "—"}</Text>
      <Text style={styles.cel}>{formataTipo(item.tipo)}</Text>
      <Text style={styles.cel}>{formataForma(item.formaPagamento)}</Text>
      <Text style={styles.cel}>R$ {item.valorBruto.toFixed(2)}</Text>

      {dentistasLista.map(id => (
        <Text key={id} style={styles.cel}>
          {id === item.idDoutor
            ? `R$ ${item.valorDoutor.toFixed(2)}`
            : ""}
        </Text>
      ))}

      <Text style={styles.cel}>R$ {item.valorCartao.toFixed(2)}</Text>
      <Text style={styles.cel}>R$ {item.valorClinica.toFixed(2)}</Text>
    </View>
  );

  return (
    <>
      {role === 'admin' &&(
        <ScrollView horizontal>
        <View style={{ flex: 1 }}>
        
        {/* CABEÇALHO */}
        <View style={[styles.row, styles.header]}>
          <Text style={styles.cel}>Nome</Text>
          <Text style={styles.cel}>Data</Text>
          <Text style={styles.cel}>Criado por</Text>
          <Text style={styles.cel}>Tipo</Text>
          <Text style={styles.cel}>Forma</Text>
          <Text style={styles.cel}>Valor Bruto</Text>

          {dentistasLista.map(id => (
            <Text key={id} style={styles.cel}>
              {nomesDentistas[id] ?? "—"}
            </Text>
          ))}

          <Text style={styles.cel}>Taxa Cartão</Text>
          <Text style={styles.cel}>Clínica</Text>
        </View>

        <FlatList
          data={linhas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />

        {/* RODAPÉ TOTAL */}
        {totais && (
          <View style={styles.footer}>
            {/* colunas vazias até chegar no bruto */}
            <Text style={styles.total}>TOTAL</Text>
            <Text style={styles.total}></Text>
            <Text style={styles.total}></Text>
            <Text style={styles.total}></Text>
            <Text style={styles.total}></Text>

            {/* total bruto */}
            <Text style={styles.total}>
              {`Bruto: \nR$ ${totais.bruto.toFixed(2)}`}
            </Text>

            {/* totais por dentista (dinâmico) */}
            {dentistasLista.map(id => (
              <Text key={id} style={styles.total}>
                {`${nomesDentistas[id]}: \nR$ ${(totaisPorDentista[id] ?? 0).toFixed(2)}`}
              </Text>
            ))}

            {/* cartão */}
            <Text style={styles.total}>
              {`Cartão: \nR$ ${totais.cartao.toFixed(2)}`}
            </Text>

            {/* clínica */}
            <Text style={styles.total}>
              {`Clínica: \nR$ ${totais.clinica.toFixed(2)}`}
            </Text>

          </View>
        )}

      </View>
      </ScrollView>
      )}
      { role != 'admin' && (
        <Text>Sem acesso!</Text>
      )
      }
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
    width: 100, 
    paddingHorizontal: 4,
    fontSize: 12,
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
    width: 100,
    padding: 6,
    fontWeight: "bold",
    backgroundColor: '#F0C10C',
    color: 'white'
}
});
