import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme, ThemeColors } from '../theme';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

interface Props {
  visible: boolean;
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function CalendarModal({ visible, value, onSelect, onClose }: Props) {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const init = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00') : new Date();
  const [ym, setYm] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const firstWeekday = new Date(ym.y, ym.m, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta: number) {
    const d = new Date(ym.y, ym.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  }
  function shiftYear(delta: number) {
    setYm({ y: ym.y + delta, m: ym.m });
  }
  function pick(d: number) {
    onSelect(ym.y + '-' + pad(ym.m + 1) + '-' + pad(d));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
        <View style={styles.box}>
          <View style={styles.head}>
            <TouchableOpacity onPress={() => shiftYear(-1)}><Text style={styles.nav}>« 去年</Text></TouchableOpacity>
            <Text style={styles.title}>{ym.y + ' 年 ' + (ym.m + 1) + ' 月'}</Text>
            <TouchableOpacity onPress={() => shiftYear(1)}><Text style={styles.nav}>明年 »</Text></TouchableOpacity>
          </View>
          <View style={styles.head}>
            <TouchableOpacity onPress={() => shift(-1)}><Text style={styles.nav}>‹ 上月</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => shift(1)}><Text style={styles.nav}>下月 ›</Text></TouchableOpacity>
          </View>
          <View style={styles.weekRow}>
            {WEEK.map((w) => (<Text key={w} style={styles.weekTxt}>{w}</Text>))}
          </View>
          <View style={styles.grid}>
            {cells.map((d, i) => (
              <TouchableOpacity key={i} style={styles.cell} disabled={!d} onPress={() => d && pick(d)}>
                <Text style={styles.dayTxt}>{d ?? ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeTxt}>取消</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  box: { backgroundColor: c.card, borderRadius: 14, padding: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nav: { fontSize: 26, color: c.primary, paddingHorizontal: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekTxt: { flex: 1, textAlign: 'center', color: c.sub },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  dayTxt: { fontSize: 15 },
  close: { marginTop: 12, backgroundColor: c.line, borderRadius: 8, padding: 10, alignItems: 'center' },
  closeTxt: { color: c.text },
});