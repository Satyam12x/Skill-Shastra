const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const fs = require("fs");

dotenv.config();
const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// Middleware
app.use(cors({ origin: "http://localhost:5000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    profileImage: { type: String },
  },
  { timestamps: true }
);

// Generate Gravatar URL
userSchema.pre("save", function (next) {
  if (!this.profileImage && this.email) {
    const emailHash = crypto
      .createHash("md5")
      .update(this.email.trim().toLowerCase())
      .digest("hex");
    this.profileImage = `https://www.gravatar.com/avatar/${emailHash}?s=40&d=identicon`;
  }
  next();
});

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: String, required: true },
  age: { type: Number, required: true, min: 15, max: 100 },
  gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  education: { type: String, required: true },
  institution: { type: String, required: true },
  guardianName: { type: String, required: true },
  guardianPhone: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  transactionId: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  paymentProof: { type: String, required: true },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "rejected"],
  },
  createdAt: { type: Date, default: Date.now },
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname.replace(ext, "")}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and PDF files are allowed."));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Multer Error Handling Middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((error, success) => {
  if (error) console.error("SMTP Configuration Error:", error);
  else console.log("SMTP Server is ready to send emails");
});

const sendEmail = async (to, subject, html, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail({
        from: `"Skillshastra" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`Email sent to ${to} on attempt ${attempt}`);
      return;
    } catch (error) {
      console.error(`Email Error (Attempt ${attempt}/${retries}):`, error);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } else {
        throw new Error(`Failed to send email to ${to}: ${error.message}`);
      }
    }
  }
};

// Authentication Middleware
const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -otp -otpExpires"
    );
    if (!user || !user.isVerified) {
      res.clearCookie("token");
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.clearCookie("token");
    return res.status(401).json({ message: "Invalid token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

// Helper Function
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Authentication Routes
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, redirect } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user = new User({
      name,
      email,
      password,
      otp,
      otpExpires,
      role: process.env.ADMIN_EMAILS.split(",").includes(email)
        ? "admin"
        : "user",
    });

    await user.save();

    const otpEmail = `
      <h2>Welcome to Skillshastra!</h2>
      <p>Your OTP for email verification is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `;
    await sendEmail(email, "Verify Your Skillshastra Account", otpEmail);

    res.status(201).json({ message: "OTP sent to your email", redirect });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp, redirect } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    const welcomeEmail = `
      <h2>Welcome to Skillshastra, ${user.name}!</h2>
      <p>Your account has been successfully verified.</p>
      <p>Start exploring our courses and master future-ready skills!</p>
    `;
    await sendEmail(user.email, "Welcome to Skillshastra!", welcomeEmail);

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      redirect,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, redirect } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select(
          "-password -otp -otpExpires"
        );
        if (user && user.isVerified) {
          return res.status(400).json({
            message: "User already logged in",
            user: {
              name: user.name,
              email: user.email,
              role: user.role,
              profileImage: user.profileImage,
            },
            redirect,
          });
        }
        res.clearCookie("token");
      } catch (error) {
        res.clearCookie("token");
      }
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      redirect,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, redirect } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const resetEmail = `
      <h2>Password Reset Request</h2>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `;
    await sendEmail(email, "Skillshastra Password Reset", resetEmail);

    res
      .status(200)
      .json({ message: "OTP sent to your email for password reset", redirect });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword, redirect } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully", redirect });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/auth/admin-panel", protect, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -otpExpires");
    res.status(200).json({ message: "Welcome to Admin Panel", users });
  } catch (error) {
    console.error("Admin Panel Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Enrollment Route
app.post(
  "/api/enroll",
  protect,
  upload.single("paymentProof"),
  multerErrorHandler,
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Payment proof file is required" });
      }

      let studentData;
      try {
        studentData = JSON.parse(req.body.studentData || "{}");
      } catch (error) {
        return res.status(400).json({ message: "Invalid student data format" });
      }

      const { transactionId, paymentDate } = req.body;

      const requiredFields = [
        "course",
        "fullName",
        "email",
        "phone",
        "age",
        "gender",
        "education",
        "institution",
        "guardianName",
        "guardianPhone",
        "country",
        "address",
      ];
      for (const field of requiredFields) {
        if (!studentData[field]) {
          return res.status(400).json({ message: `${field} is required` });
        }
      }
      if (!transactionId || !paymentDate) {
        return res
          .status(400)
          .json({ message: "Transaction ID and payment date are required" });
      }

      const enrollment = new Enrollment({
        userId: req.user._id,
        course: studentData.course,
        fullName: studentData.fullName,
        email: studentData.email,
        phone: studentData.phone,
        age: parseInt(studentData.age),
        gender: studentData.gender,
        education: studentData.education,
        institution: studentData.institution,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
        country: studentData.country,
        address: studentData.address,
        transactionId,
        paymentDate: new Date(paymentDate),
        paymentProof: req.file.path,
        status: "pending",
      });

      await enrollment.save();

      const confirmationEmail = `
        <h2>Enrollment Confirmation</h2>
        <p>Dear ${studentData.fullName},</p>
        <p>Your enrollment for <strong>${studentData.course}</strong> has been received.</p>
        <p>Transaction ID: ${transactionId}</p>
        <p>We will verify your payment and confirm your enrollment soon.</p>
        <p>Thank you for choosing Skillshastra!</p>
      `;
      await sendEmail(
        studentData.email,
        "Skillshastra Enrollment Confirmation",
        confirmationEmail
      );

      res.status(201).json({ message: "Enrollment submitted successfully" });
    } catch (error) {
      console.error("Enrollment Error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// Get Enrollments Route
app.get("/api/enrollments", protect, admin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find().populate(
      "userId",
      "name email"
    );
    res
      .status(200)
      .json({ message: "Enrollments fetched successfully", enrollments });
  } catch (error) {
    console.error("Fetch Enrollments Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes for EJS Templates
const renderPage = (page) => (req, res) =>
  res.render(page, { user: req.user || null, request: req });

app.get("/", renderPage("index"));
app.get("/signup", renderPage("signup"));
app.get("/admin", protect, admin, renderPage("admin"));
app.get("/dashboard", protect, renderPage("dashboard"));
app.get("/digital-marketing", renderPage("courses/digitalMarketing"));
app.get(
  "/details-digital-marketing",
  renderPage("courses/course-details/digital-marketing")
);
app.get("/web-dev", renderPage("courses/webdev"));
app.get("/frontend", renderPage("courses/course-details/frontend"));
app.get("/backend", renderPage("courses/course-details/backend"));
app.get("/fullstack", renderPage("courses/course-details/fullstack"));
app.get("/programming", renderPage("courses/Programming"));
app.get("/genai", renderPage("genai"));
app.get("/codingChallenge", renderPage("resources/CodingChallenge"));
app.get("/practiceProject", renderPage("resources/PracticeProject"));
app.get("/studyMaterials", renderPage("resources/StudyMaterials"));
app.get("/expertProfiles", renderPage("team/ExpertProfiles"));
app.get("/meetTeam", renderPage("team/MeetOurTeam"));

app.get("/payment", protect, (req, res) => {
  res.render("courses/payment", {
    user: {
      name: req.user.name,
      email: req.user.email,
      profileImage: req.user.profileImage,
    },
    request: req,
  });
});

// Start Server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
