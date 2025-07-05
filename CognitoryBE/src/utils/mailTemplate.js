const FRONTEND_LINK = "https://cognitory.vercel.app";

export const signupTemplate = (name) => `
  <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
    <h2 style="color:#4CAF50;">Welcome to Our Platform, ${name}!</h2>
    <p>Thank you for signing up. We're thrilled to have you onboard.</p>
    <p>Your account is currently <strong>pending admin approval</strong>. Once approved, you'll receive full access to our features.</p>
    <p>We appreciate your patience.</p>
    <br/>
    <p>Warm regards,</p>
    <p><strong>The Team</strong></p>
  </div>
`;

export const approvedTemplate = (name) => `
  <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
    <h2 style="color:#2196F3;">🎉 Good News, ${name}!</h2>
    <p>Your account has been <strong>approved by the admin</strong>.</p>
    <p>You can now log in and start exploring all the features available to you.</p>
    <a href="${FRONTEND_LINK}/login" style="display:inline-block; margin-top:15px; padding:10px 20px; background-color:#2196F3; color:#fff; text-decoration:none; border-radius:5px;">Login Now</a>
    <br/><br/>
    <p>Welcome aboard!</p>
    <p><strong>The Team</strong></p>
  </div>
`;

export const forgotPasswordTemplate = (name, resetLink) => `
  <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
    <h2 style="color:#FF9800;">Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <a href="${resetLink}" style="display:inline-block; margin:15px 0; padding:10px 20px; background-color:#FF9800; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
    <p>This link is valid for 15 mins. If you didn’t request this, you can safely ignore this email.</p>
    <br/>
    <p>Stay secure,</p>
    <p><strong>The Team</strong></p>
  </div>
`;

export const passwordChangedTemplate = (name) => `
  <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
    <h2 style="color:#607D8B;">Password Changed Successfully</h2>
    <p>Hi ${name},</p>
    <p>This is a confirmation that your account password was changed.</p>
    <p>If you did not make this change, please <a href="mailto:support@example.com" style="color:#d32f2f;">contact our support team</a> immediately.</p>
    <br/>
    <p>Thanks for keeping your account secure.</p>
    <p><strong>The Team</strong></p>
  </div>
`;

export const promotedToAdminTemplate = (name) => `
  <div style="font-family:Arial, sans-serif; padding:20px; color:#333;">
    <h2 style="color:#673AB7;">🎉 Congratulations, ${name}!</h2>
    <p>You have been <strong>granted Admin privileges</strong> on our platform.</p>
    <p>As an admin, you now have access to additional controls and features to manage users, content, and more.</p>
    <a href="${FRONTEND_LINK}/admin/dashboard" style="display:inline-block; margin-top:15px; padding:10px 20px; background-color:#673AB7; color:#fff; text-decoration:none; border-radius:5px;">Go to Admin Dashboard</a>
    <br/><br/>
    <p>Use your powers wisely 💪</p>
    <p><strong>The Team</strong></p>
  </div>
`;
