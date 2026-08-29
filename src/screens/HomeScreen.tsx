import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import { currentWeek, isBeforeSemester } from '../domain/semester';
import { coursesOnDay, buildDayTimeline } from '../domain/schedule';

const WEEK_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
function weekdayOne(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

export default function HomeScreen({ goTo }: { goTo: (tab: string) => void }) {
  const { semester, setting, courses } = useAppStore();
  const [view, setView] = useState<'day' | 'week'>('day');
  const today = new Date();
  const dstr = localDateStr(today);
  const wd = weekdayOne(today);
  const week = semester ? currentWeek(semester, dstr) : 0;
  const before = semester ? isBeforeSemester(semester, dstr) : false;

  const dayCourses = coursesOnDay(courses, wd, week);

  function renderDay() {
    const tl = buildDayTimeline(courses, wd, week, setting.periodsPerDay, setting.bigPeriodSize);
    return (
      <ScrollView style={{ flex: 1 }}>
        {tl.map((slot) => (
          <View key={slot.bigIndex} style={styles.slot}>
            <Text style={styles.slotLabel}>{'第 ' + slot.bigIndex + ' 大节'}</Text>
            {slot.courses.length === 0 ? (
              <Text style={styles.empty}>（无课）</Text>
            ) : (
              slot.courses.map((c) => (
                <View key={c.id} style={styles.course}>
                  <Text style={styles.courseName}>{c.name}</Text>
                  <Text style={styles.courseMeta}>
                    {c.teacher ? c.teacher : ''}{c.room ? ' ' + c.room : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    );
  }

  function renderWeek() {
    const cells = [];
    for (let i = 1; i <= (setting.showWeekend ? 7 : 5); i++) {
      const list = coursesOnDay(courses, i, week);
      cells.push(
        <View key={i} style={styles.weekCol}>
          <Text style={styles.weekDay}>{WEEK_NAMES[i]}</Text>
          {list.map((c) => (
            <View key={c.id} style={[styles.course, { marginTop: 4 }]}>
              <Text style={styles.courseName}>{c.name}</Text>
              <Text style={styles.courseMeta}>{'第' + c.bigPeriod + '节'}</Text>
            </View>
          ))}
        </View>,
      );
    }
    return <View style={styles.weekRow}>{cells}</View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{dstr}</Text>
        <Text style={styles.sub}>
          {semester ? semester.name + ' · 第 ' + week + ' 周' : '未设置学期'}
        </Text>
        <View style={styles.toggle}>
          <TouchableOpacity onPress={() => setView('day')} style={[styles.togBtn, view === 'day' && styles.togActive]}>
            <Text>当日</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('week')} style={[styles.togBtn, view === 'week' && styles.togActive]}>
            <Text>一周</Text>
          </TouchableOpacity>
        </View>
      </View>
      {before ? <Text style={styles.warn}>还没开学</Text> : view === 'day' ? renderDay() : renderWeek()}
      <TouchableOpacity style={styles.planBtn} onPress={() => goTo('plan')}>
        <Text style={styles.planTxt}>今日计划</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 16, backgroundColor: '#f5f5f5' },
  header: { marginBottom: 12 },
  date: { fontSize: 26, fontWeight: '700' },
  sub: { color: '#666', marginTop: 4 },
  toggle: { flexDirection: 'row', marginTop: 10 },
  togBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ddd', marginRight: 8 },
  togActive: { backgroundColor: '#4a90e2' },
  slot: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  slotLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  empty: { color: '#bbb' },
  course: { marginTop: 4 },
  courseName: { fontSize: 16, fontWeight: '600' },
  courseMeta: { color: '#666', fontSize: 12 },
  weekRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  weekCol: { width: '18%', backgroundColor: '#fff', borderRadius: 8, padding: 6, minHeight: 160 },
  weekDay: { textAlign: 'center', fontWeight: '700', marginBottom: 4 },
  warn: { color: '#c00', marginBottom: 8 },
  planBtn: { marginTop: 'auto', marginBottom: 30, backgroundColor: '#4a90e2', padding: 14, borderRadius: 10, alignItems: 'center' },
  planTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
