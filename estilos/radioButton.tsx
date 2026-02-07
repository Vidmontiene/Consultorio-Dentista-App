import { Text, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';

// Interface das bolinhas
interface CustomRadioButtonProps {
  label: string;
  value: string;
  selected: boolean;
  onPress: (value: string) => void;
}

// Bolinhas
export const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({label, value, selected, onPress}) => {
  return (
    <TouchableOpacity
      style={styles.container_radio}
      onPress={() => onPress(value)}
      activeOpacity={0.8}
    >
      {/*Bolinha*/}
      <View style={[styles.circulo, selected && styles.circulo_selecionado]}>
        {selected && <View style={styles.circulo_dentro} />}
      </View>

      {/*Label*/}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container_radio:{
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  circulo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },

  circulo_selecionado: {
    borderColor: '#F0C10C',
  },

  circulo_dentro: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F0C10C',
  },
  
  label: {
    marginLeft: 10,
    fontSize: Platform.OS === "ios" ? 16 : 14,
    color: '#000',
    lineHeight: 30
  },
})