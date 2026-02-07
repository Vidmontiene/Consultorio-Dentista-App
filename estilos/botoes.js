import { StyleSheet, Platform } from 'react-native';

export const botao = StyleSheet.create({
  botao:{
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderColor: "#f1f1f1ff",
    borderWidth: 0.7,
    borderRadius: 8,
    minHeight: 115,
    marginBottom: 10,
  },

  titulo_botao:{
    fontWeight: 'bold',
    fontSize: Platform.OS === "ios" ? 18 : 17,
  },

  txt_botao:{
    fontSize: Platform.OS === "ios" ? 16 : 14,
    color: '#555',
  },

  txt_negrito:{
    fontSize: Platform.OS === "ios" ? 16 : 14,
    color: '#555',
    fontWeight: 'bold'
  },

  img:{
    marginRight: 12,
    color: '#F0C10C',
    backgroundColor: '#ffeda4',
    padding: 20,
    borderRadius: 12,
  },

  container_botao:{
    flex: 1,
    justifyContent: 'center',
    gap: 3
  },

  seta:{
    marginLeft: 4.5,
    color: '#555'
  },

})