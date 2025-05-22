import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
  verificationToken: {
    type: String,
    select: false
  },
  verificationTokenExpires: {
    type: Date,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
      message: "Please enter a valid email address"
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (v) {
        // Only validate when password is modified (not for hashed values)
        return this.isModified('password')
          ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v)
          : true;
      },
      message: "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
    }
  },
  avatar: {
    type: String,
    default: "",
    validate: {
      validator: (v) => v === "" || /^(https?:\/\/).+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
      message: "Avatar must be a valid image URL"
    }
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "organizer"],
      message: "Role must be either user, admin, or organizer"
    },
    default: "user"
  },
  organizerInfo: {
    organizationName: {
      type: String,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [100, 'Organization name cannot exceed 100 characters']
    },
    description: {
      type: String,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    stripeAccountId: String,
  stripeAccountStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified'],
    default: 'unverified'
  },
    website: {
      type: String,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+\..+/.test(v),
        message: "Please enter a valid website URL"
      }
    },
    address: {
      type: String,
      minlength: [5, 'Address must be at least 5 characters'],
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    phone: {
      type: String,
      validate: {
        validator: (v) => !v || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v),
        message: "Please enter a valid phone number"
      }
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date },
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false }
},
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      }
    }
  }
);

// Virtual for avatar URL
UserSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) {
    return this.avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random&size=256`;
});

// Password hashing middleware
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Organizer info validation middleware
UserSchema.pre('save', function (next) {
  if (this.role === 'organizer' && this.organizerInfo) {
    const requiredFields = [
      'organizationName',
      'description',
      'address',
      'phone'
    ];

    const missingFields = requiredFields.filter(
      field => !this.organizerInfo[field]?.trim()
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required organizer fields: ${missingFields.join(', ')}`
      );
    }

    // Format phone number
    this.organizerInfo.phone = this.organizerInfo.phone.replace(/\D/g, '');
  }
  next();
});

// Account lockout logic
UserSchema.methods.incrementLoginAttempts = async function () {
  const now = Date.now();
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

  if (this.lockUntil && this.lockUntil > now) {
    return;
  }

  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    this.lockUntil = now + LOCK_TIME;
  }

  await this.save();
};

// Reset login attempts on successful login
UserSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Password comparison method
// In User.js - Add error handling to comparePassword method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) throw new Error("Password field missing");
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error("Password comparison error:", err);
    throw new Error("Password comparison failed");
  }
};


// Generate password reset token
UserSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Check if account is locked
UserSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Verify organizer info completeness
UserSchema.methods.validateOrganizerInfo = function () {
  if (this.role !== 'organizer') return true;

  return this.organizerInfo &&
    this.organizerInfo.organizationName &&
    this.organizerInfo.description &&
    this.organizerInfo.address &&
    this.organizerInfo.phone &&
    this.organizerInfo.organizationName.length >= 2 &&
    this.organizerInfo.description.length >= 10;
};

// Upgrade to organizer method
UserSchema.methods.upgradeToOrganizer = async function (organizerData) {
  if (this.role === 'organizer') {
    throw new Error('User is already an organizer');
  }

  if (!this.isVerified) {
    throw new Error('Email must be verified before becoming an organizer');
  }

  // Validate required organizer fields
  const requiredFields = [
    'organizationName',
    'description',
    'address',
    'phone'
  ];

  const missingFields = requiredFields.filter(
    field => !organizerData[field]?.trim()
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  this.role = 'organizer';
  this.organizerInfo = {
    organizationName: organizerData.organizationName,
    description: organizerData.description,
    website: organizerData.website || '',
    address: organizerData.address,
    phone: organizerData.phone,
    createdAt: new Date(),
    verified: false
  };

  await this.save();
  return this;
};

export default mongoose.model('User', UserSchema);