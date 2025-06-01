import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Button,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const API_BASE = 'http://192.168.1.73:3001'; // Replace with your server IP

export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = date.toISOString().split('T')[0];

  useEffect(() => {
    fetchStatus(formattedDate);
  }, [formattedDate]);

  const fetchStatus = async (targetDate) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/teacher/checkin-status?date=${targetDate}`);
      const grouped = res.data.reduce((acc, student) => {
        if (!acc[student.grade]) acc[student.grade] = [];
        acc[student.grade].push(student);
        return acc;
      }, {});
      setData(grouped);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Head Teacher Dashboard</Text>

      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>Date: {formattedDate}</Text>
        <Button title="Select Date" onPress={() => setShowPicker(true)} />
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
          />
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        Object.keys(data).sort().map((grade) => (
          <View key={grade} style={styles.gradeSection}>
            <Text style={styles.gradeHeader}>Grade {grade}</Text>
            {data[grade].map((student) => (
              <View key={`${student.id}-${student.student_name}`} style={styles.card}>
                <Text style={styles.name}>{student.student_name}</Text>
                <Text>Status: {student.status}</Text>
                {student.checkin_time && (
                  <Text>Checked In: {new Date(student.checkin_time).toLocaleTimeString()} by {student.checked_in_by}</Text>
                )}
                {student.checkout_time && (
                  <Text>Checked Out: {new Date(student.checkout_time).toLocaleTimeString()} by {student.checked_out_by}</Text>
                )}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateSelector: {
    marginBottom: 20,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    marginBottom: 5,
  },
  gradeSection: {
    marginBottom: 25,
  },
  gradeHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#999',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
});
