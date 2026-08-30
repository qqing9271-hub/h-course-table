import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

export default function NotesScreen() {
  const { notes, addNote, removeNote } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  function add() {
    if (!title.trim()) return;
    addNote({ id: 'n' + Date.now(), date: todayStr(), title, content });
    setTitle('');
    setContent('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.head}>随笔 / 日记</Text>
      <View style={styles.inputBox}>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="标题" value={title} onChangeText={setTitle} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)"
          style={[styles.input, { minHeight: 70 }]}
          placeholder="写点什么..."
          multiline
          value={content}
          onChangeText={setContent}
        />
        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addTxt}>保存</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {[...notes].reverse().map((n) => (
          <View key={n.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.date}>{n.date}</Text>
            </View>
            <Text style={styles.content}>{n.content}</Text>
            <TouchableOpacity onPress={() => removeNote(n.id)}>
              <Text style={styles.del}>删除</Text>
            </TouchableOpacity>
          </View>
        ))}
        {notes.length === 0 ? <Text style={styles.empty}>还没有随笔</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  head: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  inputBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, marginBottom: 6 },
  addBtn: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  addTxt: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '700' },
  date: { color: '#999', fontSize: 12 },
  content: { color: '#444', marginTop: 4 },
  del: { color: '#c00', marginTop: 6 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 30 },
});