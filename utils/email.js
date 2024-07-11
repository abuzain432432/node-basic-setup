const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Zain <zainbinramzan@gmail.com>`;
  }
  newTransport() {
    if (process.env !== 'production') {
      return nodemailer.createTransport({
        //NOTE if you are planning to use the gmail server, you need to allow less secure apps to access your account but it is not good idea to use gmail because it only allows 500 emails per day otherwise you will be blocked
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
      });
    }
    return 1;
  }
  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(), //We also need to include the text version because it is required for email delivery rates and also to avoid mail services to put into spam folder
    };
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }
  async sendForgetPassword() {
    await this.send(
      'forgetPassword',
      'You password reset token (valid for 10 minutes)'
    );
  }
};

// const sendEmail = async options => {
//   // create a transporter

//   const transporter = nodemailer.createTransport({
//     //NOTE if you are planning to use the gmail server, you need to allow less secure apps to access your account but it is not good idea to use gmail because it only allows 500 emails per day otherwise you will be blocked
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//   });
//   //  define email options
//   const mailOptions = {
//     from: 'Zain <zainbinramzan@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendMail(mailOptions);
//   // send email
// };
// module.exports = sendEmail;
