export const signupTemplate = (name) => `
  <h2>Welcome, ${name}!</h2>
  <p>Thanks for signing up. We're glad to have you.</p>
  <p>Your account is pending admin approval. We'll notify you once it's activated.</p>
`;

export const approvedTemplate = (name) => `
  <h2>Hi ${name},</h2>
  <p>🎉 Great news! Your account has been approved by the admin.</p>
  <p>You can now log in and explore all features.</p>
`;

export const forgotPasswordTemplate = (name, resetLink) => `
  <h2>Hello, ${name}</h2>
  <p>You requested to reset your password. Click the link below:</p>
  <a href="${resetLink}">Reset Password</a>
  <p>This link will expire in 1 hour.</p>
`;

export const passwordChangedTemplate = (name) => `
  <h2>Hi ${name},</h2>
  <p>This is to notify you that your password was changed successfully.</p>
  <p>If you did not make this change, please contact support immediately.</p>
`;
