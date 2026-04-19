-- Migration Script to Update Evalify Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update Assignments table if columns are missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assignments' AND column_name='starter_code') THEN
        ALTER TABLE assignments ADD COLUMN starter_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assignments' AND column_name='language') THEN
        ALTER TABLE assignments ADD COLUMN language VARCHAR(50) DEFAULT 'javascript';
    END IF;

    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assignments' AND column_name='deadline') THEN
        ALTER TABLE assignments ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assignments' AND column_name='duration') THEN
        ALTER TABLE assignments ADD COLUMN duration NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assignments' AND column_name='duration_unit') THEN
        ALTER TABLE assignments ADD COLUMN duration_unit VARCHAR(20);
    END IF;
END $$;

-- 2. Update Submissions table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='submissions' AND column_name='output') THEN
        ALTER TABLE submissions ADD COLUMN output TEXT;
    END IF;
END $$;

-- 3. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assignment_id)
);

CREATE TABLE IF NOT EXISTS integrity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    author VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
