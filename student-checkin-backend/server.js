// --- server.js (Persist registration/checkin data with history support) ---
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

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
  mother_name TEXT
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

function findStudent(name, callback) {
  db.get('SELECT * FROM students WHERE name = ?', [name], callback);
}

app.post('/register', (req, res) => {
  const { student_name, grade, father_name, mother_name } = req.body;
  db.run(
    `INSERT INTO students (name, grade, father_name, mother_name) VALUES (?, ?, ?, ?)`,
    [student_name, grade, father_name, mother_name],
    function (err) {
      if (err) return res.status(500).send({ error: err.message });
      res.send({ id: this.lastID });
    }
  );
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
        res.send({ id: this.lastID });
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
        res.send({ id: this.lastID });
      }
    );
  });
});

// Teacher checkin overview for specific date
app.get('/teacher/checkin-status', (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).send({ error: 'Missing date query parameter' });

  const start = new Date(`${date}T00:00:00`).toISOString();
  const end = new Date(`${date}T23:59:59.999`).toISOString();

  const checkinQuery = `
    SELECT student_id, MAX(time) as time, checked_in_by
    FROM checkins
    WHERE time BETWEEN ? AND ?
    GROUP BY student_id
  `;

  const checkoutQuery = `
    SELECT student_id, MAX(time) as time, checked_out_by
    FROM checkouts
    WHERE time BETWEEN ? AND ?
    GROUP BY student_id
  `;

  db.serialize(() => {
    db.all(checkinQuery, [start, end], (err, checkins) => {
      if (err) return res.status(500).send({ error: err.message });
      const checkinMap = Object.fromEntries(checkins.map(c => [c.student_id, c]));

      db.all(checkoutQuery, [start, end], (err, checkouts) => {
        if (err) return res.status(500).send({ error: err.message });
        const checkoutMap = Object.fromEntries(checkouts.map(c => [c.student_id, c]));

        db.all('SELECT * FROM students', [], (err, students) => {
          if (err) return res.status(500).send({ error: err.message });
          const result = students.map(s => {
            const ci = checkinMap[s.id];
            const co = checkoutMap[s.id];
            const status = ci ? (co && co.time > ci.time ? 'Checked Out' : 'Checked In') : 'Not Checked In';
            return {
              student_name: s.name,
              grade: s.grade,
              father_name: s.father_name,
              mother_name: s.mother_name,
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
