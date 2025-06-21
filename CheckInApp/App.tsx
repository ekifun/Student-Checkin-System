import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

// Backend API address (adjust to your server IP)
const API_BASE = 'http://54.241.242.159:3001';

const GRADE_OPTIONS = ['7+', 'Nursery', 'PreK', 'K-3', '4-6'];

export default function App() {
  const [students, setStudents] = useState([]);
  const [grade, setGrade] = useState('');
  const [showGradePicker, setShowGradePicker] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [selectedParent, setSelectedParent] = useState('');
  const [actionType, setActionType] = useState(null);
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [showAuthorizedModal, setShowAuthorizedModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (grade) fetchStudents();
  }, [grade]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teacher/checkin-status?date=${today}`);
      const studentsRaw = res.data.filter(s => s.grade === grade);
      const uniqueStudents = Object.values(
        studentsRaw.reduce((acc, cur) => {
          acc[cur.id] = cur;
          return acc;
        }, {})
      );
      setStudents(uniqueStudents);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch student list.');
    }
  };

  const handleAction = (student, type) => {
    setActiveStudentId(student.id);
    setActionType(type);
    setSelectedParent('');
    setPickupPersonName('');
  };

  const submitAction = async (student) => {
    try {
      const checkinBy = selectedParent.startsWith('Authorized:')
        ? `父母委托人: ${pickupPersonName}`
        : selectedParent;

      await axios.post(`${API_BASE}/${actionType}`, {
        student_id: student.id,
        parent_name: checkinBy,
        pickup_person_name: selectedParent.startsWith('Authorized:') ? pickupPersonName : null,
        time: new Date().toISOString(),
      });

      Alert.alert('Success', `${actionType} recorded for ${student.student_name}.`);
      setActiveStudentId(null);
      await fetchStudents();
    } catch (err) {
      console.error('Submit error:', err?.response?.data || err.message);
      Alert.alert('Error', 'Failed to submit action.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Grade Picker Modal */}
      <Modal visible={showGradePicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Grade</Text>
            <Picker selectedValue={grade} onValueChange={(value) => setGrade(value)}>
              <Picker.Item label="Select Grade..." value="" />
              {GRADE_OPTIONS.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
            <Button title="Confirm" onPress={() => {
              if (grade) setShowGradePicker(false);
              else Alert.alert('Error', 'Please select a grade.');
            }} />
          </View>
        </View>
      </Modal>

      {/* Authorized Pickup Modal */}
      <Modal visible={showAuthorizedModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ marginBottom: 10, color: 'red', fontWeight: 'bold' }}>
              温馨提醒：如不确定委托人身份，请勿办理学生签出，并及时联系家长确认，确保学生安全。
            </Text>
            <Text style={{ marginBottom: 10 }}>请输入父母委托人姓名</Text>
            <TextInput
              value={pickupPersonName}
              onChangeText={setPickupPersonName}
              placeholder="请输入实际接送人姓名"
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 5, borderRadius: 5 }}
            />
            <Button title="确认" onPress={() => setShowAuthorizedModal(false)} />
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        {grade && <Text style={styles.header}>Grade {grade} - {today}</Text>}
        <Button title="🔄 刷新" onPress={fetchStudents} />

        {students.map((student) => (
          <View key={student.id} style={styles.card}>
            <Text style={styles.name}>{student.student_name}</Text>
            <Text>Status: {student.status}</Text>
            {student.checkin_time && (
              <Text>Check-In: {new Date(student.checkin_time).toLocaleTimeString()} by {student.checked_in_by}</Text>
            )}
            {student.checkout_time && (
              <Text>
                Check-Out: {new Date(student.checkout_time).toLocaleTimeString()} by 
                {student.pickup_person_name 
                  ? ` 父母委托人: ${student.pickup_person_name}` 
                  : ` ${student.checked_out_by}`}
              </Text>
            )}

            <View style={styles.btnGroup}>
              <Button
                title="Check-In"
                onPress={() => handleAction(student, 'checkin')}
                disabled={student.status !== 'Not Checked In' && student.status !== 'Checked Out'}
                color={student.status === 'Not Checked In' || student.status === 'Checked Out' ? 'green' : 'gray'}
              />
              <Button
                title="Check-Out"
                onPress={() => handleAction(student, 'checkout')}
                disabled={student.status !== 'Checked In'}
                color={student.status === 'Checked In' ? 'orange' : 'gray'}
              />
            </View>

            {activeStudentId === student.id && (
              <View style={styles.pickerContainer}>
                <Text>选择接送人:</Text>
                <Picker
                  selectedValue={selectedParent}
                  onValueChange={(value) => {
                    setSelectedParent(value);
                    if (value.startsWith('Authorized:')) {
                      setShowAuthorizedModal(true);
                    }
                  }}
                >
                  <Picker.Item label="请选择..." value="" />
                  <Picker.Item label={`家长1: ${student.father_name}`} value={student.father_name} />
                  <Picker.Item label={`家长2: ${student.mother_name}`} value={student.mother_name} />
                  <Picker.Item label={`父母委托人: ${student.authorized_pickup_person}`} value={`Authorized:${student.authorized_pickup_person}`} />
                </Picker>
                <Button title="提交" onPress={() => {
                  if (selectedParent) {
                    submitAction(student);
                  } else {
                    Alert.alert('Error', '请选择家长');
                  }
                }} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  btnGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  pickerContainer: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
});
