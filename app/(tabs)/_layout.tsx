import { Tabs } from 'expo-router';
import React from 'react';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function TabLayout() {

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
          tabBarIcon: ({ color }) => <FontAwesome6 name="house" size={24} color={color} />,
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
