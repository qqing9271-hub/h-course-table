import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import { currentWeek, isBeforeSemester, isAfterSemester, parseDate } from '../domain/semester';
import { buildDayTimeline, buildWeekGrid, bigPeriodRange } from '../domain/schedule';
import { coursesForSemester } from '../domain/semesters';
import CourseEditModal from '../components/CourseEditModal';
import TodayPlanScreen from './TodayPlanScreen';
import { Course } from '../types';

const WEEK_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function localDateStr(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addDaysToDate(s: string, n: number): string {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}
function weekdayOneStr(s: string): number {
  return ((new Date(s + 'T00:00:00').getDay() + 6) % 7) + 1;
}

export default function HomeScreen({ goTo }: { goTo: (tab: string) => void }) {
  const { semester, setting, courses: allCourses, setSetting, addCourse, updateCourse } = useAppStore();
  const courses = coursesForSemester(allCourses, semester?.id);
  const [view, setView] = useState<'day' | 'week'>('day');
  const todayStr = localDateStr(new Date());
  const [schDate, setSchDate] = useState(todayStr);
  const [editCell, setEditCell] = useState<{ weekday: number; bigPeriod: number; course?: Course } | null>(null);

  const beforeToday = semester ? isBeforeSemester(semester, todayStr) : false;
  const rawW = semester ? currentWeek(semester, schDate) : 0;
  const schWeek = Number.isFinite(rawW) ? rawW : 0;
  const schWd = weekdayOneStr(schDate);
  const schBefore = semester ? isBeforeSemester(semester, schDate) : false;
  const schAfter = semester ? isAfterSemester(semester, schDate) : false;
  const inSem = !!semester && schWeek >= 1 && !schBefore && !schAfter;
  let weekText = '未设置学期';
  if (semester) {
    if (inSem) weekText = '第 ' + schWeek + ' 周';
    else if (schBefore) weekText = '未开学';
    else if (schAfter) weekText = '已结束';
  }
  const canShowSchedule = inSem;
  const displayWeek = schWeek >= 1 ? schWeek : 1;
  const dayCount = setting.showWeekend ? 7 : 5;
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);
  const dayTimeline = buildDayTimeline(courses, schWd, displayWeek, setting.periodsPerDay, setting.bigPeriodSize);
  const weekGrid = buildWeekGrid(courses, displayWeek, setting, days);

  function renderDay() {
    return (
      <View>
        {dayTimeline.map((slot) => {
          const pt = bigPeriodRange(setting, slot.bigIndex);
          return (
            <TouchableOpacity key={slot.bigIndex} style={styles.slot} onPress={() => setEditCell({ weekday: schWd, bigPeriod: slot.bigIndex, course: slot.courses[0] })}>
              <Text style={styles.slotLabel}>{'第 ' + slot.bigIndex + ' 大节' + (pt && pt.start ? '  ' + pt.start + '-' + pt.end : '')}</Text>
              {slot.courses.length === 0 ? <Text style={styles.empty}>（无课，点击添加）</Text> : slot.courses.map((c) => (
                <View key={c.id} style={styles.course}>
                  <Text style={styles.courseName}>{c.name}</Text>
                  <Text style={styles.courseMeta}>{c.teacher ? c.teacher : ''}{c.room ? ' ' + c.room : ''}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderWeek() {
    return (
      <View>
        <View style={styles.gridHeader}>
          <View style={styles.timeCol} />
          {days.map((d) => (<View key={d} style={styles.gridHeadCell}><Text style={styles.gridHeadTxt}>{WEEK_NAMES[d]}</Text></View>))}
        </View>
        {weekGrid.map((row) => (
          <View key={row.bigPeriod} style={styles.gridRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeTxt}>{String(row.bigPeriod)}</Text>
              <Text style={styles.timeSmall}>{row.start ? row.start + '-' + row.end : ''}</Text>
            </View>
            {row.cells.map((cell) => (
              <TouchableOpacity key={cell.day} style={styles.gridCell} onPress={() => setEditCell({ weekday: cell.day, bigPeriod: row.bigPeriod, course: cell.courses[0] })}>
                {cell.courses.map((c) => (
                  <View key={c.id} style={styles.course}>
                    <Text style={styles.courseName}>{c.name}</Text>
                    <Text style={styles.courseMeta}>{c.room ? c.room : ''}</Text>
                  </View>
                ))}
                {cell.courses.length === 0 ? <Text style={styles.empty}>+</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => setSchDate(addDaysToDate(schDate, -1))}><Text style={styles.nav}>‹</Text></TouchableOpacity>
            <Text style={styles.date}>{schDate}</Text>
            <TouchableOpacity onPress={() => setSchDate(addDaysToDate(schDate, 1))}><Text style={styles.nav}>›</Text></TouchableOpacity>
          </View>
          <Text style={styles.sub}>{semester ? semester.name + ' · ' + weekText : '未设置学期'}</Text>
          {!semester || weekText === '未设置学期' ? (
            <TouchableOpacity style={styles.setBtn} onPress={() => goTo('settings')}>
              <Text style={styles.setTxt}>去设置学期 ›</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.checkRow} onPress={() => setSetting({ ...setting, showWeekend: !setting.showWeekend })}>
            <View style={[styles.checkbox, setting.showWeekend && styles.checkboxOn]}>{setting.showWeekend ? <Text style={styles.checkMark}>✓</Text> : null}</View>
            <Text style={styles.checkTxt}>显示周六日</Text>
          </TouchableOpacity>
        </View>
      </View>

      {beforeToday || (semester && schBefore) ? (
        <View style={styles.warnRow}>
          <Text style={styles.warn}>现在还未开学</Text>
          {semester ? (
            <TouchableOpacity style={styles.jumpBtn} onPress={() => setSchDate(semester.startDate)}>
              <Text style={styles.jumpTxt}>跳到开学第一天</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {schAfter ? <Text style={styles.warn}>学期已结束</Text> : null}

      <View style={styles.toggle}>
        <TouchableOpacity onPress={() => setView('day')} style={[styles.togBtn, view === 'day' && styles.togActive]}><Text>当日</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setView('week')} style={[styles.togBtn, view === 'week' && styles.togActive]}><Text>一周</Text></TouchableOpacity>
      </View>
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setSchDate(addDaysToDate(schDate, -7))}><Text style={styles.nav2}>‹ 上一周</Text></TouchableOpacity>
        <Text style={styles.weekLabel}>{inSem ? '第 ' + schWeek + ' 周' : weekText}</Text>
        <TouchableOpacity onPress={() => setSchDate(addDaysToDate(schDate, 7))}><Text style={styles.nav2}>下一周 ›</Text></TouchableOpacity>
      </View>

      {canShowSchedule ? (
        <>
          <Text style={styles.sectionTitle}>课程表（点击格子可添加/编辑课程）</Text>
          {view === 'day' ? renderDay() : renderWeek()}
          <Text style={styles.sectionTitle}>编辑课表：点格子选择时间段添加课程；节数/时间/导入导出在「课表」页</Text>
        </>
      ) : (
        <View style={styles.noticeCard}>
          {!semester || weekText === '未设置学期' ? (
            <>
              <Text style={styles.noticeTxt}>还没有可用的学期，请先设置 学期名 / 开学时间 / 总周数</Text>
              <TouchableOpacity style={styles.jumpBtn} onPress={() => goTo('settings')}><Text style={styles.jumpTxt}>去设置学期 ›</Text></TouchableOpacity>
            </>
          ) : schBefore ? (
            <>
              <Text style={styles.noticeTxt}>现在还未开学，暂不显示课程表</Text>
              <TouchableOpacity style={styles.jumpBtn} onPress={() => setSchDate(semester!.startDate)}><Text style={styles.jumpTxt}>跳到开学第一天</Text></TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noticeTxt}>学期已结束，暂不显示课程表</Text>
          )}
        </View>
      )}

      <TodayPlanScreen />

      {editCell ? (
        <CourseEditModal
          visible={!!editCell}
          semesterId={semester?.id}
          weekday={editCell.weekday}
          bigPeriod={editCell.bigPeriod}
          course={editCell.course}
          onClose={() => setEditCell(null)}
          onSave={(c) => { if (editCell.course) updateCourse(c); else addCourse(c); setEditCell(null); }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 22, fontWeight: '700' },
  nav: { fontSize: 24, color: '#4a90e2', paddingHorizontal: 8 },
  sub: { color: '#666', marginTop: 2 },
  setBtn: { marginTop: 8, backgroundColor: '#4a90e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  setTxt: { color: '#fff', fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#999', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  checkboxOn: { backgroundColor: '#4a90e2', borderColor: '#4a90e2' },
  checkMark: { color: '#fff', fontSize: 12 },
  checkTxt: { color: '#444', fontSize: 13 },
  warnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  warn: { color: '#c00' },
  jumpBtn: { marginLeft: 12, backgroundColor: '#4a90e2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  jumpTxt: { color: '#fff', fontSize: 12 },
  toggle: { flexDirection: 'row', marginBottom: 8 },
  togBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ddd', marginRight: 8 },
  togActive: { backgroundColor: '#4a90e2' },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nav2: { color: '#4a90e2', fontSize: 14, paddingHorizontal: 6 },
  weekLabel: { fontWeight: '700' },
  noticeCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8, alignItems: 'center' },
  noticeTxt: { fontSize: 14, color: '#666', marginBottom: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 6 },
  slot: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  slotLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  empty: { color: '#bbb' },
  course: { marginTop: 4 },
  courseName: { fontSize: 16, fontWeight: '600' },
  courseMeta: { color: '#666', fontSize: 12 },
  gridHeader: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 6 },
  gridHeadCell: { flex: 1, alignItems: 'center' },
  gridHeadTxt: { fontWeight: '700', fontSize: 13 },
  gridRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, marginTop: 4, padding: 4, minHeight: 64 },
  timeCol: { width: 70, justifyContent: 'center', alignItems: 'center', paddingRight: 4 },
  timeTxt: { fontWeight: '700', fontSize: 14 },
  timeSmall: { fontSize: 10, color: '#888', textAlign: 'center' },
  gridCell: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
});