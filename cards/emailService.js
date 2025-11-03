const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Verification email
exports.sendVerificationEmail = async(email, token, firstName) => {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    const msg = {
        to: email,
        from: 'noreply@sendgrid.net',
        subject: 'Verify Your Email - CalZone',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
                <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h2 style="color: #000; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Welcome to CalZone</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Hi ${firstName}, thank you for signing up with CalZone. Please verify your email address to get started.
                    </p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${verificationUrl}" style="background-color: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block;">
                            Verify Email
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        Or copy and paste this link if the button doesn't work:
                    </p>
                    <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 10px 0 30px 0;">
                        ${verificationUrl}
                    </p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        This verification link expires in 24 hours. If you didn't create this account, you can ignore this email.
                    </p>
                </div>
            </div>
        `,
        text: `Welcome to CalZone!\n\nPlease verify your email by visiting:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, you can ignore this email.`
    };

try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
} catch (error) {
    console.error('❌ Error sending verification email:', error);
    if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid Error Details:', JSON.stringify(error.response.body.errors, null, 2));
    }
    throw error;
}
};

// Username recovery
exports.sendUsernameEmail = async (email, username, firstName) => {
    const msg = {
        to: email,
        from: 'noreply@sendgrid.net',
        subject: 'Your Username - CalZone',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
                <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h2 style="color: #000; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Your Username</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Hi ${firstName}, here is your username for your CalZone account:
                    </p>
                    <div style="text-align: center; margin: 40px 0; padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
                        <p style="color: #000; font-size: 20px; font-weight: 600; margin: 0;">
                            ${username}
                        </p>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        You can use this username to log in to your account.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        If you didn't make this request, you can ignore this email.
                    </p>
                </div>
            </div>
        `,
        text: `Your username is: ${username}\n\nYou can use this to log in to your CalZone account.\n\nIf you didn't make this request, you can ignore this email.`
    };

try {
    await sgMail.send(msg);
    console.log(`✅ Username recovery email sent to ${email}`);
    return true;
} catch (error) {
    console.error('❌ Error sending username recovery email:', error);
    if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid Error Details:', JSON.stringify(error.response.body.errors, null, 2));
    }
    throw error;
}
};

// Password reset email
exports.sendPasswordResetEmail = async (email, token, firstName) => {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    
    const msg = {
        to: email,
        from: 'noreply@sendgrid.net',
        subject: 'Reset Your Password - CalZone',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
                <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h2 style="color: #000; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Password Reset Request</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Hi ${firstName}, we received a request to reset your password. Click the button below to create a new password:
                    </p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" style="background-color: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        Or copy and paste this link if the button doesn't work:
                    </p>
                    <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 10px 0 30px 0;">
                        ${resetUrl}
                    </p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        This password reset link expires in 1 hour. If you didn't make this request, you can ignore this email.
                    </p>
                </div>
            </div>
        `,
        text: `Reset your password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't make this request, you can ignore this email.`
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        if (error.response && error.response.body && error.response.body.errors) {
            console.error('SendGrid Error Details:', JSON.stringify(error.response.body.errors, null, 2));
        }
        throw error;
    }
};