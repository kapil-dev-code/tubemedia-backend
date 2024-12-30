import { EmailVerification } from "../models/emailVerification.modal.js";
import { ApiError } from "./ApiError.js";
import { transporter } from "./nodemailer.js";

function generateVerificationCode(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}


export const sendEmailVerificationCode = async (_, user) => {
  try {
    const otp = generateVerificationCode(4);
    const emailVerification = await EmailVerification.findOne({ userId: user._id });
    if (emailVerification) {
      emailVerification.otp = otp;
      await emailVerification.save();
    } else {
      await EmailVerification.create({ userId: user._id, otp });
    }


    const otpVerificationLink = `${process.env.FRONTEND_HOST}/account/verify-email`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="text-align: center; color: #4CAF50;">Verify Your Account</h2>
        <p>Hi ${user.fullName},</p>
        <p>Thank you for registering with us! To complete your account setup, please use the OTP (One-Time Password) below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; font-size: 1.5rem; font-weight: bold; color: #333;">
            ${otp}
          </span>
        </div>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email or contact our support team.</p>
        <p>Alternatively, you can complete your email verification by clicking the link below:</p>
        <p><a href="${otpVerificationLink}" style="color: #4CAF50;">Verify your email</a></p>
        <p>Best regards,<br>Your Company Name</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 0.85rem; color: #555;">If you have any questions, reach out to us at <a href="mailto:support@yourcompany.com" style="color: #4CAF50; text-decoration: none;">support@yourcompany.com</a>.</p>
      </div>
    `;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "OTP - Verify Your Account",
      html: emailHtml
    }
    )
  } catch (error) {
    throw new ApiError(500, error)
  }
}
export const sendForgetPasswordEmail = async (user,token) => {
  try {
     const forgetPasswordLink = `${process.env.FRONTEND_HOST}/reset-password/${token}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hi ${user.fullName},</p>
        <p>We received a request to reset your password. You can reset your password by clicking the link below:</p>
        <p>
          <a href="${forgetPasswordLink}" style="color: #007BFF; text-decoration: none;">Reset Password</a>
        </p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Thank you,</p>
        <p>Your Company Name</p>
      </div>
    `;
     
  
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Reset password",
      html: emailHtml
    }
    )
    
  } catch (error) {
    throw new ApiError(500, error)
  }
}