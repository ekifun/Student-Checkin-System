// server.js using SQLite (zero-cost deployment)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// SQLite DB file location
const dbFile = path.resolve(__dirname, 'data', 'student_checkin_system_imported.db');
const db = new sqlite3.Database(dbFile);

// Initialize tables
const initSQL = `
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  father_name TEXT,
  mother_name TEXT,
  phone_number TEXT,
  wechat_id TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  time TEXT,
  checked_in_by TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS checkouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  time TEXT,
  checked_out_by TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id)
);
`;
db.exec(initSQL);

// Registration with duplicate handling
app.post('/register', (req, res) => {
  const {
    student_name, grade, father_name, mother_name,
    phone_number, wechat_id, email
  } = req.body;

  db.all(
    'SELECT * FROM students WHERE grade = ? AND name LIKE ?',
    [grade, `${student_name}%`],
    (err, rows) => {
      if (err) return res.status(500).send({ error: err.message });

      const exactMatch = rows.find(
        s => s.name === student_name &&
             s.father_name === father_name &&
             s.mother_name === mother_name
      );
      if (exactMatch) {
        return res.status(400).send({ error: `${student_name} was already registered.` });
      }

      let finalName = student_name;
      if (rows.length > 0) {
        finalName = `${student_name} (${father_name})`;
      }

      db.run(
        `INSERT INTO students 
         (name, grade, father_name, mother_name, phone_number, wechat_id, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [finalName, grade, father_name, mother_name, phone_number, wechat_id, email],
        function(err) {
          if (err) return res.status(500).send({ error: err.message });
          res.send({ success: true, id: this.lastID });
        }
      );
    }
  );
});

// Check-in
app.post('/checkin', (req, res) => {
  const { student_id, parent_name, time, pickup_person_name } = req.body;
  const dateOnly = time.split('T')[0];

  db.get('SELECT * FROM students WHERE id = ?', [student_id], (err, student) => {
    if (err || !student) return res.status(404).send({ error: 'Student not found' });

    db.serialize(() => {
      db.run('DELETE FROM checkouts WHERE student_id = ? AND DATE(time) = DATE(?)',
        [student_id, dateOnly], err => {
        if (err) return res.status(500).send({ error: 'Failed to reset checkout' });

        db.run(
          `INSERT INTO checkins (student_id, time, checked_in_by) VALUES (?, ?, ?)`,
          [student_id, time, pickup_person_name ? `父母委托人: ${pickup_person_name}` : parent_name],
          function(err) {
            if (err) return res.status(500).send({ error: err.message });
            res.send({ success: true, id: this.lastID });
          }
        );
      });
    });
  });
});

// Checkout
app.post('/checkout', (req, res) => {
  const { student_id, parent_name, time, pickup_person_name } = req.body;

  db.get('SELECT * FROM students WHERE id = ?', [student_id], (err, student) => {
    if (err || !student) return res.status(404).send({ error: 'Student not found' });

    db.run(
      `INSERT INTO checkouts (student_id, time, checked_out_by, pickup_person_name) VALUES (?, ?, ?, ?)`,
      [student_id, time, parent_name, pickup_person_name],
      function(err) {
        if (err) return res.status(500).send({ error: err.message });
        res.send({ success: true, id: this.lastID });
      }
    );
  });
});

// Teacher dashboard
app.get('/teacher/checkin-status', (req, res) => {
  const date = req.query.date;
  const dateOnly = date?.split('T')[0] ?? new Date().toISOString().split('T')[0];

  const query = `
    SELECT s.id, s.name AS student_name, s.grade, s.father_name, s.mother_name,
           s.phone_number, s.wechat_id, s.email, s.authorized_pickup_person,
           ci.time AS checkin_time, ci.checked_in_by,
           co.time AS checkout_time, co.checked_out_by, co.pickup_person_name
    FROM students s
    LEFT JOIN (SELECT * FROM checkins WHERE DATE(time) = DATE(?)) ci ON s.id = ci.student_id
    LEFT JOIN (SELECT * FROM checkouts WHERE DATE(time) = DATE(?)) co ON s.id = co.student_id
    ORDER BY s.grade, s.name
  `;

  db.all(query, [dateOnly, dateOnly], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    const withStatus = rows.map(r => ({
      ...r,
      status: r.checkin_time ? (r.checkout_time ? 'Checked Out' : 'Checked In') : 'Not Checked In'
    }));
    res.send(withStatus);
  });
});

// Get all students
app.get('/students', (req, res) => {
  const { grade, student_name } = req.query;
  if (grade && student_name) {
    db.all('SELECT * FROM students WHERE grade = ? AND name = ?', [grade, student_name], (err, rows) => {
      if (err) return res.status(500).send({ error: err.message });
      res.send(rows);
    });
  } else {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) return res.status(500).send({ error: err.message });
      res.send(rows);
    });
  }
});

// Update student
app.put('/students/:id', (req, res) => {
  const id = req.params.id;
  const { name, grade, father_name, mother_name, phone_number, wechat_id, email, authorized_pickup_person } = req.body;

  db.run(`UPDATE students SET name=?, grade=?, father_name=?, mother_name=?, phone_number=?, wechat_id=?, email=?, authorized_pickup_person=? WHERE id=?`,
    [name, grade, father_name, mother_name, phone_number, wechat_id, email, authorized_pickup_person, id],
    function(err) {
      if (err) return res.status(500).send({ error: err.message });
      res.send({ success: true, changes: this.changes });
    });
});

// Delete student
app.delete('/students/:id', (req, res) => {
  const studentId = req.params.id;
  db.run('DELETE FROM checkins WHERE student_id = ?', [studentId]);
  db.run('DELETE FROM checkouts WHERE student_id = ?', [studentId]);
  db.run('DELETE FROM students WHERE id = ?', [studentId], function(err) {
    if (err) return res.status(500).send({ error: err.message });
    res.send({ success: true, deleted: this.changes });
  });
});

// Export students
app.get('/export/students', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registered Students');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Father Name', key: 'father_name', width: 20 },
      { header: 'Mother Name', key: 'mother_name', width: 20 },
      { header: 'Phone', key: 'phone_number', width: 15 },
      { header: 'WeChat ID', key: 'wechat_id', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
    ];

    db.all('SELECT * FROM students', [], async (err, rows) => {
      if (err) return res.status(500).send({ error: err.message });
      rows.forEach(student => worksheet.addRow(student));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    res.status(500).send({ error: 'Failed to export Excel file' });
  }
});

// Root check
app.get('/', (req, res) => {
  res.send('✅ SQLite Check-in System Backend is Running.');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Check-in Server (SQLite mode) started on port ${port}`);
});
