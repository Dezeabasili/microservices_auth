const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv").config();

const TOKEN = process.env.MAILTRAP_TOKEN

const sendmail = async (customer_email, email_subject, email_template, email_category) => {
    const client = new MailtrapClient({
        token: TOKEN,
      });
      
      const sender = {
        email: "support.team@meridian-hosts.com",
        name: "Support Team",
      };
      const recipients = [
        {
          email: customer_email,
        }
      ];

      try {
        await client.send({
                from: sender,
                to: recipients,
                subject: email_subject,
                html: email_template,
                category: email_category,
            })
            
      } catch (error) {
        throw new Error(`Error sending welcome email: ${error}`);
      }

}

module.exports = sendmail
