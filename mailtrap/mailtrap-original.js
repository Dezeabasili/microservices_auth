const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv").config();

const TOKEN = process.env.MAILTRAP_TOKEN

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: "support.team@meridian-hosts.com",
  name: "Support Team",
};
const recipients = [
  {
    email: "dezeabasili@gmail.com",
  }
];

client
  .send({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  .then(console.log, console.error);