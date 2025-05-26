// --- App.jsx (React Frontend with Local Time Display) ---
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

function formatTimeLocal(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [view, setView] = useState('home');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [teacherData, setTeacherData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  const handleSubmit = async (endpoint) => {
    const payload = {
      student_name: studentName,
      grade,
      father_name: fatherName,
      mother_name: motherName,
      parent_name: selectedParent,
      time: new Date().toISOString()
    };
    await axios.post(`${API_BASE}/${endpoint}`, payload);
    alert(`${endpoint} successful`);
  };

  const fetchTeacherData = async () => {
    const res = await axios.get(`${API_BASE}/teacher/checkin-status?date=${selectedDate}`);
    setTeacherData(res.data);
  };

  useEffect(() => {
    if (view === 'teacher') {
      fetchTeacherData();
    }
  }, [view, selectedDate]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-center">Student Check-In/Out System</h1>
      <div className="flex justify-around flex-wrap gap-2">
        <button onClick={() => setView('register')} className="bg-blue-200 p-2 rounded">Register</button>
        <button onClick={() => setView('checkin')} className="bg-green-200 p-2 rounded">Check-In</button>
        <button onClick={() => setView('checkout')} className="bg-yellow-200 p-2 rounded">Check-Out</button>
        <button onClick={() => setView('teacher')} className="bg-purple-200 p-2 rounded">Teacher View</button>
      </div>

      {view === 'register' && (
        <div className="space-y-2">
          <input placeholder="Student Name" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full border p-2" />
          <input placeholder="Grade" value={grade} onChange={e => setGrade(e.target.value)} className="w-full border p-2" />
          <input placeholder="Father's Name" value={fatherName} onChange={e => setFatherName(e.target.value)} className="w-full border p-2" />
          <input placeholder="Mother's Name" value={motherName} onChange={e => setMotherName(e.target.value)} className="w-full border p-2" />
          <button onClick={() => handleSubmit('register')} className="w-full bg-indigo-500 text-white p-2 rounded">Register</button>
        </div>
      )}

      {(view === 'checkin' || view === 'checkout') && (
        <div className="space-y-2">
          <input placeholder="Student Name" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full border p-2" />
          <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="w-full border p-2">
            <option value="">Select Parent</option>
            <option value={fatherName}>Father</option>
            <option value={motherName}>Mother</option>
          </select>
          <button onClick={() => handleSubmit(view)} className="w-full bg-indigo-500 text-white p-2 rounded">Submit</button>
        </div>
      )}

      {view === 'teacher' && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Teacher Check-In Status</h2>
          <div>
            <label className="mr-2">Select Date:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border p-1" />
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full border border-collapse mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Grade</th>
                  <th className="border px-2 py-1">Status</th>
                  <th className="border px-2 py-1">Check-In Time</th>
                  <th className="border px-2 py-1">Checked In By</th>
                  <th className="border px-2 py-1">Check-Out Time</th>
                  <th className="border px-2 py-1">Checked Out By</th>
                </tr>
              </thead>
              <tbody>
                {teacherData.map((entry, idx) => (
                  <tr key={idx} className="text-sm text-center">
                    <td className="border px-2 py-1">{entry.student_name}</td>
                    <td className="border px-2 py-1">{entry.grade}</td>
                    <td className="border px-2 py-1">{entry.status}</td>
                    <td className="border px-2 py-1">{entry.checkin_time ? formatTimeLocal(entry.checkin_time) : '-'}</td>
                    <td className="border px-2 py-1">{entry.checked_in_by || '-'}</td>
                    <td className="border px-2 py-1">{entry.checkout_time ? formatTimeLocal(entry.checkout_time) : '-'}</td>
                    <td className="border px-2 py-1">{entry.checked_out_by || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
