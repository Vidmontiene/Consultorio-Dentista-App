import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as banco from "@/scripts/banco";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';

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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
      }}>

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

      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color }) => <AntDesign name="setting" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
