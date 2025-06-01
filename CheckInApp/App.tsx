import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const API_BASE = 'http://a3428ac49451640ffb9d0f66968d8224-344899087.us-west-1.elb.amazonaws.com';

export default function App() {
  const [students, setStudents] = useState([]);
  const [grade, setGrade] = useState('');
  const [showGradePicker, setShowGradePicker] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [selectedParent, setSelectedParent] = useState('');
  const [actionType, setActionType] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (grade) fetchStudents();
  }, [grade]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teacher/checkin-status?date=${today}`);
      setStudents(res.data.filter(s => s.grade === grade));
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch student list.');
    }
  };

  const handleAction = (studentId, type) => {
    setActiveStudentId(studentId);
    setActionType(type);
    setSelectedParent('');
  };

  const submitAction = async (student, parentName) => {
    try {
      await axios.post(`${API_BASE}/${actionType}`, {
        student_name: student.student_name,
        parent_name: parentName,
        time: new Date().toISOString(),
      });
      Alert.alert('Success', `${actionType} recorded for ${student.student_name}.`);
      setActiveStudentId(null);
      fetchStudents(); // Refresh list
    } catch (err) {
      Alert.alert('Error', 'Failed to submit action.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Grade Selection Modal */}
      <Modal visible={showGradePicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Grade</Text>
            <Picker
              selectedValue={grade}
              onValueChange={(value) => setGrade(value)}
            >
              <Picker.Item label="Select Grade..." value="" />
              <Picker.Item label="Grade 1" value="1" />
              <Picker.Item label="Grade 2" value="2" />
              <Picker.Item label="Grade 3" value="3" />
              <Picker.Item label="Grade 4" value="4" />
              <Picker.Item label="Grade 5" value="5" />
              <Picker.Item label="Grade 6" value="6" />
            </Picker>
            <Button
              title="Confirm"
              onPress={() => {
                if (grade) setShowGradePicker(false);
                else Alert.alert('Error', 'Please select a grade.');
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Student Check-In/Check-Out List */}
      <ScrollView contentContainerStyle={styles.container}>
        {grade && <Text style={styles.header}>Grade {grade} - {today}</Text>}
        {students.map(student => (
          <View key={student.id} style={styles.card}>
            <Text style={styles.name}>{student.student_name}</Text>
            <Text>Status: {student.status}</Text>
            {student.checkin_time && (
              <Text>Check-In: {new Date(student.checkin_time).toLocaleTimeString()} by {student.checked_in_by}</Text>
            )}
            {student.checkout_time && (
              <Text>Check-Out: {new Date(student.checkout_time).toLocaleTimeString()} by {student.checked_out_by}</Text>
            )}

            <View style={styles.btnGroup}>
              <Button title="Check-In" onPress={() => handleAction(student.student_name, 'checkin')} />
              <Button title="Check-Out" onPress={() => handleAction(student.student_name, 'checkout')} />
            </View>

            {activeStudentId === student.student_name && (
              <View style={styles.pickerContainer}>
                <Text>Select Parent:</Text>
                <Picker
                  selectedValue={selectedParent}
                  onValueChange={(value) => setSelectedParent(value)}
                >
                  <Picker.Item label="Select..." value="" />
                  <Picker.Item label={`Father: ${student.father_name}`} value={student.father_name} />
                  <Picker.Item label={`Mother: ${student.mother_name}`} value={student.mother_name} />
                </Picker>
                <Button
                  title="Submit"
                  onPress={() => {
                    if (selectedParent) {
                      submitAction(student, selectedParent);
                    } else {
                      Alert.alert('Error', 'Please select a parent.');
                    }
                  }}
                />
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
});
