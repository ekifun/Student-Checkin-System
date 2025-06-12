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

//const API_BASE = 'http://a3428ac49451640ffb9d0f66968d8224-344899087.us-west-1.elb.amazonaws.com';
const API_BASE = 'http://13.52.104.212:3001';

const GRADE_OPTIONS = ['7+', 'Nursery', 'PreK', 'K-3', '4-6'];

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
      const studentsRaw = res.data.filter(s => s.grade === grade);

      // Remove duplicate students with same ID
      const uniqueStudents = Object.values(
        studentsRaw.reduce((acc, cur) => {
          acc[cur.id] = cur;
          return acc;
        }, {})
      );

      setStudents(uniqueStudents);
      console.log('Fetched students:', res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch student list.');
    }
  };

  const handleAction = (student, type) => {
    setActiveStudentId(student.id);
    setActionType(type);
    setSelectedParent('');
  };

  const submitAction = async (student, parentName) => {
    try {
      console.log(`POST ${API_BASE}/${actionType}`, {
        student_name: student.student_name,
        parent_name: parentName,
        grade: student.grade,
        time: new Date().toISOString(),
      });
      
      await axios.post(`${API_BASE}/${actionType}`, {
        student_id: student.id,
        parent_name: parentName,
        time: new Date().toISOString(),
      });
      
  
      if (actionType === 'checkin') {
        // If re-checkin, optimistically reset checkout fields in frontend before refresh
        student.checkout_time = null;
        student.checked_out_by = null;
      }
  
      Alert.alert('Success', `${actionType} recorded for ${student.student_name}.`);
      setActiveStudentId(null);
      await fetchStudents(); // Ensures UI reflects backend truth
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
            <Picker
              selectedValue={grade}
              onValueChange={(value) => setGrade(value)}
            >
              <Picker.Item label="Select Grade..." value="" />
              {GRADE_OPTIONS.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
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

      {/* Student List */}
      <ScrollView contentContainerStyle={styles.container}>
        {grade && <Text style={styles.header}>Grade {grade} - {today}</Text>}
        <Button title="🔄 Refresh Status" onPress={fetchStudents} />

        {students.map((student) => (
          <View key={student.id} style={styles.card}>
            <Text style={styles.name}>{student.student_name}</Text>
            <Text>Status: {student.status}</Text>
            {student.checkin_time && (
              <Text>
                Check-In: {new Date(student.checkin_time).toLocaleTimeString()} by {student.checked_in_by}
              </Text>
            )}
            {student.checkout_time && (
              <Text>
                Check-Out: {new Date(student.checkout_time).toLocaleTimeString()} by {student.checked_out_by}
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
