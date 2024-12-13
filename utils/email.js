const nodemailer=require("nodemailer");

const sendEmail=async(options)=>{
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.email,
    // subject: 'Your OTP Code',
    // text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
 subject:options.subject,
html:options.html
  };

  await transporter.sendMail(mailOptions);
};

module.exports=sendEmail
  
