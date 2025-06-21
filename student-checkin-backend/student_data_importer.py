import pandas as pd
import sqlite3
import re

def normalize_grade(raw_grade):
    if pd.isna(raw_grade):
        return None
    raw_grade = str(raw_grade)
    if "7" in raw_grade:
        return "7+"
    elif re.search(r"4[\-~－至]6", raw_grade):
        return "4-6"
    elif re.search(r"1[\-~－至]3", raw_grade):
        return "K-3"
    elif "prek" in raw_grade.lower() or "tk" in raw_grade.lower() or "PreK" in raw_grade:
        return "PreK"
    elif "nursery" in raw_grade.lower() or "<3" in raw_grade:
        return "Nursery"
    else:
        return raw_grade.strip()

def safe_str(val):
    if pd.isna(val):
        return None
    return str(val).strip()

def import_csv_to_sqlite(csv_path, sqlite_path):
    df = pd.read_csv(csv_path)
    output_rows = []

    for idx, row in df.iterrows():
        father_name = safe_str(row['家长1 姓名（中/英，比如， 张三/Sam Zhang）'])
        phone_number = safe_str(row['家长1 手机号码'])
        wechat_id = safe_str(row['家长1 微信ID'])
        email = safe_str(row['家长1 电子邮箱'])
        mother_name = safe_str(row['家长2 姓名（中/英， 比如， 李华/Hua Li）'])
        authorized_pickup = safe_str(row.get('authorized_pickup_person'))  # Optional field

        for i in range(1, 5):
            name_col = f'孩子{i} 姓名 （中/英）'
            grade_col = f'孩子{i} 班级'

            child_name = safe_str(row.get(name_col))
            child_grade = safe_str(row.get(grade_col))

            if child_name and child_grade:
                normalized_grade = normalize_grade(child_grade)
                output_rows.append({
                    'name': child_name,
                    'grade': normalized_grade,
                    'father_name': father_name,
                    'mother_name': mother_name,
                    'phone_number': phone_number,
                    'wechat_id': wechat_id,
                    'email': email,
                    'authorized_pickup_person': authorized_pickup,
                })

    students_df = pd.DataFrame(output_rows)
    
    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()

    # Ensure table exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade TEXT,
        father_name TEXT,
        mother_name TEXT,
        phone_number TEXT,
        wechat_id TEXT,
        email TEXT,
        authorized_pickup_person TEXT
    )
    """)

    # Check if authorized_pickup_person column exists
    cursor.execute("PRAGMA table_info(students)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'authorized_pickup_person' not in columns:
        print("➕ Adding column 'authorized_pickup_person' to students table.")
        cursor.execute("ALTER TABLE students ADD COLUMN authorized_pickup_person TEXT")

    for _, row in students_df.iterrows():
        cursor.execute("""
            INSERT INTO students (
              name, grade, father_name, mother_name, phone_number, wechat_id, email, authorized_pickup_person
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row['name'], row['grade'], row['father_name'], row['mother_name'],
            row['phone_number'], row['wechat_id'], row['email'], row['authorized_pickup_person']
        ))

    # Ensure 'checkouts' table exists with correct schema
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS checkouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        time TEXT NOT NULL,
        checked_out_by TEXT,
        pickup_person_name TEXT
    )
    """)

    # Ensure pickup_person_name column exists in checkouts table
    cursor.execute("PRAGMA table_info(checkouts)")
    checkout_columns = [col[1] for col in cursor.fetchall()]
    if 'pickup_person_name' not in checkout_columns:
        print("➕ Adding column 'pickup_person_name' to checkouts table.")
        cursor.execute("ALTER TABLE checkouts ADD COLUMN pickup_person_name TEXT")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python import_students.py <csv_file_path> <sqlite_file_path>")
    else:
        import_csv_to_sqlite(sys.argv[1], sys.argv[2])
