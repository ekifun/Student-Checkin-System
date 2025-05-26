// App.js - React Native Expo Check-In/Out App (Teacher View by Grade)
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const API_BASE = 'http://192.168.1.73:3001';

export default function App() {
  const [view, setView] = useState('home');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [teacherData, setTeacherData] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedGrade, setSelectedGrade] = useState('');

  const handleSubmit = async (endpoint) => {
    if (!studentName || (endpoint !== 'register' && !selectedParent)) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }

    try {
      // Check for duplicate registration
      if (endpoint === 'register') {
        const exists = teacherData.some(s => s.student_name.toLowerCase() === studentName.toLowerCase());
        if (exists) {
          Alert.alert('Registration Error', 'Student is already registered.');
          return;
        }
      }

      // Prevent checkout before check-in
      if (endpoint === 'checkout') {
        const studentToday = teacherData.find(s => s.student_name.toLowerCase() === studentName.toLowerCase());
        if (!studentToday || studentToday.status !== 'Checked In') {
          Alert.alert('Checkout Error', 'Student must be checked in before checking out.');
          return;
        }
      }
      const payload = {
        student_name: studentName,
        grade,
        father_name: fatherName,
        mother_name: motherName,
        parent_name: selectedParent,
        time: new Date().toISOString(),
      };
      await axios.post(`${API_BASE}/${endpoint}`, payload);
      Alert.alert(`${endpoint} successful`);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', err.message);
    }
  };

  const fetchTeacherData = async () => {
    const formattedDate = date.toISOString().substring(0, 10);
    const res = await axios.get(`${API_BASE}/teacher/checkin-status?date=${formattedDate}`);
    setTeacherData(res.data);
  };

  useEffect(() => {
    if (view === 'teacher') fetchTeacherData();
  }, [view, date]);

  const uniqueGrades = Array.from(new Set(teacherData.map((s) => s.grade))).sort();
  const filteredStudents = teacherData.filter((s) => s.grade === selectedGrade);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Student Check-In/Out System</Text>

      <View style={styles.navBar}>
        {['register', 'checkin', 'checkout', 'teacher'].map(v => (
          <Button key={v} title={v.toUpperCase()} onPress={() => setView(v)} />
        ))}
      </View>

      {view === 'register' && (
        <View style={styles.card}>
          <Text style={styles.label}>Student Name</Text>
          <TextInput style={styles.input} value={studentName} onChangeText={setStudentName} />
          <Text style={styles.label}>Grade</Text>
          <TextInput style={styles.input} value={grade} onChangeText={setGrade} />
          <Text style={styles.label}>Father's Name</Text>
          <TextInput style={styles.input} value={fatherName} onChangeText={setFatherName} />
          <Text style={styles.label}>Mother's Name</Text>
          <TextInput style={styles.input} value={motherName} onChangeText={setMotherName} />
          <Button title="Register" onPress={() => handleSubmit('register')} />
        </View>
      )}

      {(view === 'checkin' || view === 'checkout') && (
        <View style={styles.card}>
          <Text style={styles.label}>Student Name</Text>
          <TextInput style={styles.input} value={studentName} onChangeText={setStudentName} />
          <Text style={styles.label}>Parent Name</Text>
<TextInput
  style={styles.input}
  value={selectedParent}
  onChangeText={setSelectedParent}
  placeholder="Enter parent name"
/>
          <Button title="Submit" onPress={() => handleSubmit(view)} />
        </View>
      )}

      {view === 'teacher' && (
        <>
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => setDate(selectedDate || date)}
          />
          <Text style={styles.label}>Select Grade</Text>
          <View style={styles.input}>
            <Picker selectedValue={selectedGrade} onValueChange={setSelectedGrade}>
              <Picker.Item label="-- Select Grade --" value="" />
              {uniqueGrades.map((g, i) => (
                <Picker.Item label={g} value={g} key={i} />
              ))}
            </Picker>
          </View>
          {selectedGrade !== '' && (
            <View style={styles.table}>
              {filteredStudents.map((entry, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.cell}><Text style={styles.bold}>Name:</Text> {entry.student_name}</Text>
                  <Text style={styles.cell}><Text style={styles.bold}>Grade:</Text> {entry.grade}</Text>
                  <Text style={styles.cell}><Text style={styles.bold}>Status:</Text> {entry.status}</Text>
                  <Text style={styles.cell}><Text style={styles.bold}>Check-In Time:</Text> {entry.checkin_time ? new Date(entry.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
                  <Text style={styles.cell}><Text style={styles.bold}>Checked In By:</Text> {entry.checked_in_by || '-'}</Text>
                  <Text style={styles.cell}><Text style={styles.bold}>Check-Out Time:</Text> {entry.checkout_time ? new Date(entry.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</Text>
                  <Text style={styles.cell}><Text style={styles.bold}>Checked Out By:</Text> {entry.checked_out_by || '-'}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 40, padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  table: { marginTop: 20 },
  row: { flexDirection: 'column', marginBottom: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  cell: { fontSize: 12 },
  bold: { fontWeight: 'bold' }
});
