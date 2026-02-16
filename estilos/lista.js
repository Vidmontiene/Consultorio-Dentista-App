import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    fontSize: 15
  },

  txt_botao_negrito:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },

  botao_info:{
    backgroundColor: '#F0C10C', 
    borderRadius: 10,
    padding: 7,
    flex: 2
  },

  botao_info_concluido:{
    backgroundColor: '#f0c20ca2', 
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
  },

  titulo_data:{
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 10

  }
});