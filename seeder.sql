DROP TABLE IF EXISTS feedback;

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  upvotes INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  urgency_score REAL DEFAULT 0
);

INSERT INTO feedback (source, title, description, upvotes, timestamp) VALUES
('GitHub', 'Deployment timeout', 'Worker deployment times out after 30 seconds', 45, 1737936000000),
('Discord', 'Deploy fails', 'Cannot deploy worker, hangs forever', 23, 1737932400000),
('Support', 'Deployment hanging', 'Deployment never completes', 31, 1737928800000),
('Support', 'D1 queries slow', 'Database queries extremely slow', 67, 1737849600000),
('GitHub', 'D1 performance', 'Database operations taking forever', 52, 1737846000000),
('Twitter', 'Dashboard slow', 'Dashboard takes forever to load', 34, 1737763200000),
('Discord', 'UI freezing', 'Dashboard freezes constantly', 21, 1737673200000),
('GitHub', 'Custom domain broken', 'Cannot add custom domain', 25, 1737324000000),
('Support', 'R2 upload fails', 'Large file uploads fail', 33, 1737151200000),
('Twitter', 'Billing unexpected', 'Got charged more than expected', 73, 1737417600000);