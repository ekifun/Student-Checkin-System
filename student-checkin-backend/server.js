// --- server.js (with full support for registration, checkin/checkout, and date-safe teacher view) ---
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3001;
const dbFile = path.resolve(__dirname, 'checkin-system.db');

app.use(cors());
app.use(bodyParser.json());

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

// Safe migration for existing DB
const addColumnIfMissing = (column, type) => {
  db.all("PRAGMA table_info(students);", (err, columns) => {
    if (!columns.some(col => col.name === column)) {
      db.run(`ALTER TABLE students ADD COLUMN ${column} ${type}`);
    }
  });
};

addColumnIfMissing("phone_number", "TEXT");
addColumnIfMissing("wechat_id", "TEXT");
addColumnIfMissing("email", "TEXT");

function findStudent(name, callback) {
  db.get('SELECT * FROM students WHERE name = ?', [name], callback);
}

app.post('/register', (req, res) => {
  const {
    student_name, grade, father_name, mother_name,
    phone_number, wechat_id, email
  } = req.body;

  db.run(
    `INSERT INTO students 
     (name, grade, father_name, mother_name, phone_number, wechat_id, email) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [student_name, grade, father_name, mother_name, phone_number, wechat_id, email],
    function (err) {
      if (err) return res.status(500).send({ error: err.message });
      res.send({ success: true, id: this.lastID });
    }
  );
});

app.get('/students', (req, res) => {
  db.all(`SELECT * FROM students ORDER BY grade ASC, name ASC`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });

    const groupedByGrade = rows.reduce((acc, student) => {
      if (!acc[student.grade]) acc[student.grade] = [];
      acc[student.grade].push(student);
      return acc;
    }, {});

    res.send(groupedByGrade);
  });
});

app.post('/checkin', (req, res) => {
  const { student_name, parent_name, time } = req.body;
  findStudent(student_name, (err, student) => {
    if (err || !student) return res.status(404).send({ error: 'Student not found' });
    db.run(
      `INSERT INTO checkins (student_id, time, checked_in_by) VALUES (?, ?, ?)`,
      [student.id, time, parent_name],
      function (err) {
        if (err) return res.status(500).send({ error: err.message });
        res.send({ success: true, id: this.lastID });
      }
    );
  });
});

app.post('/checkout', (req, res) => {
  const { student_name, parent_name, time } = req.body;
  findStudent(student_name, (err, student) => {
    if (err || !student) return res.status(404).send({ error: 'Student not found' });
    db.run(
      `INSERT INTO checkouts (student_id, time, checked_out_by) VALUES (?, ?, ?)`,
      [student.id, time, parent_name],
      function (err) {
        if (err) return res.status(500).send({ error: err.message });
        res.send({ success: true, id: this.lastID });
      }
    );
  });
});

app.get('/teacher/checkin-status', (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).send({ error: 'Missing date query parameter' });

  const datePrefix = `${date}%`; // e.g., "2025-05-28%"

  const checkinQuery = `
    SELECT student_id, MAX(time) as time, checked_in_by
    FROM checkins
    WHERE time LIKE ?
    GROUP BY student_id
  `;

  const checkoutQuery = `
    SELECT student_id, MAX(time) as time, checked_out_by
    FROM checkouts
    WHERE time LIKE ?
    GROUP BY student_id
  `;

  db.serialize(() => {
    db.all(checkinQuery, [datePrefix], (err, checkins) => {
      if (err) return res.status(500).send({ error: err.message });
      const checkinMap = Object.fromEntries(checkins.map(c => [c.student_id, c]));

      db.all(checkoutQuery, [datePrefix], (err, checkouts) => {
        if (err) return res.status(500).send({ error: err.message });
        const checkoutMap = Object.fromEntries(checkouts.map(c => [c.student_id, c]));

        db.all('SELECT * FROM students', [], (err, students) => {
          if (err) return res.status(500).send({ error: err.message });
          const result = students.map(s => {
            const ci = checkinMap[s.id];
            const co = checkoutMap[s.id];
            const status = ci
              ? (co && co.time > ci.time ? 'Checked Out' : 'Checked In')
              : 'Not Checked In';
            return {
              id: s.id,
              student_name: s.name,
              grade: s.grade,
              father_name: s.father_name,
              mother_name: s.mother_name,
              phone_number: s.phone_number,
              wechat_id: s.wechat_id,
              email: s.email,
              status,
              checkin_time: ci?.time || null,
              checked_in_by: ci?.checked_in_by || null,
              checkout_time: co?.time || null,
              checked_out_by: co?.checked_out_by || null,
            };
          });
          res.send(result);
        });
      });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Check-in System Backend is Running.');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
