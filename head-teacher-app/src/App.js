import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3001/teacher/checkin-status?date=${date}`)
      .then((res) => res.json())
      .then((data) => setCheckins(data))
      .catch((err) => console.error('Error fetching data:', err));
  }, [date]);

  const groupedByGrade = checkins.reduce((acc, student) => {
    if (!acc[student.grade]) acc[student.grade] = [];
    acc[student.grade].push(student);
    return acc;
  }, {});

  return (
    <div className="App" style={{ padding: '2rem' }}>
      <h1>📋 Head Teacher Check-in Dashboard</h1>
      <label>
        Select Date:{' '}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {Object.entries(groupedByGrade).map(([grade, students]) => (
        <div key={grade} style={{ marginTop: '2rem' }}>
          <h2>Grade {grade}</h2>
          <table border="1" cellPadding="6" cellSpacing="0" width="100%">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Status</th>
                <th>Check-in Time</th>
                <th>Checked-in By</th>
                <th>Check-out Time</th>
                <th>Checked-out By</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.student_name}</td>
                  <td>{s.status}</td>
                  <td>{s.checkin_time || '-'}</td>
                  <td>{s.checked_in_by || '-'}</td>
                  <td>{s.checkout_time || '-'}</td>
                  <td>{s.checked_out_by || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default App;
