import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAppStore } from '../store/appStore';
import { createBackupData, restoreFromBackup } from '../domain/backup';
import { currentWeek } from '../domain/semester';

export default function SettingsScreen() {
  const {
    semester, setSemester, setting, setSetting,
    courses, plans, notes, backups, manualBackup, restoreBackup,
  } = useAppStore();
  const [sName, setSName] = useState(semester?.name ?? '');
  const [sStart, setSStart] = useState(semester?.startDate ?? '');
  const [sWeeks, setSWeeks] = useState(String(semester?.totalWeeks ?? 1));
  const [restoreText, setRestoreText] = useState('');
  const [msg, setMsg] = useState('');

  function saveSemester() {
    if (!sName.trim() || !sStart.trim()) return;
    setSemester({ id: 's' + Date.now(), name: sName, startDate: sStart, totalWeeks: parseInt(sWeeks, 10) || 1 });
    setMsg('✅ 已保存学期：当前第 ' + currentWeek({ id: 's', name: sName, startDate: sStart, totalWeeks: parseInt(sWeeks, 10) || 1 }, new Date().toISOString().slice(0, 10)) + ' 周');
    Alert.alert('已保存学期');
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
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="学期名（如 2026 秋）" value={sName} onChangeText={setSName} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="开学日期 yyyy-mm-dd" value={sStart} onChangeText={setSStart} />
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={styles.input} placeholder="总周数" keyboardType="numeric" value={sWeeks} onChangeText={setSWeeks} />
        <TouchableOpacity style={styles.btn} onPress={saveSemester}><Text style={styles.btnTxt}>保存学期</Text></TouchableOpacity>
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>课表设置</Text>
        <Text style={styles.lbl}>一天节数：{setting.periodsPerDay}</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: Math.max(1, setting.periodsPerDay - 1) })}><Text style={styles.nav}>-</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSetting({ ...setting, periodsPerDay: setting.periodsPerDay + 1 })}><Text style={styles.nav}>+</Text></TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.lbl}>两小节=一大节（{setting.bigPeriodSize}）</Text>
          <TouchableOpacity onPress={() => setSetting({ ...setting, bigPeriodSize: setting.bigPeriodSize === 2 ? 1 : 2 })}><Text>{setting.bigPeriodSize === 2 ? '开' : '关'}</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>数据安全</Text>
        <TouchableOpacity style={styles.btn} onPress={doBackup}><Text style={styles.btnTxt}>手动备份（导出备份JSON）</Text></TouchableOpacity>
        <TextInput placeholderTextColor="rgba(150,150,150,0.45)" style={[styles.input, { minHeight: 60 }]} multiline placeholder="粘贴备份 JSON 以恢复" value={restoreText} onChangeText={setRestoreText} />
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#777' }]} onPress={doRestore}><Text style={styles.btnTxt}>从备份恢复</Text></TouchableOpacity>
        <Text style={styles.lbl}>已有备份：{backups.length} 份</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cap}>关于</Text>
        <Text style={styles.lbl}>H课程表 v1.0.0</Text>
        <Text style={styles.lbl}>本地存储，无需账号；可在 GitHub 查看源码并发布分享。</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  head: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  cap: { fontWeight: '700', marginBottom: 6 },
  input: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  lbl: { fontSize: 14, marginBottom: 6 },
  nav: { fontSize: 24, paddingHorizontal: 10, color: '#4a90e2' },
  btn: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 6 },
  btnTxt: { color: '#fff', fontWeight: '600' },
  msg: { color: '#2e7d32', marginTop: 8 },
});