import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import NotesScreen from './src/screens/NotesScreen';
import ScheduleEditScreen from './src/screens/ScheduleEditScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Tab = 'home' | 'plan' | 'notes' | 'edit' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: '首页' },
  { key: 'notes', label: '随笔' },
  { key: 'edit', label: '课表' },
  { key: 'settings', label: '设置' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        {tab === 'home' ? <HomeScreen goTo={(t) => setTab(t as Tab)} /> : null}
        {tab === 'notes' ? <NotesScreen /> : null}
        {tab === 'edit' ? <ScheduleEditScreen /> : null}
        {tab === 'settings' ? <SettingsScreen /> : null}
      </View>
      <View style={styles.tabbar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabTxt, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 12,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabTxt: { color: '#888', fontSize: 13 },
  tabActive: { color: '#4a90e2', fontWeight: '700' },
});