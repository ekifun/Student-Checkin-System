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

const ExcelJS = require('exceljs');

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

// Safe migrations
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

// Updated function: match by name AND grade
function findStudentByName(name, grade, callback) {
  db.get('SELECT * FROM students WHERE name = ? AND grade = ?', [name, grade], callback);
}

// --- Registration ---
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

// --- Check-In ---
app.post('/checkin', (req, res) => {
  const { student_name, parent_name, grade, time } = req.body;
  const dateOnly = time.split('T')[0]; // Extract date

  findStudentByName(student_name, grade, (err, student) => {
    if (err || !student) return res.status(404).send({ error: 'Student not found' });

    db.serialize(() => {
      // 1. Remove existing checkout on the same date
      db.run(
        `DELETE FROM checkouts 
         WHERE student_id = ? AND DATE(time) = DATE(?)`,
        [student.id, dateOnly],
        function (err) {
          if (err) {
            console.error('Error deleting old checkout:', err);
            return res.status(500).send({ error: 'Failed to reset checkout' });
          }

          // 2. Insert new check-in
          db.run(
            `INSERT INTO checkins (student_id, time, checked_in_by) VALUES (?, ?, ?)`,
            [student.id, time, parent_name],
            function (err) {
              if (err) {
                console.error('Error inserting checkin:', err);
                return res.status(500).send({ error: err.message });
              }
              res.send({ success: true, id: this.lastID });
            }
          );
        }
      );
    });
  });
});


// --- Check-Out ---
app.post('/checkout', (req, res) => {
  const { student_name, parent_name, grade, time } = req.body;

  findStudentByName(student_name, grade, (err, student) => {
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

// --- Teacher Dashboard ---
app.get('/teacher/checkin-status', (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).send({ error: 'Missing date query parameter' });

  // First, find latest check-in per student on the selected date
  const checkinQuery = `
    SELECT c1.student_id, c1.time, c1.checked_in_by
    FROM checkins c1
    JOIN (
      SELECT student_id, MAX(time) as max_time
      FROM checkins
      WHERE DATE(time) = DATE(?)
      GROUP BY student_id
    ) c2 ON c1.student_id = c2.student_id AND c1.time = c2.max_time
  `;

  db.all(checkinQuery, [date], (err, checkins) => {
    if (err) return res.status(500).send({ error: err.message });

    const checkinMap = Object.fromEntries(checkins.map(c => [c.student_id, c]));

    // For each check-in, find the first checkout *after* that check-in
    const studentIds = Object.keys(checkinMap);
    if (studentIds.length === 0) {
      // No check-ins — return all students with "Not Checked In"
      db.all('SELECT * FROM students', [], (err, students) => {
        if (err) return res.status(500).send({ error: err.message });
        const result = students.map(s => ({
          id: s.id,
          student_name: s.name,
          grade: s.grade,
          father_name: s.father_name,
          mother_name: s.mother_name,
          phone_number: s.phone_number,
          wechat_id: s.wechat_id,
          email: s.email,
          status: 'Not Checked In',
          checkin_time: null,
          checked_in_by: null,
          checkout_time: null,
          checked_out_by: null
        }));
        return res.send(result);
      });
      return;
    }

    const placeholders = studentIds.map(() => '?').join(',');

    const checkoutQuery = `
      SELECT c1.student_id, c1.time, c1.checked_out_by
      FROM checkouts c1
      JOIN (
        SELECT student_id, MIN(time) as min_time
        FROM checkouts
        WHERE student_id IN (${placeholders})
        AND time > ?
        GROUP BY student_id
      ) c2 ON c1.student_id = c2.student_id AND c1.time = c2.min_time
    `;

    // Use the latest check-in time among all students as the lower bound
    const minCheckinTime = Math.min(...checkins.map(c => new Date(c.time).getTime()));
    const timeCutoff = new Date(minCheckinTime).toISOString();

    db.all(checkoutQuery, [...studentIds, timeCutoff], (err, checkouts) => {
      if (err) return res.status(500).send({ error: err.message });

      const checkoutMap = Object.fromEntries(checkouts.map(c => [c.student_id, c]));

      db.all('SELECT * FROM students', [], (err, students) => {
        if (err) return res.status(500).send({ error: err.message });

        const result = students.map(s => {
          const ci = checkinMap[s.id];
          const co = checkoutMap[s.id];
          const status = ci
            ? (co && new Date(co.time) > new Date(ci.time) ? 'Checked Out' : 'Checked In')
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


app.get('/export/students', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registered Students');

    // Define headers
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

      // Add rows
      rows.forEach(student => worksheet.addRow(student));

      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    });
  } catch (error) {
    res.status(500).send({ error: 'Failed to export Excel file' });
  }
});

app.get('/students', (req, res) => {
  db.all('SELECT * FROM students', [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

app.put('/students/:id', (req, res) => {
  const id = req.params.id;
  const {
    name, grade, father_name, mother_name,
    phone_number, wechat_id, email
  } = req.body;

  db.run(
    `UPDATE students SET 
      name = ?, grade = ?, father_name = ?, mother_name = ?, 
      phone_number = ?, wechat_id = ?, email = ? 
     WHERE id = ?`,
    [name, grade, father_name, mother_name, phone_number, wechat_id, email, id],
    function (err) {
      if (err) return res.status(500).send({ error: err.message });
      res.send({ success: true, changes: this.changes });
    }
  );
});

// --- Delete Student by ID ---
app.delete('/students/:id', (req, res) => {
  const studentId = req.params.id;

  db.run(`DELETE FROM students WHERE id = ?`, [studentId], function (err) {
    if (err) {
      console.error('Error deleting student:', err);
      return res.status(500).send({ error: err.message });
    }

    // Also remove checkin/checkout records to prevent orphan entries
    db.run(`DELETE FROM checkins WHERE student_id = ?`, [studentId]);
    db.run(`DELETE FROM checkouts WHERE student_id = ?`, [studentId]);

    res.send({ success: true, deleted: this.changes });
  });
});

// --- Root Check ---
app.get('/', (req, res) => {
  res.send('✅ Check-in System Backend is Running.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
