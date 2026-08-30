import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, PanResponder } from 'react-native';
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

function PlanCard({ p, movePlanAction, completePlan, addReview, updatePlan }: {
  p: Plan;
  movePlanAction: (id: string, board: Plan['board']) => void;
  completePlan: (id: string, d: boolean) => void;
  addReview: (id: string, r: string) => void;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(p.title);
  const [content, setContent] = useState(p.content ?? '');
  const [time, setTime] = useState(p.time ?? '');
  const [dx, setDx] = useState(0);
  const latest = useRef({ p, movePlanAction });
  latest.current = { p, movePlanAction };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => setDx(g.dx),
      onPanResponderRelease: (_, g) => {
        const pp = latest.current.p;
        const i = BOARDS.indexOf(pp.board);
        if (g.dx < -40 && i > 0) latest.current.movePlanAction(pp.id, BOARDS[i - 1]);
        else if (g.dx > 40 && i < 2) latest.current.movePlanAction(pp.id, BOARDS[i + 1]);
        setDx(0);
      },
      onPanResponderTerminate: () => setDx(0),
    }),
  ).current;

  return (
    <View style={[styles.card, { transform: [{ translateX: dx }] }]}>
      {editing ? (
        <>
          <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.editInput} value={title} onChangeText={setTitle} placeholder="标题" />
          <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.editInput} value={content} onChangeText={setContent} placeholder="内容" />
          <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.editInput} value={time} onChangeText={setTime} placeholder="计划时间（可选）" />
          <View style={styles.row}>
            <TouchableOpacity style={styles.smallBtn} onPress={() => { updatePlan(p.id, { title, content, time }); setEditing(false); }}><Text>保存</Text></TouchableOpacity>
            <TouchableOpacity style={styles.smallBtn} onPress={() => setEditing(false)}><Text>取消</Text></TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.rowBetween}>
            <View style={styles.dragHandle} {...pan.panHandlers}><Text style={styles.dragTxt}>≡</Text></View>
            <Text style={styles.title}>{p.title}</Text>
            <TouchableOpacity onPress={() => { setEditing(true); setTitle(p.title); setContent(p.content ?? ''); setTime(p.time ?? ''); }}><Text style={styles.editLink}>编辑</Text></TouchableOpacity>
          </View>
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
            <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.review} placeholder="写复盘..." defaultValue={p.review ?? ''} onEndEditing={(e) => addReview(p.id, e.nativeEvent.text)} />
          ) : null}
          <Text style={styles.cardDate}>{p.date}{p.time ? '  ' + p.time : ''}</Text>
        </>
      )}
    </View>
  );
}

export default function TodayPlanScreen() {
  const { plans, addPlan, movePlanAction, completePlan, addReview, updatePlan } = useAppStore();
  const [date, setDate] = useState(localDateStr(new Date()));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [time, setTime] = useState('');
  const today = getPlansByDate(plans, date);

  function add() {
    if (!title.trim()) return;
    addPlan(date, title, content, time);
    setTitle(''); setContent(''); setTime('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.planHead}>
        <Text style={styles.planHeadTitle}>今日计划</Text>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => setDate(localDateStr(addDays(new Date(date + 'T00:00:00'), -1)))}><Text style={styles.navSmall}>‹</Text></TouchableOpacity>
          <Text style={styles.dateSmall}>{date}</Text>
          <TouchableOpacity onPress={() => setDate(localDateStr(addDays(new Date(date + 'T00:00:00'), 1)))}><Text style={styles.navSmall}>›</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.inputBox}>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="计划名称" value={title} onChangeText={setTitle} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="内容（可选）" value={content} onChangeText={setContent} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="计划时间（可选）" value={time} onChangeText={setTime} />
        <TouchableOpacity style={styles.addBtn} onPress={add}><Text style={styles.addTxt}>+ 添加计划</Text></TouchableOpacity>
      </View>
      <View style={styles.boards}>
        {BOARDS.map((b) => (
          <View key={b} style={styles.board}>
            <Text style={styles.boardTitle}>{LABELS[b]}</Text>
            {today.filter((p) => p.board === b).map((p) => (
              <PlanCard key={p.id} p={p} movePlanAction={movePlanAction} completePlan={completePlan} addReview={addReview} updatePlan={updatePlan} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planHeadTitle: { fontSize: 16, fontWeight: '700' },
  dateNav: { flexDirection: 'row', alignItems: 'center' },
  navSmall: { fontSize: 18, color: '#4a90e2', paddingHorizontal: 8 },
  dateSmall: { fontSize: 12, color: '#888' },
  inputBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, marginBottom: 6 },
  addBtn: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  addTxt: { color: '#fff', fontWeight: '600' },
  boards: { flexDirection: 'row', gap: 8 },
  board: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 8, minHeight: 160 },
  boardTitle: { fontWeight: '700', marginBottom: 6 },
  card: { backgroundColor: '#fafafa', borderRadius: 8, padding: 8, marginBottom: 8 },
  editInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, marginBottom: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dragHandle: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#eef2f7', alignItems: 'center', justifyContent: 'center' },
  dragTxt: { color: '#4a90e2', fontSize: 16 },
  editLink: { color: '#4a90e2' },
  title: { fontWeight: '600' },
  content: { color: '#666', fontSize: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  smallBtn: { backgroundColor: '#eee', borderRadius: 6, padding: 4, paddingHorizontal: 6 },
  review: { marginTop: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6 },
  cardDate: { fontSize: 10, color: '#aaa', marginTop: 6, textAlign: 'left' },
});