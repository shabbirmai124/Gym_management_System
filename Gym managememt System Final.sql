BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE attendance CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE reminder CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE staffs CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE equipment CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE members CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE rates CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE announcements CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE admin CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE transactions CASCADE CONSTRAINTS';
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if the table does not exist
END;
/

-- Create Admin Table
CREATE TABLE admin (
  user_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR2(50) UNIQUE NOT NULL,
  password VARCHAR2(50) NOT NULL,
  name VARCHAR2(100),
  email VARCHAR2(100) UNIQUE NOT NULL, 
  user_role VARCHAR2(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Create Rates Table
CREATE TABLE rates (
  rate_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR2(50) UNIQUE NOT NULL,
  charge NUMBER(10, 2) NOT NULL,
  description VARCHAR2(255), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Create Members Table
CREATE TABLE members (
  member_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fullname VARCHAR2(100) NOT NULL,
  username VARCHAR2(50) UNIQUE NOT NULL,
  password VARCHAR2(50) NOT NULL,
  rate_id NUMBER(10),
  contact_number VARCHAR2(20), 
  registration_date DATE DEFAULT CURRENT_TIMESTAMP, 
  status VARCHAR2(20) DEFAULT 'active', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (rate_id) REFERENCES rates(rate_id) ON DELETE SET NULL
);

-- Create Announcements Table
CREATE TABLE announcements (
  announcement_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message VARCHAR2(255),
  announcement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL
);

-- Create Attendance Table
CREATE TABLE attendance (
  attendance_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id NUMBER(10) NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR2(20) NOT NULL CHECK (status IN ('Present', 'Absent')),
  check_in_time TIMESTAMP DEFAULT NULL, 
  check_out_time TIMESTAMP DEFAULT NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT unique_attendance UNIQUE (member_id, attendance_date)
);

-- Create Equipment Table
CREATE TABLE equipment (
  equipment_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  amount NUMBER(10, 2) NOT NULL,
  quantity NUMBER(10) NOT NULL CHECK (quantity >= 0),
  description VARCHAR2(255), 
  image_url VARCHAR2(200), 
  member_id NUMBER(10), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE SET NULL
);

-- Create Staffs Table
CREATE TABLE staffs (
  staff_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR2(50) UNIQUE NOT NULL,
  password VARCHAR2(50) NOT NULL,
  email VARCHAR2(100) UNIQUE NOT NULL,
  admin_id NUMBER(10), 
  role VARCHAR2(20) DEFAULT 'staff', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (admin_id) REFERENCES admin(user_id) ON DELETE CASCADE
);

-- Create Reminder Table
CREATE TABLE reminder (
  reminder_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  message VARCHAR2(255),
  status VARCHAR2(20) CHECK (status IN ('Pending', 'Sent', 'Completed')), 
  reminder_date DATE NOT NULL,
  reminder_time TIMESTAMP, 
  member_id NUMBER(10),
  staff_id NUMBER(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staffs(staff_id) ON DELETE SET NULL
);

-- Create Transactions Table
CREATE TABLE transactions (
  transaction_id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id NUMBER(10) NOT NULL,
  staff_id NUMBER(10),
  amount NUMBER(10, 2) NOT NULL CHECK (amount > 0),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description VARCHAR2(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staffs(staff_id) ON DELETE SET NULL
);

-- Create Trigger for Updating Timestamp on Attendance Table
CREATE OR REPLACE TRIGGER trg_update_timestamp
BEFORE UPDATE ON attendance 
FOR EACH ROW
BEGIN
  :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Insert into admin table
BEGIN
  INSERT INTO admin (username, password, name, email, user_role)
  VALUES ('admin1', 'password1', 'Admin One', 'admin1@example.com', 'admin');
  
  INSERT INTO admin (username, password, name, email, user_role)
  VALUES ('admin2', 'password2', 'Admin Two', 'admin2@example.com', 'admin');
  
  INSERT INTO admin (username, password, name, email, user_role)
  VALUES ('admin3', 'password3', 'Admin Three', 'admin3@example.com', 'admin');

  -- Insert into rates table
  INSERT INTO rates (name, charge, description)
  VALUES ('Fitness Plan', 50.00, 'Includes access to all gym equipment and classes');
  
  INSERT INTO rates (name, charge, description)
  VALUES ('Yoga Plan', 40.00, 'Focuses on yoga classes and relaxation techniques');
  
  INSERT INTO rates (name, charge, description)
  VALUES ('Swimming Plan', 60.00, 'Provides access to the swimming pool and swim classes');

  -- Insert into members table
  INSERT INTO members (fullname, username, password, rate_id, contact_number)
  VALUES ('John Doe', 'johndoe', 'johndoe123', 1, '123-456-7890');
  
  INSERT INTO members (fullname, username, password, rate_id, contact_number)
  VALUES ('Jane Smith', 'janesmith', 'janesmith123', 2, '987-654-3210');

  INSERT INTO members (fullname, username, password, rate_id, contact_number)
  VALUES ('Alice Brown', 'alicebrown', 'alice123', 1, '555-1234');
  
  INSERT INTO members (fullname, username, password, rate_id, contact_number)
  VALUES ('Bob Green', 'bobgreen', 'bob123', 2, '555-5678');
  
  INSERT INTO members (fullname, username, password, rate_id, contact_number)
  VALUES ('Charlie White', 'charliewhite', 'charlie123', 3, '555-9876');

  -- Insert into announcements table
  INSERT INTO announcements (message, announcement_date)
  VALUES ('Welcome to the system!', DATE '2024-12-25');
  
  INSERT INTO announcements (message, announcement_date)
  VALUES ('System maintenance scheduled.', DATE '2024-12-26');
  
  INSERT INTO announcements (message, announcement_date)
  VALUES ('New features released.', DATE '2024-12-27');

  -- Insert into equipment table
  INSERT INTO equipment (name, amount, quantity, description)
  VALUES ('Treadmill', 1200.00, 10, 'High-quality treadmill for cardio workouts');
  
  INSERT INTO equipment (name, amount, quantity, description)
  VALUES ('Dumbbell Set', 300.00, 20, 'Variety of dumbbells for strength training');
  
  INSERT INTO equipment (name, amount, quantity, description)
  VALUES ('Exercise Bike', 800.00, 5, 'Comfortable exercise bike for low-impact cardio');

  -- Insert into reminder table
  INSERT INTO reminder (name, message, status, reminder_date, reminder_time, member_id)
  VALUES ('Payment Reminder', 'Your payment is due.', 'Pending', DATE '2024-12-28', TO_TIMESTAMP('10:00:00', 'HH24:MI:SS'), 1);
  
  INSERT INTO reminder (name, message, status, reminder_date, reminder_time, member_id)
  VALUES ('Class Reminder', 'Yoga class at 6 PM.', 'Sent', DATE '2024-12-25', TO_TIMESTAMP('18:00:00', 'HH24:MI:SS'), 1);

  -- Insert into staffs table
  INSERT INTO staffs (username, password, email, admin_id, role)
  VALUES ('staff1', 'staffpass1', 'staff1@example.com', 1, 'trainer');
  
  INSERT INTO staffs (username, password, email, admin_id, role)
  VALUES ('staff2', 'staffpass2', 'staff2@example.com', 2, 'manager');

  INSERT INTO staffs (username, password, email, admin_id, role)
  VALUES ('staff3', 'staffpass3', 'staff3@example.com', 3, 'assistant');

  -- Insert into transactions table
  INSERT INTO transactions (member_id, staff_id, amount, description)
  VALUES (1, 1, 50.00, 'Monthly fitness plan payment');
  
  INSERT INTO transactions (member_id, staff_id, amount, description)
  VALUES (2, 2, 40.00, 'Yoga plan payment');
  
  INSERT INTO transactions (member_id, NULL, amount, description)
  VALUES (1, NULL, 20.00, 'One-time gym equipment usage fee');

  -- Insert into attendance table
  INSERT INTO attendance (member_id, attendance_date, status, check_in_time)
  VALUES (1, DATE '2024-12-25', 'Present', TO_TIMESTAMP('09:00:00', 'HH24:MI:SS'));
  
  INSERT INTO attendance (member_id, attendance_date, status, check_in_time)
  VALUES (2, DATE '2024-12-25', 'Absent', NULL);

EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN
    DBMS_OUTPUT.PUT_LINE('Duplicate entry detected.');
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('An error occurred: ' || SQLERRM);
END;
/
