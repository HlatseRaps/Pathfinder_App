// database.js
const sqlite3 = require("sqlite3").verbose();

// Create or connect to SQLite database file
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error opening database: " + err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {

  // Create Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS youths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry INTEGER
    )
  `);

   db.run(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      companyName TEXT,
      companyLocation TEXT,
      password TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tourists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      country TEXT,
      password TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry INTEGER
    )
  `);

  db.run(`
CREATE TABLE IF NOT EXISTS youth_profiles (
    youth_id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    idNumber TEXT,
    dob TEXT,
    gender TEXT,
    location TEXT,
    phone TEXT,
    educationLevel TEXT,
    highestGrade TEXT,
    courses TEXT,
    school TEXT,
    skills TEXT,
    languages TEXT,
    experience TEXT,
    availability TEXT,
    workType TEXT,
    transport TEXT,
    extraInfo TEXT,
    FOREIGN KEY (youth_id) REFERENCES youths(id)
)
`)

db.run(`
CREATE TABLE IF NOT EXISTS employer_profile (
    user_id INTEGER PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    idNumber TEXT,
    dob TEXT,
    gender TEXT,
    contact TEXT,
    company_name TEXT,
    industry TEXT,
    position TEXT,
    company_location TEXT,
    webLink TEXT,
    extraInfo TEXT,
    FOREIGN KEY (user_id) REFERENCES employers(id)
)
`);

db.run(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    type TEXT,
    salary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES employers(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  employer_id INTEGER NOT NULL,
  applicant_id INTEGER NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (employer_id) REFERENCES employers(id),
  FOREIGN KEY (applicant_id) REFERENCES youths(id)
)
`)

db.run(`
  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    job_id INTEGER NOT NULL,
    appliedDate TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id)
)
`)

db.run(`
  CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  seeker_id INTEGER NOT NULL,
  seeker_name TEXT NOT NULL,
  seeker_email TEXT NOT NULL,
  seeker_phone TEXT,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'Applied',
  cv TEXT,
  video TEXT,
  pictures TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (seeker_id) REFERENCES users(id)

)
`)

db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`)


db.run(`
CREATE TABLE IF NOT EXISTS youth_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  youth_id INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  location TEXT,
  description TEXT,   
  pictures TEXT, 
  videos TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (youth_id) REFERENCES youths(id)
)
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tourist_profile (
    user_id INTEGER PRIMARY KEY,     
    firstName TEXT,
    lastName TEXT,
    dob TEXT,                     
    gender TEXT,
    contact TEXT,
    countryName TEXT,
    location TEXT,
    extraInfo TEXT,
    FOREIGN KEY (user_id) REFERENCES tourists(id) ON DELETE CASCADE
)
`)


// Table to store users' answers
db.run(`
CREATE TABLE IF NOT EXISTS user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_id) REFERENCES youths(id) ON DELETE CASCADE
)
`);

// Table to store job recommendations based on answers
db.run(`
CREATE TABLE IF NOT EXISTS job_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    score REAL DEFAULT 0,
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_id) REFERENCES youths(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
)
`);

// Table to track if a user chose to take the test
db.run(`
CREATE TABLE IF NOT EXISTS hospitality_test_user (
    user_id INTEGER PRIMARY KEY,
    take_test TEXT DEFAULT 'no',
    FOREIGN KEY (user_id) REFERENCES youths(id) ON DELETE CASCADE
)
`);

// Table to store test answers
db.run(`
CREATE TABLE IF NOT EXISTS hospitality_test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_index INTEGER NOT NULL,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_index),
    FOREIGN KEY (user_id) REFERENCES youths(id) ON DELETE CASCADE
)
`);



db.run(`ALTER TABLE applications ADD COLUMN status TEXT DEFAULT 'pending'`, (err) => {});

});

module.exports = db;
