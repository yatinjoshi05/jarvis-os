-- YT Studio Autonomous YouTube Engine Database Schema

CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  gmail VARCHAR(255) NOT NULL,
  youtube_channel_id VARCHAR(255),
  niche VARCHAR(100),
  style VARCHAR(100),
  uploads_per_day INT DEFAULT 2,
  shorts_duration INT DEFAULT 40,
  audience VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Connected',
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tokens_encrypted TEXT
);

CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(64) PRIMARY KEY,
  channel_id VARCHAR(64) REFERENCES channels(id),
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  age INT,
  height VARCHAR(50),
  body_type VARCHAR(50),
  skin_tone VARCHAR(50),
  hair_style VARCHAR(100),
  hair_color VARCHAR(50),
  beard_style VARCHAR(100),
  clothes_style VARCHAR(100),
  accessories VARCHAR(255),
  voice_style VARCHAR(100),
  accent VARCHAR(100),
  personality TEXT,
  emotion_range TEXT,
  backstory TEXT,
  reference_images JSONB,
  appearance_count INT DEFAULT 0,
  storyline TEXT,
  is_locked BOOLEAN DEFAULT TRUE,
  consistency_score FLOAT DEFAULT 98.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_relationships (
  id VARCHAR(64) PRIMARY KEY,
  character_a VARCHAR(64) REFERENCES characters(id),
  character_b VARCHAR(64) REFERENCES characters(id),
  relationship VARCHAR(255) NOT NULL,
  strength INT DEFAULT 95
);

CREATE TABLE IF NOT EXISTS character_visual_memory (
  id VARCHAR(64) PRIMARY KEY,
  character_id VARCHAR(64) REFERENCES characters(id),
  face_embedding TEXT,
  style_embedding TEXT,
  voice_embedding TEXT,
  reference_prompt TEXT
);

CREATE TABLE IF NOT EXISTS stories (
  id VARCHAR(64) PRIMARY KEY,
  channel_id VARCHAR(64) REFERENCES channels(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scenes JSONB,
  characters JSONB,
  emotions JSONB,
  hashtags JSONB,
  script_status VARCHAR(50) DEFAULT 'Script Ready',
  voice_status VARCHAR(50) DEFAULT 'Pending',
  video_status VARCHAR(50) DEFAULT 'Queued',
  upload_status VARCHAR(50) DEFAULT 'Pending',
  video_progress INT DEFAULT 0,
  eta VARCHAR(50),
  viral_score VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_logs (
  id SERIAL PRIMARY KEY,
  story_id VARCHAR(64),
  channel_id VARCHAR(64),
  action VARCHAR(100),
  details TEXT,
  status VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Phase 2.4: Self-Learning + Self-Improvement Tables
CREATE TABLE IF NOT EXISTS video_performance (
  id VARCHAR(64) PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL,
  channel_id VARCHAR(64) NOT NULL,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  retention NUMERIC(5,2) DEFAULT 88.5,
  ctr NUMERIC(5,2) DEFAULT 9.2,
  watch_time NUMERIC(10,2) DEFAULT 34.5,
  completion_rate NUMERIC(5,2) DEFAULT 84.0,
  upload_time VARCHAR(100),
  viral_score INT DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_patterns (
  id VARCHAR(64) PRIMARY KEY,
  pattern_type VARCHAR(100) NOT NULL,
  confidence INT DEFAULT 95,
  success_rate NUMERIC(5,2) DEFAULT 94.5,
  channels JSONB,
  emotions JSONB,
  characters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS improvements (
  id VARCHAR(64) PRIMARY KEY,
  source_video VARCHAR(64),
  problem_detected TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  improvement_score INT DEFAULT 92,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upload_logs (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(64),
  channel_id VARCHAR(64),
  youtube_video_id VARCHAR(100),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  disclaimer_added BOOLEAN DEFAULT TRUE,
  status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS story_logs (
  id SERIAL PRIMARY KEY,
  story_id VARCHAR(64),
  prompt_used TEXT,
  gemini_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_logs (
  id SERIAL PRIMARY KEY,
  service_id VARCHAR(64),
  endpoint VARCHAR(255),
  status_code INT,
  latency_ms INT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_logs (
  id SERIAL PRIMARY KEY,
  character_id VARCHAR(64),
  event VARCHAR(100),
  note TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_logs (
  id SERIAL PRIMARY KEY,
  channel_id VARCHAR(64),
  views INT,
  watch_time_hours FLOAT,
  subscribers_gained INT,
  ctr FLOAT,
  revenue_est FLOAT,
  date DATE DEFAULT CURRENT_DATE
);
