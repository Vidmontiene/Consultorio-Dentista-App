import { StyleSheet } from 'react-native';

export const modal = StyleSheet.create({
 fundo_modal:{
    backgroundColor: 'white',
    margin:'auto',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    alignSelf: 'center',
    gap: 23
  },

  input:{
    height: 50,
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E8EAF6',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 5,
    paddingHorizontal: 15, 
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, 
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

  container_percent:{
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E8EAF6',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 5,
    paddingHorizontal: 15, 
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, 
  },

  input_percent: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },

  percentSymbol: {
  fontSize: 16,
  color: "#666",
  marginLeft: 6,
  },

  container_botao:{ // Div de data e hora
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%", 
  },

  txt_data:{
    paddingLeft: 5,
    fontSize: 16,
  },

})