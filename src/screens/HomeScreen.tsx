import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import { currentWeek, isBeforeSemester } from '../domain/semester';
import { buildDayTimeline, buildWeekGrid } from '../domain/schedule';

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
  const { semester, setting, courses, setSetting } = useAppStore();
  const [view, setView] = useState<'day' | 'week'>('day');
  const today = new Date();
  const dstr = localDateStr(today);
  const wd = weekdayOne(today);
  const week = semester ? currentWeek(semester, dstr) : 0;
  const before = semester ? isBeforeSemester(semester, dstr) : false;
  const dayCount = setting.showWeekend ? 7 : 5;
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);

  const dayTimeline = buildDayTimeline(courses, wd, week, setting.periodsPerDay, setting.bigPeriodSize);
  const weekGrid = buildWeekGrid(courses, week, setting, days);

  function renderDay() {
    return (
      <ScrollView style={{ flex: 1 }}>
        {dayTimeline.map((slot) => {
          const pt = setting.periodTimes[slot.bigIndex - 1];
          return (
            <View key={slot.bigIndex} style={styles.slot}>
              <Text style={styles.slotLabel}>
                {'第 ' + slot.bigIndex + ' 大节' + (pt ? '  ' + pt.start + '-' + pt.end : '')}
              </Text>
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
          );
        })}
      </ScrollView>
    );
  }

  function renderWeek() {
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.gridHeader}>
          <View style={styles.timeCol} />
          {days.map((d) => (
            <View key={d} style={styles.gridHeadCell}>
              <Text style={styles.gridHeadTxt}>{WEEK_NAMES[d]}</Text>
            </View>
          ))}
        </View>
        {weekGrid.map((row) => (
          <View key={row.bigPeriod} style={styles.gridRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeTxt}>{String(row.bigPeriod)}</Text>
              <Text style={styles.timeSmall}>{row.start + '-' + row.end}</Text>
            </View>
            {row.cells.map((cell) => (
              <View key={cell.day} style={styles.gridCell}>
                {cell.courses.map((c) => (
                  <View key={c.id} style={styles.course}>
                    <Text style={styles.courseName}>{c.name}</Text>
                    <Text style={styles.courseMeta}>{c.room ? c.room : ''}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{dstr}</Text>
          <Text style={styles.sub}>
            {semester ? semester.name + ' · 第 ' + week + ' 周' : '未设置学期'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setSetting({ ...setting, showWeekend: !setting.showWeekend })}
          >
            <View style={[styles.checkbox, setting.showWeekend && styles.checkboxOn]}>
              {setting.showWeekend ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkTxt}>显示周六日</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggle}>
        <TouchableOpacity onPress={() => setView('day')} style={[styles.togBtn, view === 'day' && styles.togActive]}>
          <Text>当日</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView('week')} style={[styles.togBtn, view === 'week' && styles.togActive]}>
          <Text>一周</Text>
        </TouchableOpacity>
      </View>

      {before ? <Text style={styles.warn}>还没开学</Text> : view === 'day' ? renderDay() : renderWeek()}

      <TouchableOpacity style={styles.planBtn} onPress={() => goTo('plan')}>
        <Text style={styles.planTxt}>今日计划</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  date: { fontSize: 24, fontWeight: '700' },
  sub: { color: '#666', marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#999', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  checkboxOn: { backgroundColor: '#4a90e2', borderColor: '#4a90e2' },
  checkMark: { color: '#fff', fontSize: 12 },
  checkTxt: { color: '#444', fontSize: 13 },
  toggle: { flexDirection: 'row', marginBottom: 8 },
  togBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ddd', marginRight: 8 },
  togActive: { backgroundColor: '#4a90e2' },
  slot: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  slotLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  empty: { color: '#bbb' },
  course: { marginTop: 4 },
  courseName: { fontSize: 16, fontWeight: '600' },
  courseMeta: { color: '#666', fontSize: 12 },
  warn: { color: '#c00', marginBottom: 8 },
  gridHeader: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 6 },
  gridHeadCell: { flex: 1, alignItems: 'center' },
  gridHeadTxt: { fontWeight: '700', fontSize: 13 },
  gridRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, marginTop: 4, padding: 4, minHeight: 64 },
  timeCol: { width: 70, justifyContent: 'center', alignItems: 'center', paddingRight: 4 },
  timeTxt: { fontWeight: '700', fontSize: 14 },
  timeSmall: { fontSize: 10, color: '#888', textAlign: 'center' },
  gridCell: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  planBtn: { marginTop: 'auto', marginBottom: 30, backgroundColor: '#4a90e2', padding: 14, borderRadius: 10, alignItems: 'center' },
  planTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
