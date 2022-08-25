const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `Hoang Trung Sang <${process.env.EMAIL_FROM}>`
    }
    // Method
    newTransport() {
        if (process.env.NODE_ENV === 'production') {        // real - Google mail 
            return nodemailer.createTransport({
                service: 'gmail',
                port: 587,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.GMAIL_USERNAME,
                    pass: process.env.GMAIL_PASSWORD
                }
            })
        }
        return nodemailer.createTransport({         // Mailtrap - Safe Email Testing
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }
    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,       // biến sử dụng 
            url: this.url,                // biến sử dụng 
            subject                     // biến sử dụng 
        })
        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,     // html body
            text: htmlToText.fromString(html)       // plain text body

        }
        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome() {        // gửi email chào mừng user mới
        await this.send('welcome', 'Welcome to the Natours Family!')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)')
    }
}

// const sendEmail = async (options) => {
//     // 1) Create a transporter
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     })

//     // 2) Define the email options
//     const mailOptions = {
//         from: 'Hoang Trung Sang <sanganhhungtuoitre123@gmail.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//         // html
//     }
//     // 3) Actually send the email
//     await transporter.sendMail(mailOptions)             // 1 promise
// }

// module.exports = sendEmail;
