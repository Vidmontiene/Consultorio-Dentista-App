import { StyleSheet, Platform } from 'react-native';

export const info = StyleSheet.create({
  container_info:{
    backgroundColor: '#fdf9ec',
    borderRadius: 13,
    flexDirection: 'row',
    marginVertical: 8,
    overflow: 'hidden',
    minHeight: 100,
    width: '98%',
    alignSelf: 'center',
    maxWidth: 600,


    // ios
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,

    // sombra Android
    elevation: 2,
  },

  borda:{
    backgroundColor: '#F0C10C',
    width: 10,
    
  },

  container_hora:{
    flex: 1.7,
    alignItems: 'center',    
    paddingVertical: 5,
    justifyContent: 'flex-start'
  },

  container_principal:{
    flex: 3,
    gap: 2,
    paddingVertical: 5,
  },

  container_botoes:{
    flex: 3.3,
    paddingVertical: 5,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    gap: 5
  },
  txt_hora:{
    fontSize: 17,
    fontWeight: '700',
    color: '#F0C10C',
    marginBottom: 10
  },
  txt_nome:{
    fontSize: 17,
    fontWeight: '500'
  },
  txt_info:{
    fontSize: 15,
    fontWeight: '300'
  },

  txt_info_negrito:{
    fontSize: 15,
    fontWeight: '400'
  },

  img_botao:{
    marginBottom: 6,
  },

  linha_botoes:{
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
})