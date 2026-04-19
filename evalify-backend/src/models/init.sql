-- Init SQL Script for Evalify Backend

-- Enable UUID extension if not already enabled (though gen_random_uuid() is built-in in recent Postgres versions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Auth is handled by Supabase, but we want a record here for metadata and relations)
-- We will use the Supabase Auth UUID as the primary key here as well.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, 
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'STUDENT' or 'TEACHER'
    name VARCHAR(255) NOT NULL,
    reg_no VARCHAR(100), -- Nullable, used for students
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Class Enrollments (Students joined in a class)
CREATE TABLE IF NOT EXISTS class_enrollments (
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, class_id)
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    file_url VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'CODING' or 'QUIZ'
    deadline TIMESTAMP WITH TIME ZONE,
    duration NUMERIC, -- Duration in minutes for timed assignments
    duration_unit VARCHAR(20), -- 'minutes' or 'hours'
    starter_code TEXT,
    language VARCHAR(50) DEFAULT 'javascript',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    code TEXT,
    language VARCHAR(50),
    output TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    score NUMERIC,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assignment_id) -- Normally 1 submission per assignment
);

-- Assignment Attempts (For timed labs/quizzes)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assignment_id)
);

-- Attendance (When student accesses material)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    material_title VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, material_id) -- Log attendance once per material per student
);

-- Integrity Logs (Tab switches, copy/paste)
CREATE TABLE IF NOT EXISTS integrity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'TAB_SWITCH', 'COPY_PASTE', 'BLUR'
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    author VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
