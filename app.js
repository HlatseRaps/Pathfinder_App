// app.js
require("dotenv").config();
const OpenAI = require("openai");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const db = require("./database");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");

const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");


// --- MULTER storage ----
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ensure user is present
    const uid = req.session && req.session.user ? String(req.session.user.id) : 'guest';
    const dir = path.join(__dirname, 'uploads', uid);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // timestamp + original name (you can sanitize if needed)
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safeName);
  }
});

const upload = multer({ storage });



const app = express();
const PORT = 3000;

// ===== Middleware =====
const corsOptions = {
  origin: "http://localhost:3000", // your frontend
  credentials: true
};
app.use(cors(corsOptions));

// Serve static files (CSS, JS, images)
app.use(express.static("public"));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sessions
app.use(session({
  store: new SQLiteStore({
    db: "sessions.sqlite",
    dir: "./"
  }),
  secret: "mysecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));





// === GitHub Models client & helper ===
const aiClient = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

async function askModel(message) {
  const resp = await aiClient.chat.completions.create({
    model: "openai/gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: message }
    ],
    max_tokens: 1000,
    temperature: 1.0,
    top_p: 1.0,
  });

  return resp.choices?.[0]?.message?.content ?? "";
}

//testing session route 

app.get("/api/test-session", (req, res) => {
  if (!req.session.count) req.session.count = 0;
  req.session.count++;
  res.json({ count: req.session.count, session: req.session });
});


//ai chat  route

app.post("/api/ai/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message || "Hello!";

    // ✅ Dummy session user for testing
    if (!req.session.user) {
      req.session.user = { id: 1, hasBeenAskedTest: false, takingTest: false, currentIndex: null };
    }
    const user = req.session.user;

    // Initialize chat history if not exists
    if (!req.session.chatHistory) req.session.chatHistory = [];

    // Save user message
    req.session.chatHistory.push({ sender: "user", text: userMessage });

    // First interaction: ask if user wants to take test
    if (!user.hasBeenAskedTest) {
      user.hasBeenAskedTest = true;
      const replyText = "Hi! Would you like to take a quick hospitality career test to help us recommend the best jobs for you? (yes/no)";
      
      req.session.chatHistory.push({ sender: "ai", text: replyText });
      return res.json({ reply: replyText });
    }

    // Start test if user agrees
    if (!user.takingTest && (userMessage.toLowerCase().includes("start test") || userMessage.toLowerCase().includes("yes"))) {
      user.takingTest = true;
      user.currentIndex = 0;

      const sql = `INSERT INTO hospitality_test_user (user_id, take_test) VALUES (?, ?) 
                   ON CONFLICT(user_id) DO UPDATE SET take_test=?`;
      db.run(sql, [user.id, "yes", "yes"]);

      const firstQuestion = testQuestions[0];
      req.session.chatHistory.push({ sender: "ai", text: firstQuestion });

      return res.json({
        reply: `Great! Let's start the test.\n\n${firstQuestion}`,
        nextQuestion: firstQuestion,
        nextIndex: 0
      });
    }

    // User says "no" to test
    if (!user.takingTest && userMessage.toLowerCase().includes("no")) {
      const replyText = "No problem! You can ask me questions about tourism, hospitality, or your CV anytime.";
      req.session.chatHistory.push({ sender: "ai", text: replyText });
      return res.json({ reply: replyText });
    }

    // If user is taking the test
    if (user.takingTest) {
      const currentIndex = user.currentIndex ?? 0;

      const sql = `INSERT INTO hospitality_test (user_id, question_index, answer)
                   VALUES (?, ?, ?)
                   ON CONFLICT(user_id, question_index) DO UPDATE SET answer=?`;
      db.run(sql, [user.id, currentIndex, userMessage, userMessage], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const nextIndex = currentIndex + 1;

        if (nextIndex >= testQuestions.length) {
          user.takingTest = false;
          user.currentIndex = null;

          db.all(`SELECT question_index, answer FROM hospitality_test WHERE user_id = ? ORDER BY question_index`, [user.id], async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const answers = rows.map(r => `Q${r.question_index + 1}: ${testQuestions[r.question_index]} -> ${r.answer}`).join("\n");

            // ✅ Fetch jobs from database
            db.all(`SELECT id, title, description, location, type, salary FROM jobs ORDER BY created_at DESC LIMIT 20`, async (err, jobs) => {
              if (err) return res.status(500).json({ error: err.message });

              const jobsText = jobs.map(j => 
                `Job ID: ${j.id}\nTitle: ${j.title}\nDescription: ${j.description}\nLocation: ${j.location}\nType: ${j.type}\nSalary: ${j.salary}`
              ).join("\n\n");

              const prompt = `
Based on this user's hospitality test answers, recommend the most suitable jobs from the list below.
Explain why each job is a good fit.

User Answers:
${answers}

Available Jobs:
${jobsText}
              `;

              const recommendation = await askModel(prompt);

              req.session.chatHistory.push({ sender: "ai", text: recommendation });

              return res.json({
                done: true,
                reply: `Test complete! 🎉\n\nHere are some jobs we recommend for you:\n\n${recommendation}`
              });
            });
          });
          return;
        } else {
          user.currentIndex = nextIndex;
          const nextQuestion = testQuestions[nextIndex];
          req.session.chatHistory.push({ sender: "ai", text: nextQuestion });

          return res.json({
            done: false,
            reply: nextQuestion,
            nextQuestion,
            nextIndex
          });
        }
      });
      return;
    }

    //Normal AI reply (with CV context if available)
    let cvContext = "";
    if (req.session.cvText) {
      cvContext = `\n\nThe user has uploaded this CV. Use it as context when answering:\n${req.session.cvText.slice(0, 3000)}`;
    }

    const prompt = `
You are a helpful AI career assistant.
${cvContext}

User says: "${userMessage}"
`;

    const text = await askModel(prompt);
    req.session.chatHistory.push({ sender: "ai", text });
    res.json({ reply: text });

  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: err.message });
  }
});




//fetch chat history

app.get("/api/ai/chat/history", (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "Not logged in" });
  res.json({ history: req.session.chatHistory || [] });
});



// test questions 

const testQuestions = [
  "Do you prefer working with people directly or more behind the scenes?",
  "How well do you handle high-pressure situations?",
  "Are you more interested in food and beverages, accommodations, events, travel, or another area?",
  "Do you enjoy creating experiences for others, such as organizing events or curating personalized services?",
  "Are you more comfortable with administrative tasks or hands-on tasks?",
  "Do you have experience or interest in leadership roles?",
  "Are you okay with working irregular hours, weekends, and holidays?",
  "Do you enjoy fast-paced environments or prefer quieter settings?",
  "Do you want a role where you can advance quickly into management or a specialized skill-based role?",
  "Are you more interested in working locally or open to travel?",
  "Do you enjoy interacting with diverse cultures and personalities, or prefer a more uniform clientele?",
  "Do you thrive in roles that require creativity or in roles that require efficiency and precision?"
];


// AI test route

app.post("/api/ai/test", async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "Not logged in" });

  const { answer, questionIndex } = req.body; 
  // answer = user response, questionIndex = current question number

  try {
    // Save user's answer to DB
    const sql = `INSERT INTO hospitality_test (user_id, question_index, answer)
                 VALUES (?, ?, ?)
                 ON CONFLICT(user_id, question_index) DO UPDATE SET answer=?`;
    db.run(sql, [user.id, questionIndex, answer, answer], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Determine next question
      const nextIndex = questionIndex + 1;
      if (nextIndex >= testQuestions.length) {
        return res.json({ done: true, message: "Test complete! Thank you for your responses." });
      } else {
        return res.json({ 
          done: false, 
          nextQuestion: testQuestions[nextIndex],
          nextIndex 
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//analyze cv route

// === Analyze CV Route ===
// === Analyze CV Route ===
app.post("/api/ai/analyze-cv", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(fileBuffer);
    const text = data.text;

    // Store CV text in session for chat context
    req.session.cvText = text;

    // Limit CV snippet for AI prompt
    const snippet = text.slice(0, 3000);

    const aiPrompt = `
      You are an expert career advisor. 
      Analyze this CV text and return ONLY JSON in this exact format:

      {
        "strengths": ["...","..."],
        "weaknesses": ["...","..."],
        "improvements": ["...","..."]
      }

      Do not include commentary or code block markers.
      CV Text: ${snippet}
    `;

    const suggestions = await askModel(aiPrompt);
    let cleanResponse = suggestions.trim();
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.replace(/```json|```/gi, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch {
      parsed = { strengths: [], weaknesses: [], improvements: [] };
    }

    res.json(parsed);

  } catch (error) {
    console.error("Error processing CV:", error);
    res.status(500).json({ error: "Failed to process CV" });
  }
});



// Demo route that runs your exact prompt
app.get("/api/ai/demo", async (req, res) => {
  try {
    const text = await askModel("can you guide me with my tourism career");
    res.json({ reply: text });
  } catch (err) {
    console.error("AI demo error:", err);
    res.status(500).json({ error: err.message });
  }
});

//clear chat route

app.post("/api/ai/chat/clear", (req, res) => {
  if (req.session) {
    // Clear chat messages
    req.session.chatHistory = [];

    // Reset AI test/user state so new messages start fresh
    if (req.session.user) {
      req.session.user.hasBeenAskedTest = false;  // AI will ask first question again
      req.session.user.takingTest = false;        // Stop ongoing test
      req.session.user.currentIndex = null;       // Reset test index
    }
  }
  res.json({ success: true });
});








// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ===== Serve pages =====
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "home.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login_form.html")));
app.get("/forgot-password", (req, res) => res.sendFile(path.join(__dirname, "public", "forgot_password.html")));

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { role, firstName, lastName, email, phone, companyName, companyLocation, country, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  let query = "", params = [];

  if (role === "youth") {
    query = `INSERT INTO youths (firstName, lastName, email, phone, password) VALUES (?,?,?,?,?)`;
    params = [firstName, lastName, email, phone, hashedPassword];
  } else if (role === "employer") {
    query = `INSERT INTO employers (firstName, lastName, email, companyName, companyLocation, password) VALUES (?,?,?,?,?,?)`;
    params = [firstName, lastName, email, companyName, companyLocation, hashedPassword];
  } else if (role === "tourist") {
    query = `INSERT INTO tourists (firstName, lastName, email, country, password) VALUES (?,?,?,?,?)`;
    params = [firstName, lastName, email, country, hashedPassword];
  } else {
    return res.status(400).json({ error: "Invalid role" });
  }

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: "Database error: " + err.message });
    res.redirect("/login");
  });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { role, email, password } = req.body;
  let table, dashboard;

  if (role === "youth") { table = "youths"; dashboard = "/youth_dashboard"; }
  else if (role === "employer") { table = "employers"; dashboard = "/employer_dashboard"; }
  else if (role === "tourist") { table = "tourists"; dashboard = "/tourist_dashboard"; }
  else return res.status(400).json({ error: "Invalid role" });

  db.get(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).send("Error: " + err.message);
    if (!user) return res.status(401).send("User not found");

    if (!bcrypt.compareSync(password, user.password)) return res.status(401).send("Invalid password");

    req.session.user = user;
    req.session.role = role;

    res.redirect(dashboard);
  });
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ===== GET LOGGED-IN USER INFO =====
app.get("/api/user", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  const user = req.session.user;
  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: req.session.role
  });
});



// ===== FORGOT PASSWORD =====
app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "forgot_password.html"));
});

app.post("/forgot-password", (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) return res.status(400).json({ success: false, message: "Email or role missing" });

  const table =
    role === "youth" ? "youths" :
    role === "employer" ? "employers" :
    role === "tourist" ? "tourists" :
    null;

  if (!table) return res.status(400).json({ success: false, message: "Invalid role" });

  const token = crypto.randomBytes(20).toString("hex");
  const expiry = Date.now() + 3600000; // 1 hour

  db.run(
    `UPDATE ${table} SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`,
    [token, expiry, email],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: "Database error: " + err.message });
      if (this.changes === 0) return res.status(404).json({ success: false, message: "Email not found" });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "pathfinderwebsite83@gmail.com",
          pass: "iyruqqnrivtianty"
        }
      });

      const resetLink = `http://localhost:3000/reset-password?role=${role}&token=${token}`;


      const mailOptions = {
        from: '"PathFinder Website App Password" <pathfinderwebsite83@gmail.com>',
        to: email,
        subject: "PathFinder Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #0073e6;">PathFinder Password Reset</h2>
            <p>Hello ${email},</p>
            <p>You requested a password reset. Click below to reset it:</p>
            <a href="${resetLink}" style="
              display: inline-block;
              padding: 10px 20px;
              margin: 10px 0;
              background-color: #0073e6;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            ">Reset Password</a>
            <p>If you did not request a password reset, ignore this email.</p>
            <p>Thanks,<br/>PathFinder Team</p>
          </div>
        `
      };

    transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Email error:", err);
      return res.status(500).json({ success: false, message: "Failed to send email." });
    }
    return res.json({ success: true, message: "Reset link sent! Please check your email." });
  });
    }
  );
});

// ===== RESET PASSWORD =====
app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reset_password.html"));
});



app.post("/reset-password", (req, res) => {
  const { role, token, newPassword, confirmPassword } = req.body;

  if (!role || !token) return res.status(400).json({ success: false, message: "Invalid request" });
  if (!newPassword || !confirmPassword) return res.status(400).json({ success: false, message: "Password missing" });
  if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match" });

  const table =
    role === "youth" ? "youths" :
    role === "employer" ? "employers" :
    role === "tourist" ? "tourists" :
    null;

  if (!table) return res.status(400).json({ success: false, message: "Invalid role" });

  db.get(`SELECT * FROM ${table} WHERE reset_token = ?`, [token], (err, user) => {
    if (err) return res.status(500).json({ success: false, message: "Database error: " + err.message });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token" });
    if (Date.now() > user.reset_token_expiry) return res.status(400).json({ success: false, message: "Token expired" });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.run(
      `UPDATE ${table} SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
      [hashedPassword, user.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: "Database error: " + err.message });
        res.json({ success: true, message: "Password reset successful! You can now log in." });
      }
    );
  });
});

// ===== YOUTH PROFILE =====

// GET profile
app.get("/api/profile", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;

  db.get(`SELECT * FROM youth_profiles WHERE youth_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// SAVE/UPDATE profile
app.post("/api/profile", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const youth_id = req.session.user.id;
  const data = req.body;

  db.run(
  `INSERT INTO youth_profiles (
      youth_id, first_name, last_name, email, idNumber, dob, gender, location, phone,
      educationLevel, highestGrade, courses, school, skills, languages, experience,
      availability, workType, transport, extraInfo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(youth_id) DO UPDATE SET
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      email=excluded.email,
      idNumber=excluded.idNumber,
      dob=excluded.dob,
      gender=excluded.gender,
      location=excluded.location,
      phone=excluded.phone,
      educationLevel=excluded.educationLevel,
      highestGrade=excluded.highestGrade,
      courses=excluded.courses,
      school=excluded.school,
      skills=excluded.skills,
      languages=excluded.languages,
      experience=excluded.experience,
      availability=excluded.availability,
      workType=excluded.workType,
      transport=excluded.transport,
      extraInfo=excluded.extraInfo
  `,
  [
    youth_id, data.first_name, data.last_name, data.email, data.idNumber, data.dob, data.gender, data.location, data.phone,
    data.educationLevel, data.highestGrade, data.courses, data.school, data.skills, data.languages, data.experience,
    data.availability, data.workType, data.transport, data.extraInfo
  ],
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  }
);

});


// ===== DASHBOARDS =====
app.get("/youth_dashboard", (req, res) => {
  if (!req.session.user || req.session.role !== "youth") return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "youth_dashboard.html"));
});

app.get("/employer_dashboard", (req, res) => {
  if (!req.session.user || req.session.role !== "employer") return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "employer_dashboard.html"));
});

app.get("/tourist_dashboard", (req, res) => {
  if (!req.session.user || req.session.role !== "tourist") return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "tourist_dashboard.html"));
});

// ===== OTHER PAGES =====
app.get("/training", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "training.html"));
});
app.get("/applied_jobs", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "applied_jobs.html"));
});
app.get("/test", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "test.html"));
});
app.get("/notifications", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "notifications.html"));
});
app.get("/post_jobs", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "post_jobs.html"));
});
app.get("/view_applicants", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "view_applicants.html"));
});
app.get("/manage_jobs", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "manage_jobs.html"));
});
app.get("/explore_locations", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "explore_locations.html"));
});
app.get("/bookings", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "bookings.html"));
});
app.get("/reviews", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "reviews.html"));
});



// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// POST handler to save media
app.post('/api/youth/media', upload.fields([
  { name: 'pictures', maxCount: 12 },
  { name: 'videos', maxCount: 6 }
]), (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const youth_id = req.session.user.id;
    const { first_name, last_name, email, city, country, description, category, location_name } = req.body;

    // debug log
    console.log('POST /api/youth/media', { youth_id, body: req.body, files: req.files });

    const pictures = (req.files && req.files.pictures) ? req.files.pictures.map(f => f.filename).join(',') : '';
    const videos = (req.files && req.files.videos) ? req.files.videos.map(f => f.filename).join(',') : '';

    const sql = `
      INSERT INTO youth_media 
        (youth_id, first_name, last_name, email, city, country, description, pictures, videos, category, location_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [youth_id, first_name||'', last_name||'', email||'', city||'', country||'', description||'', pictures||'', videos|| '', category, location_name], function(err) {
      if (err) {
        console.error('DB INSERT ERROR:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Inserted youth_media id:', this.lastID);
      res.json({ success: true, id: this.lastID });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET handler to read posts of the logged-in youth
app.get('/api/youth/media', (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const youth_id = req.session.user.id;
  db.all('SELECT * FROM youth_media WHERE youth_id = ? ORDER BY created_at DESC', [youth_id], (err, rows) => {
    if (err) {
      console.error('DB SELECT ERROR:', err);
      return res.status(500).json({ error: err.message });
    }
    // Ensure we always return an array
    res.json(rows || []);
  });
});

app.get('/api/youth/media/all', (req, res) => {
  db.all('SELECT * FROM youth_media ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('DB SELECT ERROR:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});


// DELETE a youth media post by ID
app.delete("/api/youth/media/:id", (req, res) => {
  const postId = req.params.id;

  const sql = "DELETE FROM youth_media WHERE id = ?";
  db.run(sql, [postId], function (err) {
    if (err) {
      console.error("Error deleting post:", err);
      return res.status(500).json({ success: false, error: "Failed to delete post" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    res.json({ success: true, message: "Post deleted successfully" });
  });
});



app.post("/api/employer/media", upload.fields([{ name: "pictures", maxCount: 5 }]), (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const employer_id = req.session.user.id;
  const { location_name, city, country, summary, tips, category, fullname, email } = req.body;

  const pictures = (req.files && req.files.pictures) 
    ? req.files.pictures.map(f => f.filename).join(",") 
    : "";

  const sql = `
    INSERT INTO locations 
      (employer_id, location_name, city, country, summary, tips, category, image_url, fullname, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    sql,
    [employer_id, location_name || "", city || "", country || "", summary || "", tips || "", category || "", pictures || "", fullname , email],
    function (err) {
      if (err) {
        console.error("DB INSERT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log("Inserted location id:", this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});


// GET handler to read posts of the logged-in youth
app.get('/api/employer/media', (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const employer_id = req.session.user.id;
  db.all('SELECT * FROM locations WHERE employer_id = ? ORDER BY created_at DESC', [employer_id], (err, rows) => {
    if (err) {
      console.error('DB SELECT ERROR:', err);
      return res.status(500).json({ error: err.message });
    }
    // Ensure we always return an array
    res.json(rows || []);
  });
});

app.get('/api/employer/media/all', (req, res) => {
  db.all('SELECT * FROM locations ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('DB SELECT ERROR:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// DELETE a youth media post by ID
app.delete("/api/employer/media/:id", (req, res) => {
  const postId = req.params.id;

  const sql = "DELETE FROM locations WHERE id = ?";
  db.run(sql, [postId], function (err) {
    if (err) {
      console.error("Error deleting post:", err);
      return res.status(500).json({ success: false, error: "Failed to delete post" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    res.json({ success: true, message: "Post deleted successfully" });
  });
});




app.post("/post_jobs", (req, res) => {
  if (!req.session.user || req.session.role !== "employer") {
    return res.status(401).send("You must be logged in as an employer to post a job");
  }

  const employer_id = req.session.user.id; // take from session, not hidden input
  const { title, description, location, type, salary, extraInfo } = req.body;

  if (!title || !description) {
    return res.status(400).send("Missing required fields");
  }

  const sql = `
    INSERT INTO jobs (employer_id, title, description, location, type, salary, extraInfo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [employer_id, title, description, location, type, salary, extraInfo], function (err) {
    if (err) {
      console.error("Error inserting job:", err.message);
      return res.status(500).send("Failed to post job");
    }
    console.log("Job posted with ID:", this.lastID);
    res.redirect("/manage_jobs");
  });
});

// Get jobs for logged-in employer
app.get("/api/employer/jobs", (req, res) => {
  const employerId = req.session.user.id; // take from session, not hidden input

  const sql = "SELECT * FROM jobs WHERE employer_id = ?";
  db.all(sql, [employerId], (err, rows) => {
    if (err) {
      console.error(" Error fetching jobs:", err.message);
      return res.status(500).json({ error: "Failed to fetch jobs" });
    }
    res.json(rows);
  });
});

app.get("/api/employer/job_stats", (req, res) => {
  if (!req.session.user || req.session.role !== "employer") {
    return res.status(401).json({ error: "Not logged in" });
  }

  const employerId = req.session.user.id;

  // Count total jobs posted
  db.get(`SELECT COUNT(*) AS jobsPosted FROM jobs WHERE employer_id=?`, [employerId], (err, jobRow) => {
    if (err) return res.status(500).json({ error: err.message });

    // Count active jobs 
    db.get(`SELECT COUNT(*) AS activeJobs FROM jobs WHERE employer_id=?`, [employerId], (err, activeRow) => {
      if (err) return res.status(500).json({ error: err.message });

      // Count applications received
      db.get(`SELECT COUNT(*) AS applications FROM job_applications WHERE employer_id=?`, [employerId], (err, appRow) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          jobsPosted: jobRow.jobsPosted,
          activeJobs: activeRow.activeJobs,
          applications: appRow ? appRow.applications : 0
        });
      });
    });
  });
});

// Edit job
app.post("/edit_job", (req, res) => {
  const { jobId, title, description, location, type, salary } = req.body;

  const sql = `UPDATE jobs SET title=?, description=?, location=?, type=?, salary=? WHERE id=?`;
  db.run(sql, [title, description, location, type, salary, jobId], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});

// Delete job
app.delete("/delete_job/:id", (req, res) => {
  const jobId = req.params.id;

  const sql = `DELETE FROM jobs WHERE id=?`;
  db.run(sql, [jobId], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
});


//retrieve all jobs 
app.get("/jobs", (req, res) => {
  const query = `SELECT * FROM jobs ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});



app.post("/apply_job", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "pictures", maxCount: 5 }
]), async (req, res) => {
  const { jobId } = req.body;
  const user = req.session.user;

  if (!user) return res.status(401).json({ message: "Not logged in" });

  // 🔎 Check if youth profile exists and is complete
  db.get("SELECT * FROM youth_profiles WHERE youth_id = ?", [user.id], (err, profile) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (!profile) {
      return res.status(400).json({ message: "Please complete your profile before applying." });
    }

    const requiredFields = ["first_name", "last_name", "email", "phone", "skills"];
    const missing = requiredFields.filter(f => !profile[f] || profile[f].trim() === "");

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Please complete your profile before applying (missing: " + missing.join(", ") + ")."
      });
    }

    // If profile is complete, continue with job lookup
    db.get("SELECT * FROM jobs WHERE id = ?", [jobId], (err, job) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!job) return res.status(404).json({ message: "Job not found" });

      // Get uploaded files (multer saves them in req.files)
      const cvFile = req.files["cv"] ? req.files["cv"][0].filename : null;
      const videoFile = req.files["video"] ? req.files["video"][0].filename : null;
      const pictureFiles = req.files["pictures"] ? req.files["pictures"].map(f => f.filename).join(",") : null;

      // Insert into applications table (add file columns if not already)
      db.run(
        `INSERT INTO applications 
          (job_id, job_title, seeker_id, seeker_name, seeker_email, seeker_phone, status, cv, video, pictures)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job.id,
          job.title,
          user.id,
          `${profile.first_name} ${profile.last_name}`,
          profile.email,
          profile.phone || "",
          "Applied",
          cvFile,
          videoFile,
          pictureFiles
        ],
        function (err2) {
          if (err2) return res.status(500).json({ message: err2.message });
          res.json({ success: true, message: "Application submitted successfully!" });
        }
      );
    });
  });
});


app.get("/api/my_applications", (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ message: "Not logged in" });

const sql = `
  SELECT a.id AS application_id, a.applied_at, a.status, j.id AS job_id, j.title AS job_title,
         j.description AS description, j.location AS location
  FROM applications a
  JOIN jobs j ON a.job_id = j.id
  WHERE a.seeker_id = ?
  ORDER BY a.applied_at DESC
`;


  db.all(sql, [user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Delete application
app.delete("/applications/:id", (req, res) => {
  const applicationId = parseInt(req.params.id);
  console.log("Received delete request for ID:", applicationId);

  db.run(`DELETE FROM applications WHERE id = ?`, [applicationId], function (err) {
    if (err) {
      console.error("Error deleting application:", err.message);
      return res.status(500).json({ error: "Something went wrong" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    console.log("Application deleted successfully, rows affected:", this.changes);
    res.json({ success: true, message: "Application deleted successfully" });
  });
})


app.get("/api/job_applicants", (req, res) => {
  const employer = req.session.user;
  if (!employer) return res.status(401).json({ message: "Not logged in" });

  // Get all jobs posted by this employer
  db.all("SELECT * FROM jobs WHERE employer_id = ?", [employer.id], (err, jobs) => {
    if (err) return res.status(500).json({ message: err.message });
    const jobIds = jobs.map(j => j.id);
    if (jobIds.length === 0) return res.json([]);
    // Get all applications for these jobs
    db.all(`SELECT * FROM applications WHERE job_id IN (${jobIds.join(",")})`, (err2, apps) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(apps);
    });
  });
});

// Decline
app.post("/api/applicant/decline/:id", (req, res) => {
  const applicationId = req.params.id;

  db.run(`UPDATE applications SET status = 'Unsuccessful' WHERE id = ?`, [applicationId], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: "Application not found" });

    res.json({ success: true, message: "Applicant marked as Unsuccessful" });
  });
});

// Accept
app.post("/api/applicant/accept/:id", (req, res) => {
  const applicationId = req.params.id;

  db.run(`UPDATE applications SET status = 'Accepted' WHERE id = ?`, [applicationId], function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: "Application not found" });

    res.json({ success: true, message: "Applicant marked as Successful" });
  });
});



// Get single applicant profile (with joined youth profile)
app.get("/api/applicant/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT 
      a.id AS applicant_id,
      a.firstName,
      a.lastName,
      a.email,
      a.phone,
      a.appliedDate,
      yp.dob,
      yp.gender,
      yp.location,
      yp.educationLevel,
      yp.highestGrade,
      yp.skills,
      yp.languages,
      yp.experience,
      yp.availability,
      yp.workType,
      yp.transport,
      yp.extraInfo
    FROM applicants a
    LEFT JOIN youth_profiles yp 
      ON a.email = yp.email
    WHERE a.id = ?;
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("DB error fetching applicant:", err);
      return res.json({ success: false, error: "DB error" });
    }
    if (!row) {
      return res.json({ success: false, error: "Applicant not found" });
    }

    res.json({ success: true, profile: row });
  });
});




app.get("/api/youth_profile/:id", (req, res) => {
  const youthId = req.params.id;
  db.get("SELECT * FROM youth_profiles WHERE youth_id = ?", [youthId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Profile not found" });
    res.json(row);
  });
});


// ===== Employer profile API =====
app.get("/api/employer_profile", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;

  db.get(`SELECT * FROM employer_profile WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {}); // return empty object if no profile yet
  });
});

// Save or update employers profile
app.post("/api/employer_profile", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;
  const data = req.body;

  db.run(
  `INSERT INTO employer_profile 
    (user_id, firstName, lastName, email, idNumber, dob, gender, contact, company_name, industry, position, company_location, webLink, extraInfo)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     firstName=?, lastName=?, email=?, idNumber=?, dob=?, gender=?, contact=?, company_name=?, industry=?, position=?, company_location=?, webLink=?, extraInfo=?`,
  [
    userId, data.firstName, data.lastName, data.email, data.idNumber, data.dob, data.gender, data.contact, data.company_name,
    data.industry, data.position, data.company_location, data.webLink, data.extraInfo,
    data.firstName, data.lastName, data.email, data.idNumber, data.dob, data.gender, data.contact, data.company_name,
    data.industry, data.position, data.company_location, data.webLink, data.extraInfo
  ],
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  }
);
});


// ===== GET Tourist Profile =====
app.get("/api/tourist_profile", (req, res) => {
  if (!req.session.user || req.session.role !== "tourist") 
    return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;

  const sql = `SELECT * FROM tourist_profile WHERE user_id = ?`;
  db.get(sql, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {}); // return empty object if no profile yet
  });
});

// ===== SAVE or UPDATE Tourist Profile =====
app.post("/api/tourist_profile", (req, res) => {
  if (!req.session.user || req.session.role !== "tourist") 
    return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.user.id;
  const data = req.body;

  const sql = `
    INSERT INTO tourist_profile 
      (user_id, firstName, lastName, dob, gender, contact, countryName, location, extraInfo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      firstName=?, lastName=?, dob=?, gender=?, contact=?, countryName=?, location=?, extraInfo=?
  `;

  const params = [
    userId,
    data.firstName, data.lastName, data.dob, data.gender, data.contact, data.countryName, data.location, data.extraInfo,
    data.firstName, data.lastName, data.dob, data.gender, data.contact, data.countryName, data.location, data.extraInfo
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Profile saved successfully" });
  });
});


// Submit review
app.post("/reviews", (req, res) => {
  const { loc_id, name, rating, text } = req.body;
  db.run(
    `INSERT INTO reviews (loc_id, name, rating, text) VALUES (?,?,?,?)`,
    [loc_id, name, rating, text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get reviews for a location
app.get("/reviews/:loc_id", (req, res) => {
  db.all(
    `SELECT * FROM reviews WHERE loc_id=? ORDER BY created_at DESC`,
    [req.params.loc_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});




// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});