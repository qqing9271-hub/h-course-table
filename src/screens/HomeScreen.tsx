import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useTheme, ThemeColors } from '../theme';
import { currentWeek, isBeforeSemester, isAfterSemester, parseDate } from '../domain/semester';
import { buildDayTimeline, buildWeekGrid, bigPeriodRange, bigPeriodLabel } from '../domain/schedule';
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
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { semester, setting, courses: allCourses, setSetting, addCourse, updateCourse, removeCourse, semesters, setActiveSemester } = useAppStore();
  const courses = coursesForSemester(allCourses, semester?.id);
  const [view, setView] = useState<'day' | 'week'>('week');
  const todayStr = localDateStr(new Date());
  const [schDate, setSchDate] = useState(todayStr);
  const [editCell, setEditCell] = useState<{ weekday: number; bigPeriod: number; course?: Course } | null>(null);
  const [showSemModal, setShowSemModal] = useState(false);

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
            <TouchableOpacity key={slot.bigIndex} style={[styles.slot, { minHeight: setting.dayFontSize * 2 + 40 }]} onPress={() => setEditCell({ weekday: schWd, bigPeriod: slot.bigIndex, course: slot.courses[0] })}>
              <Text style={styles.slotLabel}>{bigPeriodLabel(setting, slot.bigIndex) + (pt && pt.start ? '  ' + pt.start + '-' + pt.end : '')}</Text>
              {slot.courses.length === 0 ? <Text style={styles.empty}>（无课，点击添加）</Text> : slot.courses.map((c) => (
                <View key={c.id} style={styles.course}>
                  <Text style={[styles.courseName, { fontSize: setting.dayFontSize }]}>{c.name}</Text>
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
          <View key={row.bigPeriod} style={[styles.gridRow, { height: setting.weekFontSize * 3 + 80, overflow: 'hidden' }]}>
            <View style={styles.timeCol}>
              <Text style={styles.timeTxt}>{bigPeriodLabel(setting, row.bigPeriod)}</Text>
              <Text style={styles.timeSmall}>{row.start ? row.start + '-' + row.end : ''}</Text>
            </View>
            {row.cells.map((cell) => (
              <TouchableOpacity key={cell.day} style={styles.gridCell} onPress={() => setEditCell({ weekday: cell.day, bigPeriod: row.bigPeriod, course: cell.courses[0] })}>
                {cell.courses.map((c) => (
                  <View key={c.id} style={styles.course}>
                    <Text numberOfLines={2} style={[styles.courseName, { fontSize: setting.weekFontSize }]}>{c.name}</Text>
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
          <TouchableOpacity
            style={styles.themeBtn}
            onPress={() => setSetting({ ...setting, themeMode: setting.themeMode === 'dark' ? 'light' : 'dark' })}
          >
            <Text style={styles.themeTxt}>{setting.themeMode === 'dark' ? '☀️ 浅色' : '🌙 深色'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggle}>
        <TouchableOpacity onPress={() => setView('day')} style={[styles.togBtn, view === 'day' && styles.togActive]}><Text>当日</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setView('week')} style={[styles.togBtn, view === 'week' && styles.togActive]}><Text>一周</Text></TouchableOpacity>
      </View>
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setSchDate(addDaysToDate(schDate, -7))}><Text style={styles.nav2}>‹ 上一周</Text></TouchableOpacity>
        <Text style={styles.weekLabel}>{inSem ? '第 ' + schWeek + ' 周' : weekText}</Text>
        <TouchableOpacity onPress={() => setSchDate(addDaysToDate(schDate, 7))}><Text style={styles.nav2}>下一周 ›</Text></TouchableOpacity>
      </View>

      <View style={styles.fontRow}>
        <Text style={styles.lbl}>当日字体</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setSetting({ ...setting, dayFontSize: Math.max(12, setting.dayFontSize - 2) })}><Text style={styles.nav2}>－</Text></TouchableOpacity>
          <Text style={styles.lbl}>{setting.dayFontSize}</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, dayFontSize: Math.min(20, setting.dayFontSize + 2) })}><Text style={styles.nav2}>＋</Text></TouchableOpacity>
        </View>
        <Text style={styles.lbl}>一周字体</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setSetting({ ...setting, weekFontSize: Math.max(12, setting.weekFontSize - 2) })}><Text style={styles.nav2}>－</Text></TouchableOpacity>
          <Text style={styles.lbl}>{setting.weekFontSize}</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, weekFontSize: Math.min(20, setting.weekFontSize + 2) })}><Text style={styles.nav2}>＋</Text></TouchableOpacity>
        </View>
      </View>

      {!semester ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTxt}>请选择/新建学期课程表</Text>
          <View style={styles.noticeRow}>
            {semesters.length > 0 ? (
              <TouchableOpacity style={styles.jumpBtn} onPress={() => setShowSemModal(true)}><Text style={styles.jumpTxt}>选择已有学期 ›</Text></TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.jumpBtn} onPress={() => goTo('settings')}><Text style={styles.jumpTxt}>新建学期 ›</Text></TouchableOpacity>
          </View>
        </View>
      ) : !canShowSchedule ? (
        <View style={styles.noticeCard}>
          {schBefore ? (
            <>
              <Text style={styles.noticeTxt}>{semester.name} · 现在还未开学</Text>
              <View style={styles.noticeRow}>
                <TouchableOpacity style={styles.jumpBtn} onPress={() => setSchDate(semester.startDate)}><Text style={styles.jumpTxt}>跳到第一周</Text></TouchableOpacity>
                <TouchableOpacity style={styles.jumpBtn} onPress={() => setSchDate(semester.startDate)}><Text style={styles.jumpTxt}>跳到第一天</Text></TouchableOpacity>
              </View>
            </>
          ) : schAfter ? (
            <Text style={styles.noticeTxt}>{semester.name} · 学期已结束</Text>
          ) : (
            <>
              <Text style={styles.noticeTxt}>开学时间/周数有误，请到设置修正</Text>
              <TouchableOpacity style={styles.jumpBtn} onPress={() => goTo('settings')}><Text style={styles.jumpTxt}>去设置 ›</Text></TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>课程表（点击格子可添加/编辑课程）</Text>
          {view === 'day' ? renderDay() : renderWeek()}
          {schDate !== todayStr ? (
            <TouchableOpacity style={styles.jumpBtn} onPress={() => setSchDate(todayStr)}><Text style={styles.jumpTxt}>回到今天</Text></TouchableOpacity>
          ) : null}
          <Text style={styles.sectionTitle}>编辑课表：点格子选择时间段添加课程；节数/时间/导入导出在「课表」页</Text>
        </>
      )}

      <TodayPlanScreen />

      <Modal visible={showSemModal} transparent animationType="slide" onRequestClose={() => setShowSemModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 28 }}>
          <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>选择要在首页显示的学期</Text>
            {semesters.map((s) => (
              <TouchableOpacity key={s.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }} onPress={() => { setActiveSemester(s.id); setShowSemModal(false); setSchDate(todayStr); }}>
                <Text>{s.name}{semester && semester.id === s.id ? '  [当前]' : ''}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 12, backgroundColor: c.line, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => setShowSemModal(false)}>
              <Text>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {editCell ? (
        <CourseEditModal
          visible={!!editCell}
          semesterId={semester?.id}
          weekday={editCell.weekday}
          bigPeriod={editCell.bigPeriod}
          course={editCell.course}
          existingWarning={
            editCell.course || !editCell ? undefined : (
              (() => {
                const exist = courses.find((c) => c.weekday === editCell.weekday && c.bigPeriod === editCell.bigPeriod);
                return exist ? '⚠️ 该时间段已有《' + exist.name + '》，保存会新增一门，请确认是否需要' : undefined;
              })()
            )
          }
          onClose={() => setEditCell(null)}
          onSave={(c) => {
            if (editCell.course) { updateCourse(c); } else { addCourse(c); Alert.alert('添加成功', '已添加《' + c.name + '》，请到对应日期/格子查看'); }
            setEditCell(null);
          }}
          onDelete={(id) => { removeCourse(id); setEditCell(null); Alert.alert('已删除'); }}
        />
      ) : null}
    </ScrollView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: c.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 22, fontWeight: '700' },
  nav: { fontSize: 24, color: c.primary, paddingHorizontal: 8 },
  sub: { color: c.sub, marginTop: 2 },
  setBtn: { marginTop: 8, backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  setTxt: { color: c.textOnPrimary, fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: c.sub, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  checkboxOn: { backgroundColor: c.primary, borderColor: c.primary },
  checkMark: { color: c.textOnPrimary, fontSize: 12 },
  checkTxt: { color: c.text, fontSize: 13 },
  themeBtn: { marginTop: 8, backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-end' },
  themeTxt: { color: c.textOnPrimary, fontSize: 13 },
  warnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  warn: { color: c.danger },
  jumpBtn: { marginLeft: 12, backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  jumpTxt: { color: c.textOnPrimary, fontSize: 12 },
  toggle: { flexDirection: 'row', marginBottom: 8 },
  togBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: c.line, marginRight: 8 },
  togActive: { backgroundColor: c.primary },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nav2: { color: c.primary, fontSize: 14, paddingHorizontal: 6 },
  weekLabel: { fontWeight: '700' },
  fontRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.line, borderRadius: 8, paddingHorizontal: 6 },
  lbl: { fontSize: 13 },
  noticeCard: { backgroundColor: c.card, borderRadius: 10, padding: 16, marginBottom: 8, alignItems: 'center' },
  noticeTxt: { fontSize: 14, color: c.sub, marginBottom: 8, textAlign: 'center' },
  noticeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 6 },
  slot: { backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 8 },
  slotLabel: { color: c.sub, fontSize: 12, marginBottom: 4 },
  empty: { color: c.sub },
  course: { marginTop: 4 },
  courseName: { fontSize: 16, fontWeight: '600' },
  courseMeta: { color: c.sub, fontSize: 12 },
  gridHeader: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 8, paddingVertical: 6 },
  gridHeadCell: { flex: 1, alignItems: 'center' },
  gridHeadTxt: { fontWeight: '700', fontSize: 13 },
  gridRow: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 8, marginTop: 4, padding: 4, minHeight: 64 },
  timeCol: { width: 70, justifyContent: 'center', alignItems: 'center', paddingRight: 4 },
  timeTxt: { fontWeight: '700', fontSize: 12 },
  timeSmall: { fontSize: 10, color: c.sub, textAlign: 'center' },
  gridCell: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
});