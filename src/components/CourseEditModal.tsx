import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Course, WeeksRule } from '../types';
import { allWeeks, oddWeeks, evenWeeks, toggleWeeks, invertWeeks, ruleFromWeeks } from '../domain/weeks';

interface Props {
  visible: boolean;
  existingWarning?: string;
  semesterId?: string;
  weekday: number;
  bigPeriod: number;
  course?: Course;
  onClose: () => void;
  onSave: (c: Course) => void;
  onDelete?: (id: string) => void;
}

const WEEK_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MAX_WEEK = 25;

export default function CourseEditModal({ visible, semesterId, weekday, bigPeriod, course, onClose, onSave, onDelete, existingWarning }: Props) {
  const initWeeks = (() => {
    const r = course?.weeksRule;
    if (!r || r.type === 'all') return allWeeks(MAX_WEEK);
    if (r.type === 'odd') return oddWeeks(MAX_WEEK);
    if (r.type === 'even') return evenWeeks(MAX_WEEK);
    return r.weeks;
  })();
  const [name, setName] = useState(course?.name ?? '');
  const [teacher, setTeacher] = useState(course?.teacher ?? '');
  const [room, setRoom] = useState(course?.room ?? '');
  const [weeks, setWeeks] = useState<number[]>(initWeeks);
  const [showWeeks, setShowWeeks] = useState(false);

  function save() {
    if (!name.trim()) return;
    const mode = ruleFromWeeks(weeks, MAX_WEEK);
    const rule: WeeksRule =
      mode === 'all' ? { type: 'all' } : mode === 'odd' ? { type: 'odd' } : mode === 'even' ? { type: 'even' } : { type: 'custom', weeks };
    onSave({
      id: course?.id ?? 'c' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      semesterId,
      name,
      teacher: teacher || undefined,
      room: room || undefined,
      weekday,
      bigPeriod,
      weeksRule: rule,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Text style={styles.title}>{course ? '编辑课程' : '添加课程'}（{WEEK_NAMES[weekday]} 第 {bigPeriod} 大节）</Text>
          {existingWarning ? <Text style={styles.warn}>{existingWarning}</Text> : null}
          <TextInput style={styles.input} placeholder="课程全称" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="教师" value={teacher} onChangeText={setTeacher} />
          <TextInput style={styles.input} placeholder="教室" value={room} onChangeText={setRoom} />

          <TouchableOpacity style={styles.weeksBtn} onPress={() => setShowWeeks(!showWeeks)}>
            <Text style={styles.weeksTxt}>上课周数：{weeks.length === allWeeks(MAX_WEEK).length ? '1-' + MAX_WEEK + '周' : weeks.join(',')}</Text>
          </TouchableOpacity>

          {showWeeks ? (
            <ScrollView style={styles.weeksWrap}>
              <View style={styles.weeksGrid}>
                {allWeeks(MAX_WEEK).map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.weekCell, weeks.includes(w) && styles.weekOn]}
                    onPress={() => setWeeks(toggleWeeks(weeks, w))}
                  >
                    <Text style={[styles.weekNum, weeks.includes(w) && styles.weekNumOn]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.weeksActions}>
                <TouchableOpacity onPress={() => setWeeks(allWeeks(MAX_WEEK))}><Text style={styles.act}>全部</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setWeeks(oddWeeks(MAX_WEEK))}><Text style={styles.act}>单周</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setWeeks(evenWeeks(MAX_WEEK))}><Text style={styles.act}>双周</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setWeeks([])}><Text style={styles.act}>清空</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setWeeks(invertWeeks(weeks, MAX_WEEK))}><Text style={styles.act}>反选</Text></TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}

          <View style={styles.row}>
            {course && onDelete ? (
              <TouchableOpacity style={[styles.btn, styles.del]} onPress={() => onDelete(course.id)}><Text style={styles.btnTxt}>删除</Text></TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}><Text style={styles.btnTxt}>取消</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.ok]} onPress={save}><Text style={styles.btnTxt}>确定</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8, marginBottom: 8 },
  weeksBtn: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginBottom: 8 },
  weeksTxt: { color: '#333' },
  weeksWrap: { maxHeight: 220, marginBottom: 8 },
  weeksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weekCell: { width: 38, height: 34, borderRadius: 17, backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center' },
  weekOn: { backgroundColor: '#4a90e2' },
  weekNum: { color: '#334', fontSize: 13 },
  weekNumOn: { color: '#fff' },
  weeksActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  act: { color: '#4a90e2', padding: 4 },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  cancel: { backgroundColor: '#ddd' },
  ok: { backgroundColor: '#2e7d32' },
  del: { backgroundColor: '#e74c3c' },
  warn: { color: '#c00', fontSize: 12, marginBottom: 8 },
  btnTxt: { color: '#fff', fontWeight: '600' },
});