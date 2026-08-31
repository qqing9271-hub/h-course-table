import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useTheme, ThemeColors } from '../theme';
import { createBackupData, restoreFromBackup } from '../domain/backup';
import { currentWeek } from '../domain/semester';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import { parseScheduleGrid } from '../domain/excelGrid';
import CalendarModal from '../components/CalendarModal';

export default function SettingsScreen() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    semester, setSemester, setSetting,
    semesters, activeSemesterId, addSemester, removeSemesterAction, setActiveSemester,
    setting, courses, plans, notes, backups, manualBackup, restoreBackup,
    replaceCoursesForSemester,
  } = useAppStore();
  const [sName, setSName] = useState(semester?.name ?? '');
  const [sStart, setSStart] = useState(semester?.startDate ?? '');
  const [sWeeks, setSWeeks] = useState(String(semester?.totalWeeks ?? 1));
  const [restoreText, setRestoreText] = useState('');
  const [msg, setMsg] = useState('');
  const [showCal, setShowCal] = useState(false);
  const [formSemId, setFormSemId] = useState<string | null>(semester?.id ?? null);

  function saveSemester() {
    if (!sName.trim() || !sStart.trim()) return;
    const id = formSemId ?? 's' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    addSemester({ id, name: sName, startDate: sStart, totalWeeks: parseInt(sWeeks, 10) || 1 });
    setFormSemId(id);
    setMsg('✅ 已保存学期：当前第 ' + currentWeek({ id: 's', name: sName, startDate: sStart, totalWeeks: parseInt(sWeeks, 10) || 1 }, new Date().toISOString().slice(0, 10)) + ' 周');
    Alert.alert('已保存学期');
  }

  async function importExcelFor(semesterId: string) {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: false,
      });
      if (res.canceled) return;
      const uri = res.assets[0].uri;
      let wb: any;
      if (Platform.OS === 'web') {
        const resp = await fetch(uri);
        const buf = await resp.arrayBuffer();
        wb = XLSX.read(buf, { type: 'array' });
      } else {
        const pickedName = res.assets[0].name || 'import.xls';
        const cachePath = (FileSystem.cacheDirectory || '') + 'import_' + Date.now() + '_' + pickedName;
        await FileSystem.copyAsync({ from: uri, to: cachePath });
        const b64 = await FileSystem.readAsStringAsync(cachePath, { encoding: FileSystem.EncodingType.Base64 });
        wb = XLSX.read(b64, { type: 'base64' });
      }
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
      const { courses: cs } = parseScheduleGrid(grid);
      replaceCoursesForSemester(cs, semesterId);
      setActiveSemester(semesterId);
      setMsg('✅ 已导入 ' + cs.length + ' 门课到该学期');
    } catch (e) {
      setMsg('❌ 导入失败：' + String(e));
      Alert.alert('导入失败', String(e));
    }
  }

  function doBackup() {
    const data = createBackupData({ semester: semester ?? undefined, setting, courses, plans, notes });
    manualBackup();
    Alert.alert('已手动备份', '备份数量：' + (backups.length + 1));
    setRestoreText(JSON.stringify(data));
  }

  function doRestore() {
    try {
      const data = restoreFromBackup(JSON.parse(restoreText));
      restoreBackup(data);
      Alert.alert('恢复成功', '已恢复课表/计划/随笔/设置');
    } catch (e) {
      Alert.alert('恢复失败', String(e));
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.head}>设置</Text>

      <View style={styles.card}>
        <Text style={styles.cap}>学期</Text>
        <Text style={styles.fieldLabel}>学期名</Text>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="如 2026 秋" value={sName} onChangeText={setSName} />
        <Text style={styles.fieldLabel}>开学时间（点下面选择日期）</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCal(true)}>
          <Text style={styles.dateBtnTxt}>{sStart || '选择开学日期'}</Text>
        </TouchableOpacity>
        <Text style={styles.fieldLabel}>总周数</Text>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="如 16" keyboardType="numeric" value={sWeeks} onChangeText={setSWeeks} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={saveSemester}><Text style={styles.btnTxt}>保存学期</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: c.sub }]} onPress={() => { setSName(''); setSStart(''); setSWeeks(''); setFormSemId(null); setMsg('已进入新建模式，填好点保存'); }}><Text style={styles.btnTxt}>新建学期</Text></TouchableOpacity>
        </View>
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>学期管理（当前：{semester ? semester.name : '无'}）</Text>
        {semesters.map((s) => (
          <View key={s.id} style={styles.semRow}>
            <Text style={styles.lbl}>{s.name}{s.id === activeSemesterId ? '  [当前]' : ''}</Text>
            <View style={styles.row}>
              {s.id !== activeSemesterId ? (
                <TouchableOpacity style={styles.smallBtn} onPress={() => setActiveSemester(s.id)}><Text>首页显示</Text></TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.smallBtn} onPress={() => importExcelFor(s.id)}><Text style={{ color: c.success }}>导入课表</Text></TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={() => removeSemesterAction(s.id)}><Text style={{ color: c.danger }}>删除</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        {semesters.length === 0 ? <Text style={styles.lbl}>还没有学期</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>课表设置</Text>
        <View style={styles.row}>
          <Text style={styles.lbl}>一天节数</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: Math.max(2, setting.periodsPerDay - 2) })}><Text style={styles.nav}>－</Text></TouchableOpacity>
            <Text style={styles.lbl}>{setting.periodsPerDay}</Text>
            <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: setting.periodsPerDay + 2 })}><Text style={styles.nav}>＋</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.lbl}>合并两节（{setting.bigPeriodSize}）</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, bigPeriodSize: setting.bigPeriodSize === 2 ? 1 : 2 })}><Text>{setting.bigPeriodSize === 2 ? '开' : '关'}</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>数据安全</Text>
        <TouchableOpacity style={styles.btn} onPress={doBackup}><Text style={styles.btnTxt}>手动备份（导出备份JSON）</Text></TouchableOpacity>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={[styles.input, { minHeight: 60 }]} multiline placeholder="粘贴备份 JSON 以恢复" value={restoreText} onChangeText={setRestoreText} />
        <TouchableOpacity style={[styles.btn, { backgroundColor: c.sub }]} onPress={doRestore}><Text style={styles.btnTxt}>从备份恢复</Text></TouchableOpacity>
        <Text style={styles.lbl}>已有备份：{backups.length} 份</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>关于</Text>
        <Text style={styles.lbl}>H课程表 v1.0.0</Text>
        <Text style={styles.lbl}>本地存储，无需账号；可在 GitHub 查看源码并发布分享。</Text>
      </View>
      <CalendarModal visible={showCal} value={sStart} onSelect={(d) => { setSStart(d); setShowCal(false); }} onClose={() => setShowCal(false)} />
    </ScrollView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: c.bg },
  head: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  card: { backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 10 },
  cap: { fontWeight: '700', marginBottom: 6 },
  fieldLabel: { fontSize: 12, color: c.sub, marginTop: 6, marginBottom: 2 },
  dateBtn: { borderWidth: 1, borderColor: c.line, borderRadius: 8, padding: 10, marginBottom: 6 },
  dateBtnTxt: { color: c.text },
  input: { borderBottomWidth: 1, borderColor: c.line, paddingVertical: 6, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  lbl: { fontSize: 14, marginBottom: 6 },
  nav: { fontSize: 24, paddingHorizontal: 10, color: c.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.line, borderRadius: 8, paddingHorizontal: 6 },
  btn: { backgroundColor: c.primary, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 6 },
  btnTxt: { color: c.textOnPrimary, fontWeight: '600' },
  msg: { color: c.success, marginTop: 8 },
  semRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  smallBtn: { backgroundColor: c.line, borderRadius: 6, padding: 4, paddingHorizontal: 8, marginRight: 6 },
});