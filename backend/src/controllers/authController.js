import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { seedUserDefaults } from '../services/userSeedService.js';
import { config } from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = new User({
      name,
      email,
      password,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    await user.save();

    // Seed default categories & payment methods for this user
    await seedUserDefaults(user._id);

    // Send verification email (or mock in development)
    const emailResult = await sendVerificationEmail({
      to: user.email,
      token: verificationToken,
      name: user.name,
    });

    // Auto-login upon registration for seamless experience
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      emailStatus: config.email.isConfigured
        ? 'Verification email sent.'
        : 'Email delivery not configured in this environment. Account created.',
      mockVerificationUrl: emailResult.mockUrl || undefined,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        preferences: user.preferences,
        isDemo: user.isDemo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isVerified: req.user.isVerified,
      preferences: req.user.preferences,
      isDemo: req.user.isDemo,
    },
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const user = req.user;

    if (user.isDemo) {
      return res.status(403).json({
        success: false,
        message: 'Demo account details are read-only to preserve the demo session.',
      });
    }

    if (name) user.name = name;
    if (preferences) {
      if (preferences.theme) user.preferences.theme = preferences.theme;
      if (preferences.currency) user.preferences.currency = preferences.currency;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.isDemo) {
      return res.status(403).json({
        success: false,
        message: 'Password cannot be changed on demo account.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond with success to prevent user email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      token: resetToken,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been generated.',
      emailStatus: config.email.isConfigured
        ? 'Reset link sent.'
        : 'Email delivery not configured in this environment.',
      mockResetUrl: emailResult.mockUrl || undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired.',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    next(error);
  }
};
