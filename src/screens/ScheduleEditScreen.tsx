import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Platform } from 'react-native';
import { useAppStore } from '../store/appStore';
import { parseScheduleGrid } from '../domain/excelGrid';
import { serializeSchedule, parseSchedule } from '../domain/share';
import { bigPeriodGroups } from '../domain/schedule';
import { DEFAULT_PERIOD_TIMES } from '../constants';
import { Course } from '../types';

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function ScheduleEditScreen() {
  const {
    setting, setSetting, semester, setSemester, addSemester,
    semesters, setActiveSemester,
    replaceCoursesForSemester,
  } = useAppStore();
  const [msg, setMsg] = useState('');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [pickSem, setPickSem] = useState<{ courses: Course[]; name?: string } | null>(null);

  const groups = bigPeriodGroups(setting.periodsPerDay, setting.bigPeriodSize);

  function updatePeriodTime(small: number, key: 'start' | 'end', value: string) {
    const arr = setting.periodTimes.map((p) => ({ ...p }));
    while (arr.length < setting.periodsPerDay) arr.push({ start: '08:00', end: '08:45' });
    const pt = arr[small - 1] ?? { start: '', end: '' };
    arr[small - 1] = { ...pt, [key]: value };
    setSetting({ ...setting, periodTimes: arr });
  }

  async function importExcel() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      });
      if (res.canceled) return;
      const uri = res.assets[0].uri;
      let wb: any;
      if (Platform.OS === 'web') {
        const resp = await fetch(uri);
        const buf = await resp.arrayBuffer();
        wb = XLSX.read(buf, { type: 'array' });
      } else {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        wb = XLSX.read(b64, { type: 'base64' });
      }
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
      const { courses: cs, semesterName } = parseScheduleGrid(grid);
      if (semesters.length > 0) {
        setPickSem({ courses: cs, name: semesterName });
      } else {
        doImport(cs, null, semesterName);
      }
    } catch (e) {
      setMsg('❌ 导入失败：' + String(e));
    }
  }

  function doImport(cs: Course[], targetSemId: string | null, semesterName?: string) {
    let id = targetSemId;
    if (!id) {
      const newSem = { id: 's' + Date.now(), name: semesterName || '导入学期', startDate: todayStr(), totalWeeks: 16 };
      addSemester(newSem);
      id = newSem.id;
    } else if (semesterName && semester) {
      setSemester({ ...semester, name: semesterName });
    }
    replaceCoursesForSemester(cs, id);
    setActiveSemester(id);
    setPickSem(null);
    setMsg('✅ 已导入 ' + cs.length + ' 门课' + (semesterName ? '（' + semesterName + '）' : ''));
  }

  async function startScan() {
    if (!permission) return;
    if (!permission.granted) {
      const p = await requestPermission();
      if (!p.granted) { Alert.alert('需要相机权限'); return; }
    }
    setScanning(true);
  }

  function onScanned(data: string) {
    setScanning(false);
    try {
      const parsed = parseSchedule(data);
      replaceCoursesForSemester(parsed.courses, semester?.id ?? 's' + Date.now());
      setMsg('✅ 扫码导入 ' + parsed.courses.length + ' 门课');
    } catch (e) {
      setMsg('❌ 扫码内容不是有效课表');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.head}>课表</Text>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cap}>学期</Text>
        <Text style={styles.lbl}>{semester ? semester.name + '（' + semester.totalWeeks + '周）' : '未设置学期'}</Text>
        <Text style={styles.lbl}>多学期与开学日期请在「设置」页管理</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>节数设置</Text>
        <View style={styles.row}>
          <Text style={styles.lbl}>一天小节数：{setting.periodsPerDay}</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: Math.max(2, setting.periodsPerDay - 2) })}><Text style={styles.nav}>-</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: setting.periodsPerDay + 2 })}><Text style={styles.nav}>+</Text></TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.lbl}>两小节=一大节（{setting.bigPeriodSize}）</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, bigPeriodSize: setting.bigPeriodSize === 2 ? 1 : 2 })}><Text>{setting.bigPeriodSize === 2 ? '开' : '关'}</Text></TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.lbl}>显示周六日</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, showWeekend: !setting.showWeekend })}><Text>{setting.showWeekend ? '开' : '关'}</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>{setting.bigPeriodSize > 1 ? '每小节时间（按大节分组）' : '每小节时间'}</Text>
        {groups.map((g) => (
          <View key={g.bigIndex} style={{ marginBottom: 8 }}>
            {setting.bigPeriodSize > 1 ? (
              <Text style={styles.lbl}>第 {g.bigIndex} 大节（小节 {g.smalls.join('、')}）</Text>
            ) : null}
            {g.smalls.map((sm) => {
              const pt = setting.periodTimes[sm - 1] ?? DEFAULT_PERIOD_TIMES[sm - 1] ?? { start: '', end: '' };
              return (
                <View key={sm} style={styles.timeRow}>
                  <Text style={styles.lbl}>{sm}</Text>
                  <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.timeInput} placeholder="开始" value={pt.start} onChangeText={(v) => updatePeriodTime(sm, 'start', v)} />
                  <Text style={styles.lbl}>-</Text>
                  <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.timeInput} placeholder="结束" value={pt.end} onChangeText={(v) => updatePeriodTime(sm, 'end', v)} />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>导入 / 导出课表</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#c77' }]} onPress={importExcel}><Text style={styles.addTxt}>导入Excel</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#2e7d32' }]} onPress={() => setQrValue(serializeSchedule({ courses: [], setting, semester: semester ?? undefined }))}><Text style={styles.addTxt}>生成二维码</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#6a3d9a' }]} onPress={startScan}><Text style={styles.addTxt}>扫码导入</Text></TouchableOpacity>
      </View>

      <Modal visible={!!qrValue} transparent animationType="slide" onRequestClose={() => setQrValue(null)}>
        <View style={styles.qrModal}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>扫码导入课表</Text>
            {qrValue ? <QRCode value={qrValue} size={220} /> : null}
            <TouchableOpacity style={styles.addBtn} onPress={() => setQrValue(null)}><Text style={styles.addTxt}>关闭</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={scanning} transparent animationType="slide" onRequestClose={() => setScanning(false)}>
        <View style={styles.qrModal}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>扫描对方课表二维码</Text>
            {scanning ? (
              <CameraView style={{ width: 260, height: 260 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={(r) => onScanned(r.data)} />
            ) : null}
            <TouchableOpacity style={styles.addBtn} onPress={() => setScanning(false)}><Text style={styles.addTxt}>关闭</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={!!pickSem} transparent animationType="slide" onRequestClose={() => setPickSem(null)}>
        <View style={styles.qrModal}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>导入到哪个学期？</Text>
            {semesters.map((s) => (
              <TouchableOpacity key={s.id} style={styles.semChoice} onPress={() => { if (pickSem) doImport(pickSem.courses, s.id, pickSem.name); }}>
                <Text>{s.name}{s.id === semester?.id ? '（当前）' : ''}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.semChoice} onPress={() => { if (pickSem) doImport(pickSem.courses, null, pickSem.name); }}>
              <Text>＋ 新建学期（用课表学期名）</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setPickSem(null)}><Text style={styles.addTxt}>取消</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  head: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  msg: { color: '#2e7d32', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  cap: { fontWeight: '700', marginBottom: 6 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  lbl: { fontSize: 14 },
  nav: { fontSize: 22, paddingHorizontal: 10, color: '#4a90e2' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  timeInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  addBtn: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 6, flex: 1, marginRight: 6 },
  addTxt: { color: '#fff', fontWeight: '600' },
  qrModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  qrBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
  qrTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  semChoice: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginBottom: 8, alignItems: 'center' },
});