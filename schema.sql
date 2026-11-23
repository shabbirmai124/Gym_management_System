-- Gym Management System — MySQL 8+ Schema & Seed Data
-- Converted from Oracle APEX SQL (Gym managememt System Final.sql)

CREATE DATABASE IF NOT EXISTS gym_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_management;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS reminder;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS staffs;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS rates;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS admin;
SET FOREIGN_KEY_CHECKS = 1;

-- Admin Table
CREATE TABLE admin (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100) NOT NULL UNIQUE,
  user_role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Rates (Membership Plans) Table
CREATE TABLE rates (
  rate_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  charge DECIMAL(10, 2) NOT NULL CHECK (charge >= 0),
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Members Table
CREATE TABLE members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rate_id INT NULL,
  contact_number VARCHAR(20),
  registration_date DATE DEFAULT (CURRENT_DATE),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_members_rate FOREIGN KEY (rate_id) REFERENCES rates(rate_id) ON DELETE SET NULL
);

-- Announcements Table
CREATE TABLE announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  announcement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Attendance Table
CREATE TABLE attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('Present', 'Absent') NOT NULL,
  check_in_time DATETIME NULL DEFAULT NULL,
  check_out_time DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT unique_attendance UNIQUE (member_id, attendance_date)
);

-- Equipment Table
CREATE TABLE equipment (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  quantity INT NOT NULL CHECK (quantity >= 0),
  description VARCHAR(255),
  image_url VARCHAR(200),
  member_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipment_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE SET NULL
);

-- Staffs Table
CREATE TABLE staffs (
  staff_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  admin_id INT NULL,
  role VARCHAR(20) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_staffs_admin FOREIGN KEY (admin_id) REFERENCES admin(user_id) ON DELETE CASCADE
);

-- Reminder Table
CREATE TABLE reminder (
  reminder_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  message VARCHAR(255),
  status ENUM('Pending', 'Sent', 'Completed') DEFAULT 'Pending',
  reminder_date DATE NOT NULL,
  reminder_time TIME NULL,
  member_id INT NULL,
  staff_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reminder_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE SET NULL,
  CONSTRAINT fk_reminder_staff FOREIGN KEY (staff_id) REFERENCES staffs(staff_id) ON DELETE SET NULL
);

-- Transactions Table
CREATE TABLE transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  staff_id INT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_staff FOREIGN KEY (staff_id) REFERENCES staffs(staff_id) ON DELETE SET NULL
);

-- Workout Classes Table
CREATE TABLE classes (
  class_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  staff_id INT NULL,
  schedule_day VARCHAR(30) NOT NULL,
  schedule_time VARCHAR(30) NOT NULL,
  room VARCHAR(60) DEFAULT 'Main Studio',
  capacity INT NOT NULL DEFAULT 15 CHECK (capacity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_classes_staff FOREIGN KEY (staff_id) REFERENCES staffs(staff_id) ON DELETE SET NULL
);

-- Class Bookings Table
CREATE TABLE class_bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  member_id INT NOT NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT unique_class_booking UNIQUE (class_id, member_id)
);

-- Fitness & BMI Progress Assessments Table
CREATE TABLE fitness_assessments (
  assessment_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  weight_kg DECIMAL(5, 2) NOT NULL CHECK (weight_kg > 0),
  height_cm DECIMAL(5, 2) NOT NULL CHECK (height_cm > 0),
  bmi DECIMAL(4, 1) NOT NULL,
  body_fat_pct DECIMAL(4, 1) NULL,
  notes VARCHAR(255),
  recorded_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

-- ============================================================================
-- Seed Data
-- ============================================================================
INSERT INTO admin (username, password, name, email, user_role) VALUES
  ('admin1', 'password1', 'Admin One', 'admin1@example.com', 'admin'),
  ('admin2', 'password2', 'Admin Two', 'admin2@example.com', 'admin'),
  ('admin3', 'password3', 'Admin Three', 'admin3@example.com', 'admin');

INSERT INTO rates (name, charge, description) VALUES
  ('Fitness Plan', 50.00, 'Includes access to all gym equipment and classes'),
  ('Yoga Plan', 40.00, 'Focuses on yoga classes and relaxation techniques'),
  ('Swimming Plan', 60.00, 'Provides access to the swimming pool and swim classes');

INSERT INTO members (fullname, username, password, rate_id, contact_number) VALUES
  ('John Doe', 'johndoe', 'johndoe123', 1, '123-456-7890'),
  ('Jane Smith', 'janesmith', 'janesmith123', 2, '987-654-3210'),
  ('Alice Brown', 'alicebrown', 'alice123', 1, '555-1234'),
  ('Bob Green', 'bobgreen', 'bob123', 2, '555-5678'),
  ('Charlie White', 'charliewhite', 'charlie123', 3, '555-9876');

INSERT INTO announcements (message, announcement_date) VALUES
  ('Welcome to the system!', '2024-12-25'),
  ('System maintenance scheduled.', '2024-12-26'),
  ('New features released.', '2024-12-27');

INSERT INTO equipment (name, amount, quantity, description) VALUES
  ('Treadmill', 1200.00, 10, 'High-quality treadmill for cardio workouts'),
  ('Dumbbell Set', 300.00, 20, 'Variety of dumbbells for strength training'),
  ('Exercise Bike', 800.00, 5, 'Comfortable exercise bike for low-impact cardio');

INSERT INTO staffs (username, password, email, admin_id, role) VALUES
  ('staff1', 'staffpass1', 'staff1@example.com', 1, 'trainer'),
  ('staff2', 'staffpass2', 'staff2@example.com', 2, 'manager'),
  ('staff3', 'staffpass3', 'staff3@example.com', 3, 'assistant');

INSERT INTO reminder (name, message, status, reminder_date, reminder_time, member_id) VALUES
  ('Payment Reminder', 'Your payment is due.', 'Pending', '2024-12-28', '10:00:00', 1),
  ('Class Reminder', 'Yoga class at 6 PM.', 'Sent', '2024-12-25', '18:00:00', 1);

INSERT INTO transactions (member_id, staff_id, amount, description) VALUES
  (1, 1, 50.00, 'Monthly fitness plan payment'),
  (2, 2, 40.00, 'Yoga plan payment'),
  (1, NULL, 20.00, 'One-time gym equipment usage fee');

INSERT INTO attendance (member_id, attendance_date, status, check_in_time) VALUES
  (1, '2024-12-25', 'Present', '2024-12-25 09:00:00'),
  (2, '2024-12-25', 'Absent', NULL);

INSERT INTO classes (title, category, staff_id, schedule_day, schedule_time, room, capacity) VALUES
  ('Morning HIIT Circuit', 'Cardio', 1, 'Mon / Wed / Fri', '07:00 AM', 'Studio A', 16),
  ('Power Yoga Flow', 'Yoga', 1, 'Tue / Thu', '06:00 PM', 'Zen Studio', 12),
  ('Strength & Conditioning', 'Strength', 2, 'Mon / Thu', '05:30 PM', 'Weight Floor', 14),
  ('Lap Swim Conditioning', 'Swimming', 3, 'Sat / Sun', '09:00 AM', 'Olympic Pool', 10);

INSERT INTO class_bookings (class_id, member_id) VALUES
  (1, 1),
  (2, 2),
  (4, 5);

INSERT INTO fitness_assessments (member_id, weight_kg, height_cm, bmi, body_fat_pct, notes, recorded_date) VALUES
  (1, 78.5, 178.0, 24.8, 16.5, 'Baseline strength assessment complete', '2024-12-20'),
  (2, 62.0, 166.0, 22.5, 21.0, 'Flexibility and core endurance improving', '2024-12-22');
