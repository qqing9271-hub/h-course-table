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
import { parseScheduleGrid } from '../domain/excelGrid';
import { useAppStore } from '../store/appStore';
import { Course, WeeksRule } from '../types';
import { serializeSchedule, parseSchedule, mapExcelRows } from '../domain/share';

const WEEK_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function ScheduleEditScreen() {
  const { courses, setting, setSetting, addCourse, removeCourse, importCourses, replaceCourses, semester, setSemester } = useAppStore();
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [weekday, setWeekday] = useState('1');
  const [bigPeriod, setBigPeriod] = useState('1');
  const [rule, setRule] = useState('all');
  const [weeks, setWeeks] = useState('1,3,5');
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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
    setMsg('✅ 已添加课程：' + c.name);
  }

  function exportJson() {
    Alert.alert('导出的课表 JSON', serializeSchedule({ courses, setting }));
  }

  function importJson() {
    try {
      const parsed = parseSchedule(importText);
      importCourses(parsed.courses);
      setImportText('');
      setMsg('✅ 已导入 ' + parsed.courses.length + ' 门课');
      Alert.alert('导入成功');
    } catch (e) {
      Alert.alert('导入失败', String(e));
    }
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
      replaceCourses(cs);
      if (semesterName && semester) {
        setSemester({ ...semester, name: semesterName });
      }
      setMsg('✅ Excel 已导入 ' + cs.length + ' 门课' + (semesterName ? '（' + semesterName + '）' : ''));
      Alert.alert('导入成功');
    } catch (e) {
      setMsg('❌ 导入失败：' + String(e));
      Alert.alert('导入失败', String(e));
    }
  }

  async function startScan() {
    if (!permission) return;
    if (!permission.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert('需要相机权限', '请在系统设置里允许相机');
        return;
      }
    }
    setScanning(true);
  }

  function onScanned(data: string) {
    setScanning(false);
    try {
      const parsed = parseSchedule(data);
      importCourses(parsed.courses);
      setMsg('✅ 扫码导入 ' + parsed.courses.length + ' 门课');
      Alert.alert('扫码导入成功');
    } catch (e) {
      Alert.alert('扫码内容不是有效课表', String(e));
    }
  }

  const groups = [...Array(setting.showWeekend ? 7 : 5).keys()].map((i) => i + 1);
  const periodTimes = [];
  for (let i = 1; i <= setting.periodsPerDay; i++) periodTimes.push(i);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.head}>课表编辑</Text>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cap}>新增课程</Text>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="课程名" value={name} onChangeText={setName} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="教师" value={teacher} onChangeText={setTeacher} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="教室" value={room} onChangeText={setRoom} />
        <View style={styles.row}>
          <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={[styles.input, { flex: 1 }]} placeholder="星期 1-7" keyboardType="numeric" value={weekday} onChangeText={setWeekday} />
          <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={[styles.input, { flex: 1 }]} placeholder="第几大节" keyboardType="numeric" value={bigPeriod} onChangeText={setBigPeriod} />
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
          <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="指定周，如 1,3,5" value={weeks} onChangeText={setWeeks} />
        ) : null}
        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addTxt}>添加</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>导入 / 导出</Text>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={[styles.input, { minHeight: 60 }]} multiline placeholder="粘贴分享/导出的课表 JSON" value={importText} onChangeText={setImportText} />
        <View style={styles.row}>
          <TouchableOpacity style={styles.addBtn} onPress={exportJson}>
            <Text style={styles.addTxt}>导出JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#777' }]} onPress={importJson}>
            <Text style={styles.addTxt}>导入JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#c77' }]} onPress={importExcel}>
            <Text style={styles.addTxt}>导入Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#6a3d9a' }]} onPress={startScan}>
            <Text style={styles.addTxt}>扫码导入</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#2e7d32' }]} onPress={() => setQrValue(serializeSchedule({ courses, setting }))}>
          <Text style={styles.addTxt}>生成二维码</Text>
        </TouchableOpacity>
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
      <Modal visible={!!qrValue} transparent animationType="slide" onRequestClose={() => setQrValue(null)}>
        <View style={styles.qrModal}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>扫码导入课表</Text>
            {qrValue ? <QRCode value={qrValue} size={220} /> : null}
            <TouchableOpacity style={[styles.addBtn, styles.qrClose]} onPress={() => setQrValue(null)}>
              <Text style={styles.addTxt}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={scanning} transparent animationType="slide" onRequestClose={() => setScanning(false)}>
        <View style={styles.qrModal}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>扫描对方课表二维码</Text>
            {scanning ? (
              <CameraView
                style={{ width: 260, height: 260 }}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={(r) => onScanned(r.data)}
              />
            ) : null}
            <TouchableOpacity style={[styles.addBtn, styles.qrClose]} onPress={() => setScanning(false)}>
              <Text style={styles.addTxt}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  msg: { color: '#2e7d32', marginBottom: 8 },
  qrModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  qrBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center' },
  qrTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  qrClose: { marginTop: 12 },
});