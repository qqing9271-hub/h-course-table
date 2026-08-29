import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { Course, WeeksRule } from '../types';
import { serializeSchedule, parseSchedule } from '../domain/share';

const WEEK_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function ScheduleEditScreen() {
  const { courses, setting, setSetting, addCourse, removeCourse, importCourses } = useAppStore();
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [weekday, setWeekday] = useState('1');
  const [bigPeriod, setBigPeriod] = useState('1');
  const [rule, setRule] = useState('all');
  const [weeks, setWeeks] = useState('1,3,5');
  const [importText, setImportText] = useState('');

  function add() {
    if (!name.trim()) return;
    const wr: WeeksRule = rule === 'odd' ? { type: 'odd' } : rule === 'even' ? { type: 'even' } : rule === 'custom' ? { type: 'custom', weeks: weeks.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n)) } : { type: 'all' };
    const c: Course = {
      id: 'c' + Date.now(),
      name,
      teacher: teacher || undefined,
      room: room || undefined,
      weekday: parseInt(weekday, 10),
      bigPeriod: parseInt(bigPeriod, 10),
      weeksRule: wr,
    };
    addCourse(c);
    setName(''); setTeacher(''); setRoom('');
  }

  function exportJson() {
    Alert.alert('导出的课表 JSON', serializeSchedule({ courses, setting }));
  }

  function importJson() {
    try {
      const parsed = parseSchedule(importText);
      importCourses(parsed.courses);
      setImportText('');
      Alert.alert('导入成功', '已导入 ' + parsed.courses.length + ' 门课');
    } catch (e) {
      Alert.alert('导入失败', String(e));
    }
  }

  const groups = [...Array(setting.showWeekend ? 7 : 5).keys()].map((i) => i + 1);
  const periodTimes = [];
  for (let i = 1; i <= setting.periodsPerDay; i++) periodTimes.push(i);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.head}>课表编辑</Text>

      <View style={styles.card}>
        <Text style={styles.cap}>新增课程</Text>
        <TextInput style={styles.input} placeholder="课程名" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="教师" value={teacher} onChangeText={setTeacher} />
        <TextInput style={styles.input} placeholder="教室" value={room} onChangeText={setRoom} />
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="星期 1-7" keyboardType="numeric" value={weekday} onChangeText={setWeekday} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="第几大节" keyboardType="numeric" value={bigPeriod} onChangeText={setBigPeriod} />
        </View>
        <View style={styles.row}>
          <Text style={styles.lbl}>周次:</Text>
          {['all', 'odd', 'even', 'custom'].map((r) => (
            <TouchableOpacity key={r} style={[styles.smallBtn, rule === r && styles.smallActive]} onPress={() => setRule(r)}>
              <Text>{r === 'all' ? '全部' : r === 'odd' ? '单周' : r === 'even' ? '双周' : '指定周'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {rule === 'custom' ? (
          <TextInput style={styles.input} placeholder="指定周，如 1,3,5" value={weeks} onChangeText={setWeeks} />
        ) : null}
        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addTxt}>添加</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>导入 / 导出</Text>
        <TextInput style={[styles.input, { minHeight: 60 }]} multiline placeholder="粘贴分享/导出的课表 JSON" value={importText} onChangeText={setImportText} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.addBtn} onPress={exportJson}>
            <Text style={styles.addTxt}>导出JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#777' }]} onPress={importJson}>
            <Text style={styles.addTxt}>导入JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>设置</Text>
        <Text style={styles.lbl}>一天节数：{setting.periodsPerDay}</Text>
        <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: setting.periodsPerDay + 1 })}><Text>+</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: Math.max(1, setting.periodsPerDay - 1) })}><Text>-</Text></TouchableOpacity>
        <Text style={styles.lbl}>显示周六日</Text>
        <TouchableOpacity onPress={() => setSetting({ ...setting, showWeekend: !setting.showWeekend })}>
          <Text>{setting.showWeekend ? '开' : '关'}</Text>
        </TouchableOpacity>
      </View>

      {groups.map((wd) => (
        <View key={wd} style={styles.card}>
          <Text style={styles.cap}>{WEEK_NAMES[wd]}</Text>
          {courses.filter((c) => c.weekday === wd).map((c) => (
            <View key={c.id} style={styles.courseRow}>
              <Text style={styles.courseTxt}>{c.name}{'（第' + c.bigPeriod + '节）'}</Text>
              <TouchableOpacity onPress={() => removeCourse(c.id)}><Text style={styles.del}>删除</Text></TouchableOpacity>
            </View>
          ))}
          {courses.filter((c) => c.weekday === wd).length === 0 ? <Text style={styles.empty}>无</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  head: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  cap: { fontWeight: '700', marginBottom: 6 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  lbl: { marginRight: 6 },
  smallBtn: { backgroundColor: '#eee', borderRadius: 6, padding: 4, paddingHorizontal: 8, marginRight: 4 },
  smallActive: { backgroundColor: '#4a90e2' },
  addBtn: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 6, flex: 1, marginRight: 6 },
  addTxt: { color: '#fff', fontWeight: '600' },
  courseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  courseTxt: { flex: 1 },
  del: { color: '#c00' },
  empty: { color: '#aaa' },
});
