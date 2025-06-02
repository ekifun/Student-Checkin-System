// App.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

// Make sure to include the http:// and use your local IP address accessible from the phone
const API_BASE = 'http://a3428ac49451640ffb9d0f66968d8224-344899087.us-west-1.elb.amazonaws.com';

export default function App() {
  const [form, setForm] = useState({
    studentName: '',
    grade: '',
    fatherName: '',
    motherName: '',
    phone: '',
    wechat: '',
    email: '',
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (!form.studentName || !form.grade || !form.fatherName || !form.motherName) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const payload = {
      student_name: form.studentName,
      grade: form.grade,
      father_name: form.fatherName,
      mother_name: form.motherName,
      phone_number: form.phone,
      wechat_id: form.wechat,
      email: form.email,
    };

    try {
      const res = await axios.post(`${API_BASE}/register`, payload);
      if (res.data.id) {
        Alert.alert('Success', 'Student registered successfully.');
        setForm({
          studentName: '',
          grade: '',
          fatherName: '',
          motherName: '',
          phone: '',
          wechat: '',
          email: '',
        });
      } else {
        Alert.alert('Error', 'Registration failed.');
      }
    } catch (err) {
      console.error('Error during registration:', err.message);
      Alert.alert('Network Error', 'Failed to connect to server.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>Student Registration</Text>
  
          <TextInput style={styles.input} placeholder="Student Name" value={form.studentName} onChangeText={text => handleChange('studentName', text)} />
          
          <View style={styles.pickerWrapper}>
            <Text style={styles.label}>Select Grade</Text>
            <Picker
              selectedValue={form.grade}
              onValueChange={(value) => handleChange('grade', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Grade..." value="" />
              <Picker.Item label="7+" value="7+" />
              <Picker.Item label="<3" value="<3" />
              <Picker.Item label="Prek" value="Prek" />
              <Picker.Item label="K-3" value="K-3" />
              <Picker.Item label="4-6" value="4-6" />
            </Picker>
          </View>
  
          <TextInput style={styles.input} placeholder="Father's Name" value={form.fatherName} onChangeText={text => handleChange('fatherName', text)} />
          <TextInput style={styles.input} placeholder="Mother's Name" value={form.motherName} onChangeText={text => handleChange('motherName', text)} />
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={form.phone} onChangeText={text => handleChange('phone', text)} />
          <TextInput style={styles.input} placeholder="WeChat ID" value={form.wechat} onChangeText={text => handleChange('wechat', text)} />
          <TextInput style={styles.input} placeholder="Email Address" keyboardType="email-address" value={form.email} onChangeText={text => handleChange('email', text)} />
  
          <Button title="Register" onPress={handleSubmit} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    marginBottom: 15,
  },
  picker: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  }
});
