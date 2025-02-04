const { db } = require("../config");
const nodemailer = require("nodemailer");
const validator = require("validator");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PWD,
  },
});

const emailerHeader = `
<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>CTPC - Notifications</title>
          <style>
            body {
              font-family: Arial, sans-serif;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              background-color: #000000;
            }
            .logo {
              max-width: 100px;
              width: 100px;
              height: auto;
            }
            .content {
              background-color: #ffffff;
            }
            .content-inner {
              padding: 20px;
            }
            .title {
              color: #333333;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .message {
              color: #333333;
              margin-bottom: 20px;
            }
            .button-container {
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #cf2020;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
            }
            .button span {
              mso-border-alt: none;
              border-radius: 5px;
              behavior: url(#default#VML);
            }
            .footer {
              padding: 20px;
              background-color: #333333;
              color: #ffffff;
            }
            .footer p {
              font-size: 12px;
              margin: 0;
            }
          </style>
        </head>
        `;

const emailerBody = (title, notification, link, id, name) => {
  return `
         <body>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" bgcolor="#212631" style="padding: 20px 0">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <img
                        src="https://i.ibb.co/zJQBppR/logoDark.png"
                        alt="logoDark"
                        border="0"
                        width="200"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="content">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td class="content-inner" style="padding: 20px">
                            <h1 class="title">${title}</h1>
                            <p class="message">Bonjour ${name},</p>
                            <p class="message">${notification}</p>
                          </td>
                        </tr>
                        ${
                          link != null && id != null
                            ? `
                        <tr>
                          <td class="button-container" style="text-align: center">
                            <table
                              width="100%"
                              border="0"
                              cellspacing="0"
                              cellpadding="0"
                            >
                              <tr>
                                <td align="center">
                                  <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td
                                        bgcolor="#6261cc"
                                        style="padding: 16px; border-radius: 5px"
                                      >
                                        <a
                                          href="http://ctpc.local:1000/${link}"
                                          target="_blank"
                                          style="
                                            font-size: 16px;
                                            mso-line-height-rule: exactly;
                                            line-height: 16px;
                                            font-family: Arial, Helvetica, sans-serif;
                                            font-weight: 100;
                                            letter-spacing: 0.025em;
                                            color: #ffffff;
                                            text-decoration: none;
                                            display: inline-block;
                                          "
                                          >${id}</a
                                        >
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            <table
                              width="100%"
                              border="0"
                              cellspacing="0"
                              cellpadding="20px"
                            >
                              <tr>
                                <td align="center">
                                  <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td
                                        bgcolor="#2a303d"
                                        style="padding: 16px; border-radius: 5px"
                                      >
                                        <a
                                          href="https://pangolin-legible-visually.ngrok-free.app/${link}"
                                          target="_blank"
                                          style="
                                            font-size: 16px;
                                            mso-line-height-rule: exactly;
                                            line-height: 16px;
                                            font-family: Arial, Helvetica, sans-serif;
                                            font-weight: 100;
                                            letter-spacing: 0.025em;
                                            color: #ffffff;
                                            text-decoration: none;
                                            display: inline-block;
                                          "
                                          >${id}</a
                                        >
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        `
                            : ``
                        }
                        <tr>
                          <td class="content-inner">
                            <p class="message">Bien à vous,</p>
                            <p class="message">Equipe CollaboraNET</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                bgcolor="#333333"
                style="padding: 20px; color: #ffffff"
                width="100%"
              >
                <p style="font-size: 12px">
                  Ce message a été envoyé automatiquement. Veuillez ne pas répondre
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>      
        `;
};

async function sendEmail(
  receiver,
  title,
  notification,
  link,
  id,
  name = "Utilisateur"
) {
  try {
    if (!validator.isEmail(receiver)) {
      console.error("Adresse email invalide");
      return false;
    }
    const mailOptions = {
      from: "Notifications CollaboraNET<hadidoine@ctpc.ma>",
      to: receiver,
      subject: title,
      html: emailerHeader + emailerBody(title, notification, link, id, name),
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error.message);
    return false;
  }
}
async function sendNotificationAndEmail(userid, title, notification, link, id) {
  try {
    const user = await db("au_users")
      .where({ user_id: userid })
      .select(
        "user_email",
        "user_first_name",
        "user_is_absent",
        "user_is_active",
        "user_receive_email",
        "user_id"
      )
      .first();

    if (!user || user.user_is_active !== 1) {
      return;
    }

    if (user.user_is_absent) {
      const fillInUser = await db("au_users")
        .where("user_del_for", user.user_id)
        .select("user_email", "user_first_name", "user_id")
        .first();

      if (fillInUser) {
        user.user_email = fillInUser.user_email;
        user.user_first_name = fillInUser.user_first_name;
        user.user_id = fillInUser.user_id;
      } else {
        return;
      }
    }

    await db("au_notifications").insert({
      notification_title: title,
      notification_text: notification,
      notification_timestamp: new Date(),
      notification_link: link,
      notification_is_read: 0,
      notification_fk_user_id: user.user_id,
    });

    if (process.env.NODE_ENV === "development") {
      return;
    }
    if (!user.user_receive_email) {
      return;
    }
    sendEmail(
      user.user_email,
      title,
      notification,
      link,
      id,
      user.user_first_name
    );
  } catch (error) {
    console.error("Error sending notification and email:", error);
  }
}

const welcomeEmail = (receiver) => {
  return `
 <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>CTPC - Notifications</title>
          <style>
            body {
              font-family: Arial, sans-serif;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              background-color: #000000;
            }
            .logo {
              max-width: 100px;
              width: 100px;
              height: auto;
            }
            .content {
              background-color: #ffffff;
            }
            .content-inner {
              padding: 20px;
            }
            .title {
              color: #333333;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .message {
              color: #333333;
              margin-bottom: 20px;
            }
            .button-container {
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #cf2020;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
            }
            .button span {
              mso-border-alt: none;
              border-radius: 5px;
              behavior: url(#default#VML);
            }
            .footer {
              padding: 20px;
              background-color: #333333;
              color: #ffffff;
            }
            .footer p {
              font-size: 12px;
              margin: 0;
            }
          </style>
        </head>
        <body>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td>
                <table class="container">
                  <tr>
                    <td class="header">
                      <img src="https://i.ibb.co/zJQBppR/logoDark.png" alt="collaboranet" class="logo" />
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <table class="content-inner">
                        <tr>
                          <td class="title">Bienvenue sur CollaboraNET</td>
                        </tr>
                        <tr>
                          <td class="message">Bonjour ${receiver},</td>
                        </tr>
                        <tr>
                          <td class="message">Votre compte CollaboraNET a été créé avec succès.</td>
                        </tr>
                        <tr>
                          <td class="button-container">
                            <a href=${process.env.APP_LINK} class="button">
                              <span>Se connecter</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">

                      <p>Ce message a été envoyé automatiquement. Veuillez ne pas répondre</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
        `;
}


module.exports = { sendEmail, sendNotificationAndEmail };
