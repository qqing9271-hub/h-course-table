import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import { getPlansByDate } from '../domain/plans';
import { Plan } from '../types';

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const BOARDS: Plan['board'][] = ['plan', 'doing', 'done'];
const LABELS: Record<Plan['board'], string> = { plan: '计划', doing: '进行中', done: '已完成' };

export default function TodayPlanScreen() {
  const { plans, addPlan, movePlanAction, completePlan, addReview } = useAppStore();
  const [date, setDate] = useState(localDateStr(new Date()));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const today = getPlansByDate(plans, date);

  function add() {
    if (!title.trim()) return;
    addPlan(date, title, content);
    setTitle('');
    setContent('');
  }

  function planCard(p: Plan) {
    return (
      <View key={p.id} style={styles.card}>
        <Text style={styles.title}>{p.title}</Text>
        {p.content ? <Text style={styles.content}>{p.content}</Text> : null}
        <View style={styles.row}>
          {BOARDS.filter((b) => b !== p.board).map((b) => (
            <TouchableOpacity key={b} style={styles.smallBtn} onPress={() => movePlanAction(p.id, b)}>
              <Text>移到{' ' + LABELS[b]}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.smallBtn} onPress={() => completePlan(p.id, !p.completed)}>
            <Text>{p.completed ? '取消完成' : '完成'}</Text>
          </TouchableOpacity>
        </View>
        {p.board === 'done' ? (
          <TextInput
            style={styles.review}
            placeholder="写复盘..."
            defaultValue={p.review ?? ''}
            onEndEditing={(e) => addReview(p.id, e.nativeEvent.text)}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setDate(localDateStr(addDays(new Date(date + 'T00:00:00'), -1)))}>
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.date}>{date}</Text>
        <TouchableOpacity onPress={() => setDate(localDateStr(addDays(new Date(date + 'T00:00:00'), 1)))}>
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="计划名称" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="内容（可选）" value={content} onChangeText={setContent} />
        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addTxt}>+ 添加计划</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.boards}>
          {BOARDS.map((b) => (
            <View key={b} style={styles.board}>
              <Text style={styles.boardTitle}>{LABELS[b]}</Text>
              {today.filter((p) => p.board === b).map(planCard)}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  dateRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  nav: { fontSize: 26, paddingHorizontal: 16, color: '#4a90e2' },
  date: { fontSize: 18, fontWeight: '700' },
  inputBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, marginBottom: 6 },
  addBtn: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  addTxt: { color: '#fff', fontWeight: '600' },
  boards: { flexDirection: 'row', gap: 8 },
  board: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 8, minHeight: 200 },
  boardTitle: { fontWeight: '700', marginBottom: 6 },
  card: { backgroundColor: '#fafafa', borderRadius: 8, padding: 8, marginBottom: 8 },
  title: { fontWeight: '600' },
  content: { color: '#666', fontSize: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  smallBtn: { backgroundColor: '#eee', borderRadius: 6, padding: 4, paddingHorizontal: 6 },
  review: { marginTop: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6 },
});
