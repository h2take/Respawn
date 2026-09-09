const nodemailer = require("nodemailer");
const { convert } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from =
      process.env.NODE_ENV === "production"
        ? `Forum App <${process.env.BREVO_EMAIL_FROM}>`
        : `Forum App <${process.env.MAILTRAP_EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        host: process.env.BREVO_EMAIL_HOST,
        port: process.env.BREVO_EMAIL_PORT,
        auth: {
          user: process.env.BREVO_EMAIL_USERNAME,
          pass: process.env.BREVO_EMAIL_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_EMAIL_HOST,
      port: process.env.MAILTRAP_EMAIL_PORT,
      auth: {
        user: process.env.MAILTRAP_EMAIL_USERNAME,
        pass: process.env.MAILTRAP_EMAIL_PASSWORD,
      },
    });
  }

  // simple HTML builder, no template engine needed
  buildHTML(subject, bodyText) {
    return `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
        <h2>${subject}</h2>
        <p>Hi ${this.firstName},</p>
        <p>${bodyText}</p>
        <a href="${this.url}" style="display:inline-block; padding:10px 20px; background:#333; color:#fff; text-decoration:none;">
          Click here
        </a>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `;
  }

  async send(subject, bodyText) {
    const html = this.buildHTML(subject, bodyText);
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(
      "Welcome to the Forum!",
      "Thanks for joining. Click below to get started.",
    );
  }

  async sendPasswordReset() {
    await this.send(
      "Your password reset token (valid for only 10 minutes)",
      "Forgot your password? Click the link below to reset it. If you didn't request this, please ignore this email.",
    );
  }
};
