import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
    },
});

// ─── OTP Email Template ────────────────────────────────────────────────────────
const getOTPEmailTemplate = (ownerName, otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">CineVault</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Password Reset Request</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>${ownerName}</strong>,</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            <div style="background: white; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px solid #667eea;">
                <p style="margin: 0; font-size: 14px; color: #666;">Your One-Time Password (OTP)</p>
                <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
                <strong>This OTP is valid for 10 minutes.</strong><br>
                If you didn't request this, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                This is an automated message. Please don't reply to this email.
            </p>
        </div>
    </div>
`;

// ─── Password Reset Token Email Template ───────────────────────────────────────
const getResetTokenEmailTemplate = (ownerName, resetLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">CineVault</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Reset Your Password</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>${ownerName}</strong>,</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}"
                    style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Reset Password
                </a>
            </div>
            <p style="color: #666; font-size: 14px;">
                <strong>This link is valid for 15 minutes.</strong><br>
                If you didn't request this, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                This is an automated message. Please don't reply to this email.
            </p>
        </div>
    </div>
`;

// ─── Send OTP Email ────────────────────────────────────────────────────────────
export const sendOTPEmail = async (recipientEmail, ownerName, otp) => {
    try {
        const mailOptions = {
            from: env.smtp.from,
            to: recipientEmail,
            subject: 'Your Password Reset OTP - CineVault',
            html: getOTPEmailTemplate(ownerName, otp),
        };

        await transporter.sendMail(mailOptions);
        logger.info(`OTP email sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send OTP email: ${error.message}`);
        throw error;
    }
};

// ─── Send Password Reset Token Email ───────────────────────────────────────────
export const sendPasswordResetEmail = async (recipientEmail, ownerName, resetLink) => {
    try {
        const mailOptions = {
            from: env.smtp.from,
            to: recipientEmail,
            subject: 'Reset Your Password - CineVault',
            html: getResetTokenEmailTemplate(ownerName, resetLink),
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send reset email: ${error.message}`);
        throw error;
    }
};

// ─── Generic Email Sender ──────────────────────────────────────────────────────
export const sendMail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: env.smtp.from,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send email: ${error.message}`);
        throw error;
    }
};

export default transporter;
