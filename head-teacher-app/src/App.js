import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://a3428ac49451640ffb9d0f66968d8224-344899087.us-west-1.elb.amazonaws.com';

function App() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkins, setCheckins] = useState([]);
  const [students, setStudents] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editedStudent, setEditedStudent] = useState({});

  const fetchStudents = async () => {
    const data = await fetch(`${API_BASE}/students`).then((res) => res.json());
    setStudents(data);
  };

  const fetchCheckins = async () => {
    try {
      const res = await fetch(`${API_BASE}/teacher/checkin-status?date=${date}`);
      const data = await res.json();
      setCheckins(data);
    } catch (err) {
      console.error('Error fetching check-in data:', err);
    }
  };

  useEffect(() => {
    fetchCheckins();
    fetchStudents();
  }, [date]);

  const handleEdit = (student) => {
    setEditId(student.id);
    setEditedStudent({ ...student });
  };

  const handleSave = async () => {
    try {
      await fetch(`${API_BASE}/students/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedStudent),
      });
      setEditId(null);
      setEditedStudent({});
      await fetchStudents();
      await fetchCheckins();
    } catch (err) {
      console.error('Error saving student:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchStudents();
      await fetchCheckins();
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

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

      <div style={{ marginTop: '3rem' }}>
        <h2>📝 Edit Registered Students</h2>
        <table border="1" cellPadding="6" cellSpacing="0" width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>Father</th>
              <th>Mother</th>
              <th>Phone</th>
              <th>WeChat</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.name || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, name: e.target.value })
                      }
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.grade || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, grade: e.target.value })
                      }
                    />
                  ) : (
                    s.grade
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.father_name || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, father_name: e.target.value })
                      }
                    />
                  ) : (
                    s.father_name
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.mother_name || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, mother_name: e.target.value })
                      }
                    />
                  ) : (
                    s.mother_name
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.phone_number || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, phone_number: e.target.value })
                      }
                    />
                  ) : (
                    s.phone_number
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.wechat_id || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, wechat_id: e.target.value })
                      }
                    />
                  ) : (
                    s.wechat_id
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <input
                      value={editedStudent.email || ''}
                      onChange={(e) =>
                        setEditedStudent({ ...editedStudent, email: e.target.value })
                      }
                    />
                  ) : (
                    s.email
                  )}
                </td>
                <td>
                  {editId === s.id ? (
                    <>
                      <button onClick={handleSave}>💾 Save</button>{' '}
                      <button onClick={() => setEditId(null)}>❌ Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(s)}>✏️ Edit</button>{' '}
                      <button onClick={() => handleDelete(s.id)}>🗑️ Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
