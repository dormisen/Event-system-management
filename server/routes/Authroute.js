import express from "express";
import Event from "../models/Event.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { 
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrganizerVerificationEmail
} from "../utils/mail.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests from this IP, please try again later",
  skipSuccessfulRequests: true,
});

const sendTokenResponse = (user, res) => {
  const accessToken = jwt.sign(
  { 
    id: user._id,
    role: user.role
  }, 
  process.env.JWT_SECRET, 
  { expiresIn: "15m" }
);
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 900000,
});

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 604800000,
});

  res.json({ 
    user: { 
      id: user._id, 
      email: user.email, 
      name: user.name,
      role: user.role,
      isVerified: user.isVerified
    } 
  });
};

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ msg: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate('organizerInfo.stripeAccountId')
      .lean(); 

    if (!user) return res.status(404).json({ msg: "User not found" });

   
    res.json({
      user: {
        ...user,
        organizerInfo: user.organizerInfo || null, 
      },
    });
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
});

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required").escape(),
    body("email")
      .isEmail().withMessage("Invalid email")
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) throw new Error("Email already in use");
      }),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/).withMessage("Password must contain at least one number")
      .matches(/[@$!%*?&]/).withMessage("Password must contain at least one special character (@$!%*?&)")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password } = req.body;
      const user = new User({ name, email, password });
      
      const verificationToken = jwt.sign(
        { 
          id: user._id,
          email: user.email
        }, 
        process.env.JWT_VERIFICATION_SECRET,
        { expiresIn: '1d' }
      );
      
      user.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
      
      await user.save();
      
      await sendVerificationEmail(user.email, verificationToken);
      await sendWelcomeEmail(user.email, user.name);

      res.json({ 
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        verificationToken: verificationToken, 
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified
        }
      });
    } catch (err) {
      console.error("Registration Error:", err);
      res.status(500).json({ 
        success: false,
        message: "Registration failed",
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
  }
);

// Login route  

router.post("/login", authLimiter, [
  body("email").isEmail().normalizeEmail(), 
  body("password").notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findOne({ email: req.body.email })
  .select("+password +loginAttempts +lockUntil")
  .select("-__v");
    if (!user) {
      return res.status(401).json({ 
        msg: "Invalid credentials",
        code: "INVALID_CREDENTIALS" 
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ 
        msg: `Account locked. Try again after ${Math.ceil((user.lockUntil - Date.now()) / 60000)} minutes`,
        code: "ACCOUNT_LOCKED"
      });
    }

    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000;
      }
      
      await user.save();
      return res.status(401).json({ 
        msg: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        msg: "Email not verified. Please check your email for verification instructions.",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    sendTokenResponse(user, res);
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ 
      msg: process.env.NODE_ENV === 'development' ? err.message : "Server error",
      code: "SERVER_ERROR",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ msg: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ msg: "User not found" });

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 900000,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Refresh Token Error:", error.message);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(401).json({ msg: "Invalid refresh token" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict"
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict"
  });
  res.json({ msg: "Logged out successfully" });
});
// upgrade-to-organizer
router.post("/upgrade-to-organizer", [
    body('organizationName').trim().notEmpty().withMessage('Organization name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
      .isMobilePhone().withMessage('Invalid phone number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const token = req.cookies.accessToken;
      if (!token) return res.status(401).json({ msg: "Unauthorized" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) return res.status(404).json({ msg: "User not found" });
      if (user.role === 'organizer') return res.status(400).json({ msg: "Already an organizer" });
      if (!user.isVerified) return res.status(403).json({ msg: "Email must be verified first" });
// Generate verification token
const verificationToken = jwt.sign(
  { id: user._id, organizationName: req.body.organizationName },
  process.env.JWT_VERIFICATION_SECRET,
  { expiresIn: '1d' }
);

user.organizerInfo = {
  ...req.body,
  verified: false,
  verificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
  verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
};

await user.save();

await sendOrganizerVerificationEmail(user.email, req.body.organizationName, verificationToken);
      
      res.json({ 
        success: true,
        message: "Organizer profile submitted for verification",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizerInfo: user.organizerInfo
        }
      });
    } catch (error) {
      console.error("Upgrade Error:", error.message);
      res.status(500).json({ 
        success: false,
        msg: error.message || "Server error" 
      });
    }
  }
);
// send-verification-email
router.post("/send-verification-email", [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified) return res.status(400).json({ msg: "Email already verified" });

    const verificationToken = jwt.sign(
      { 
        id: user._id,
        email: user.email
      }, 
      process.env.JWT_VERIFICATION_SECRET,
      { expiresIn: '1d' }
    );

    user.verificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
await sendVerificationEmail(user.email, verificationToken);
    res.json({ 
      success: true,
      message: "Verification email sent"
    });
  } catch (error) {
    console.error("Verification Email Error:", error.message);
    res.status(500).json({ 
      success: false,
      msg: "Failed to send verification email" 
    });
  }
});
// resend-organization-verification
router.post("/resend-organization-verification", [
  body("token").notEmpty().withMessage("Token is required")
], async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newVerificationToken = jwt.sign(
      { id: user._id, organizationName: user.organizerInfo.organizationName },
      process.env.JWT_VERIFICATION_SECRET,
      { expiresIn: '1d' }
    );

    user.organizerInfo.verificationToken = crypto
      .createHash('sha256')
      .update(newVerificationToken)
      .digest('hex');
    user.organizerInfo.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendOrganizerVerificationEmail(user.email, user.organizerInfo.organizationName, newVerificationToken);

    res.json({ success: true, message: "New verification email sent" });
  } catch (error) {
    console.error("Resend error:", error);
    res.status(400).json({ success: false, msg: "Failed to resend verification" });
  }
});

router.post("/verify-email", [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ 
    success: false,
    errors: errors.array(),
    message: "Validation failed"
  });

  try {
    let { token } = req.body;
    token = decodeURIComponent(token);
    
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid token format"
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired verification token",
        tokenExpired: true
      });
    }

    jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.json({ 
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error('Verification error:', error.message);
    const response = {
      success: false,
      message: "Email verification failed",
      tokenExpired: error.message.includes("expired")
    };

    if (error.message.includes("expired")) {
      response.message = "Verification token has expired";
    }

    return res.status(400).json(response);
  }
});
// verify-organization
router.post("/verify-organization", [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { token } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      'organizerInfo.verificationToken': hashedToken,
      'organizerInfo.verificationTokenExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired verification token"
      });
    }

    jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);
    

    user.role = 'organizer';
    user.organizerInfo.verified = true;
    user.organizerInfo.verificationToken = undefined;
    user.organizerInfo.verificationTokenExpires = undefined;
    
    await user.save();

    res.json({ 
      success: true,
      message: "Organization verified successfully"
    });
  } catch (error) {
    console.error('Organization verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message.includes("expired") 
        ? "Verification token has expired" 
        : "Organization verification failed"
    });
  }
});
// test-email
router.get('/test-email', async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: `"Test Sender" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: process.env.EMAIL_TEST_RECIPIENT || process.env.EMAIL_USER,
      subject: 'Test Email from Event System',
      text: 'This is a test email from your application',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Test Email</h2>
          <p>This is a test email from your Event Management System application.</p>
          <p>If you're seeing this, your email setup is working correctly!</p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
// Admin middleware
const isAdmin = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
const adminRouter = express.Router();

router.use('/admin', adminRouter); // Correct nesting
adminRouter.use(authLimiter);

adminRouter.use(isAdmin);

adminRouter.get('/stats', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const eventsCount = await Event.countDocuments();
    const organizersCount = await User.countDocuments({ role: 'organizer' });
    
    res.json({
      users: usersCount,
      events: eventsCount,
      organizers: organizersCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


adminRouter.get('/events', async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all users
adminRouter.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
adminRouter.put('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
adminRouter.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Event.deleteMany({ organizer: req.params.id });
    res.json({ message: 'User and associated events deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Organizer middleware
const isOrganizer = (req, res, next) => {
  if (req.user?.role === 'organizer') return next();
  res.status(403).json({ message: 'Organizer access required' });
};

// Get organizer's events
router.get('/my-events', isOrganizer, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/my-events', isOrganizer, async (req, res) => {
  try {
    const event = new Event({ ...req.body, organizer: req.user.id });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event
router.put('/my-events/:id', isOrganizer, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.user.id },
      req.body,
      { new: true }
    );
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event
router.delete('/my-events/:id', isOrganizer, async (req, res) => {
  try {
    await Event.findOneAndDelete({ _id: req.params.id, organizer: req.user.id });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Event insights
router.get('/my-events/:id/insights', isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('attendees.user', 'name email');
    const totalRevenue = event.attendees.reduce((sum, attendee) => sum + attendee.pricePaid, 0);
    
    res.json({
      totalTicketsSold: event.attendees.length,
      totalRevenue,
      attendees: event.attendees
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



export default router;