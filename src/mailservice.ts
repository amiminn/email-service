import { createTransport } from "nodemailer";
import { SMTPHOST, SMTPPASS, SMTPPORT, SMTPUSER } from "./config";

export function sendMailSMTP({ name, to, subject, content }: MailType) {
  const mainSmtp = smtpService;
  const transporter = createTransport(mainSmtp);

  const mailOptions = {
    from: {
      name: name,
      address: SMTPUSER,
    },
    to,
    subject: subject ?? "kosong",
    html: `${content}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return error;
    } else {
      console.log("Email sent: " + info.response);
      return info.response;
    }
  });
}

const smtpService = {
  host: SMTPHOST,
  port: SMTPPORT,
  auth: {
    user: SMTPUSER,
    pass: SMTPPASS,
  },
};

interface MailType {
  name: string;
  to: string;
  subject: string;
  content: string;
}
