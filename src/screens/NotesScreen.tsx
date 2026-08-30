import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useTheme, ThemeColors } from '../theme';

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

export default function NotesScreen() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { notes, addNote, removeNote } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  function add() {
    addNote({ id: 'n' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), date: todayStr(), title: title.trim(), content });
    setTitle('');
    setContent('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.head}>随笔 / 日记</Text>
      <View style={styles.inputBox}>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="标题（可选）" value={title} onChangeText={setTitle} />
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
              <Text style={styles.title}>{n.title || ' '}</Text>
              <Text style={styles.date}>{n.date || ''}</Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: c.bg },
  head: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  inputBox: { backgroundColor: c.card, borderRadius: 10, padding: 10, marginBottom: 10 },
  input: { borderBottomWidth: 1, borderColor: c.line, paddingVertical: 6, marginBottom: 6 },
  addBtn: { backgroundColor: c.primary, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  addTxt: { color: c.textOnPrimary, fontWeight: '600' },
  card: { backgroundColor: c.card, borderRadius: 10, padding: 10, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '700' },
  date: { color: c.sub, fontSize: 12 },
  content: { color: c.text, marginTop: 4 },
  del: { color: c.danger, marginTop: 6 },
  empty: { color: c.sub, textAlign: 'center', marginTop: 30 },
});