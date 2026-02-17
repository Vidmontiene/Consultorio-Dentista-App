import { router, Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as banco from "@/scripts/banco";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import {  TouchableOpacity, View, Text } from 'react-native';

export default function TabLayout() {

  const [role, setRole] = useState('');

  // Carrega role
  useEffect(() => {
    const carregarRole = async () => {
      const r = await banco.getRole();
      setRole(r);
    };
    carregarRole();
  }, []);

  // Header Customizado
  const Header = () => {

    return(
    <View style={{
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: 15,

      // sombra iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 4,

      // sombra Android
      elevation: 6,
    }}>
      <TouchableOpacity
        onPress={() => router.push('/configuracoes')}
        style={{ marginRight: 1}}
      >
        <AntDesign name="setting" size={26} color="gray" />
      </TouchableOpacity>
    </View>
    )
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <Header/>,      

        tabBarActiveTintColor: '#F0C10C',
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
          height: 68,
          paddingBottom: 8,
          paddingHorizontal: 5,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >

      <Tabs.Screen
        name="transacoes"
        options={{
          title: 'Transações',
          tabBarIcon: ({ color }) => <FontAwesome6 name="money-bill-transfer" size={24} color={color} />,
          
        }}
      />

      <Tabs.Screen
        name="planilha"
        options={{
          title: 'Planilha',
          tabBarIcon: ({ color }) => <FontAwesome6 name="chart-column" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="pendentes"
        options={{
          title: 'Pendentes',
          href: role === "admin" ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Octicons name="package-dependencies" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="agendamentos"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="tooth-outline" size={24} color={color} />
        }}
      />

    </Tabs>
  );
}
