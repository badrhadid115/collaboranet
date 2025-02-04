// ======================================================================
// SECTION: NPM MODULES
// ======================================================================
const express = require('express');
const session = require('express-session');
const validator = require('validator');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const argon2 = require('argon2');
const sharp = require('sharp');
const fs = require('fs');
const router = express.Router();
const path = require('path');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/fr');
dayjs.extend(relativeTime);
dayjs.locale('fr');
// ======================================================================
// SECTION: LOCAL MODULES
// ======================================================================
const { db, connection } = require('../config');
const { upload, rateLimitAuth } = require('../middleware');
const { sendNotificationAndEmail, sendEmail, generateRandomToken } = require('../utils');
const notifications = require('../notifications');
const messages = require('../messages');
//======================================================================
// SECTION: SESSION CONFIGURATION
//======================================================================
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données: ' + err.stack);
  }
});

const sessionStore = new MySQLStore(
  {
    expiration: 604800000,
    createDatabaseTable: true,
    schema: {
      tableName: 'au_sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
      }
    }
  },
  connection
);

router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 604800000
    }
  })
);
router.use(passport.initialize());
router.use(passport.session());

//======================================================================
// SECTION: ROUTES
//======================================================================
// Password reset request
router.post('/req-pwd-reset', rateLimitAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db('au_users').where('user_email', email).select('*').first();

    if (user && user.user_is_blocked !== 1 && user.user_is_active === 1) {
      if (user.user_email && validator.isEmail(user.user_email)) {
        const token = await generateRandomToken();
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 1);

        await db('au_pwdreset').insert({
          reset_token: token,
          reset_fk_user_id: user.user_id,
          reset_expiration: expirationTime
        });

        const { title, content } = notifications.pwdReset;
        const link = notifications.pwdReset.link(token);
        await sendEmail(user.user_email, title, content, link, 'Réinitialiser le mot de passe', user.user_first_name);
      }
    }

    return res.status(200).json({
      message:
        "Si l'email ou le nom d'utilisateur est associé à un compte, vous recevrez un email avec des instructions pour réinitialiser votre mot de passe."
    });
  } catch (err) {
    console.error('Error in password reset:', err);

    return res.status(500).json({
      message: 'Une erreur est survenue. Veuillez réessayer plus tard.'
    });
  }
});

// Password reset token verification
router.get('/verify-token', rateLimitAuth, async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({
        message: 'Le jeton est requis'
      });
    }

    const user = await db('au_pwdreset')
      .select('au_users.user_first_name', 'au_pwdreset.reset_expiration')
      .join('au_users', 'au_pwdreset.reset_fk_user_id', 'au_users.user_id')
      .where('au_pwdreset.reset_token', token)
      .first();
    if (!user) {
      return res.status(404).json({
        message: 'Le jeton est invalide'
      });
    }

    const expirationTime = new Date(user.reset_expiration);
    console.log(expirationTime);
    if (isNaN(expirationTime)) {
      return res.status(400).json({
        message: 'Le jeton est invalide'
      });
    }

    const currentTime = new Date();
    if (currentTime > expirationTime) {
      return res.status(401).json({
        message: 'Le jeton a expiré'
      });
    }

    res.status(200).json({
      message: 'Le jeton est valide'
    });
  } catch (error) {
    console.error('Une erreur est survenue lors de la vérification du jeton:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la vérification du jeton'
    });
  }
});

// Password reset
router.put('/reset-pwd', rateLimitAuth, async (req, res) => {
  const trx = await db.transaction();

  try {
    const { token, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return res.status(400).json(messages.pwdMismatch);
    }

    const user = await trx('au_pwdreset')
      .select('au_users.user_first_name', 'au_users.user_id', 'au_pwdreset.reset_expiration')
      .join('au_users', 'au_pwdreset.reset_fk_user_id', 'au_users.user_id')
      .where('au_pwdreset.reset_token', token)
      .first();

    if (!user) {
      return res.status(404).json(messages.LinkNotFound);
    }

    const expirationTime = new Date(user.reset_expiration);
    const currentTime = new Date();

    if (currentTime > expirationTime) {
      return res.status(401).json(messages.LinkExpired);
    }

    const newPasswordHashed = await argon2.hash(new_password);

    await trx('au_users').where('user_id', user.user_id).update({ user_argon_password: newPasswordHashed });

    await trx('au_sessions').where('data', 'like', `%passport":{"user":${user.user_id}}%`).del();
    await trx('au_pwdreset').where('reset_token', token).del();

    await trx.commit();

    const title = notifications.pwdResetSuccess.title;
    const notification = notifications.pwdResetSuccess.content;
    sendNotificationAndEmail(user.user_id, title, notification, null, null);

    res.status(201).json(messages.pwdResetSuccess);
  } catch (error) {
    await trx.rollback();

    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json(messages.serverError);
  }
});

// Passport configuration
passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true,
      username: 'user_username',
      password: 'user_argon_password'
    },
    async (_, username, password, done) => {
      try {
        const ip = _.headers['x-forwarded-for'] || _.socket.remoteAddress;
        const userAgent = _.headers['user-agent'];
        await db('au_login_attempts').insert({
          login_attempt_ip: ip,
          login_attempt_date: new Date(),
          login_attempt_user: username,
          login_attempt_user_agent: userAgent
        });
        const user = await db('au_users')
          .where('user_username', username)
          .orWhere('user_email', username)
          .select('user_id', 'user_first_name', 'user_is_blocked', 'user_is_active', 'user_login_attempts', 'user_argon_password')
          .first();

        if (!user) {
          return done(null, false, {
            message: "Nom d'utilisateur ou adresse email invalide"
          });
        }
        if (user.user_is_active === 0 || user.user_is_blocked === 1) {
          return done(null, false, {
            message: 'Ce compte est bloqué ou inactif'
          });
        }
        const passwordMatch = await argon2.verify(user.user_argon_password, password);
        if (!passwordMatch) {
          const updatedAttempts = user.user_login_attempts + 1;
          await db('au_users').where('user_id', user.user_id).update({ user_login_attempts: updatedAttempts });

          if (updatedAttempts >= 3) {
            await db('au_users').where('user_id', user.user_id).update({ user_is_blocked: 1 });

            const title = notifications.blockedAccount.title;
            const notification = notifications.blockedAccount.content;
            sendNotificationAndEmail(user.user_id, title, notification, null, null);
          }
          return done(null, false, {
            message: `Mauvais mot de passe. ${4 - updatedAttempts} tentatives restantes`
          });
        }

        await db('au_users').where('user_id', user.user_id).update({ user_login_attempts: 0 });

        const title = notifications.LoginAttempt.title;
        const notification = notifications.LoginAttempt.content;
        sendNotificationAndEmail(user.user_id, title, notification, null, null);

        return done(null, user);
      } catch (err) {
        console.error(err);
        return done(null, false, {
          message: 'Une erreur est survenue lors de la connexion'
        });
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});
async function getPermissions(db, roleId, userId) {
  const query = `
    SELECT DISTINCT p.permission_name
    FROM au_permissions p
    JOIN au_rp_mapping rpm ON p.permission_id = rpm.rp_permission_id
    WHERE rpm.rp_role_id = ?
    UNION
    SELECT DISTINCT p.permission_name
    FROM au_permissions p
    JOIN au_up_mapping upm ON p.permission_id = upm.up_permission_id
    WHERE upm.up_user_id = ?;
  `;
  const results = await db.raw(query, [roleId, userId]);
  return results[0].map((row) => row.permission_name);
}
async function getReplacedUser(db, replacedUserId) {
  const query = `
    SELECT u.*, r.*
    FROM au_users u
    JOIN au_roles r ON u.user_fk_role_id = r.role_id
    WHERE u.user_id = ?;
  `;
  const results = await db.raw(query, [replacedUserId]);
  return results[0][0] || null;
}

passport.deserializeUser(async (id, done) => {
  try {
    const userQuery = `
     SELECT u.*, r.*, 
        DATE_FORMAT(MAX(ala.login_attempt_date), '%d/%m/%Y %H:%i:%s') AS lastLogin
        FROM au_users u
        JOIN au_roles r ON u.user_fk_role_id = r.role_id
        LEFT JOIN au_login_attempts ala ON ala.login_attempt_user = u.user_username
        WHERE u.user_id = ?
        GROUP BY u.user_id, r.role_id;
    `;
    const userResults = await db.raw(userQuery, [id]);
    const user = userResults[0][0];

    if (!user) {
      return done(null, false, { message: "Nom d'utilisateur incorrect." });
    }
    if (user.user_is_blocked === 1 || user.user_is_active === 0) {
      return done(null, false, {
        message: "Utilisateur bloqué. Contactez l'administrateur."
      });
    }

    user.permissions = await getPermissions(db, user.user_fk_role_id, user.user_id);
    user.role = user.role_name;

    if (user.user_del_for !== 0) {
      const replacedUser = await getReplacedUser(db, user.user_del_for);
      if (replacedUser && replacedUser.user_is_absent === 1) {
        const replacedPermissions = await getPermissions(db, replacedUser.user_fk_role_id, replacedUser.user_id);
        user.permissions = [...new Set([...user.permissions, ...replacedPermissions])];
        user.replacedUserRole = replacedUser.role_name;
        user.replacedUserId = replacedUser.user_id;
      }
    }

    delete user.user_argon_password;

    return done(null, user);
  } catch (err) {
    console.error("Erreur lors de la désérialisation de l'utilisateur:", err);
    return done(null, false, { type: 'server-error', name: '' });
  }
});

// Login
router.post('/login', rateLimitAuth, async (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json(info);
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        message: 'Connexion réussie, nous allons vous rediriger vers la page principale'
      });
    });
  })(req, res, next);
});

// Auth check
router.get('/auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json(messages.Error401);
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    req.logout(req.user, function (err) {
      if (err) {
        console.log('error', err);
        return next(err);
      }
    });
  } catch (err) {
    console.log('Erreur de déconnexion', err);
  }
  res.redirect('/');
});

// Change password
router.put('/change-pwd', rateLimitAuth, async (req, res) => {
  const trx = await db.transaction();
  try {
    const { old_password, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      await trx.rollback();
      return res.status(400).json(messages.pwdMismatch);
    }

    const user = await trx('au_users').where('user_id', req.user.user_id).select('*').first();

    const match = await argon2.verify(user.user_argon_password, old_password);
    if (!match) {
      await trx.rollback();
      return res.status(401).json(messages.WrongPwd);
    }

    const newPasswordHashed = await argon2.hash(new_password);

    const title = notifications.ChangePwd.title;
    const notification = notifications.ChangePwd.content;
    sendNotificationAndEmail(req.user.user_id, title, notification, null, null);

    await trx('au_sessions').where('data', 'like', `%passport":{"user":${req.user.user_id}}%`).del();

    await trx('au_users').where('user_id', req.user.user_id).update({ user_argon_password: newPasswordHashed });

    await trx.commit();

    res.status(200).json(messages.ChangePwd);
  } catch (err) {
    await trx.rollback();
    console.error('Erreur lors du changement du mot de passe:', err);
    return res.status(500).json(messages.serverError);
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  const user_id = req.user?.user_id;

  try {
    const notificationsPromise = db('au_notifications')
      .select('*', db.raw("DATE_FORMAT(notification_timestamp, '%d/%m/%Y %H:%i:%s') as notification_time"))
      .where('notification_fk_user_id', user_id)
      .orderBy('notification_id', 'desc');

    const unreadCountPromise = db('au_notifications')
      .count({ count: '*' })
      .where({
        notification_fk_user_id: user_id,
        notification_is_read: 0
      })
      .first();

    const [notifications, unreadCountResult] = await Promise.all([notificationsPromise, unreadCountPromise]);

    const unreadCount = unreadCountResult.count > 99 ? '+99' : unreadCountResult.count;

    notifications.forEach((notification) => {
      notification.notification_distance = dayjs(notification.notification_timestamp).fromNow();
    });

    res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des notifications:', err);
    res.status(500).json(messages.serverError);
  }
});
// Mark all notifications as read
router.put('/notifications', async (req, res) => {
  const user_id = req.user?.user_id;
  try {
    if (!user_id) {
      return res.status(400).json(messages.Error400);
    }
    await db('au_notifications')
      .where({
        notification_fk_user_id: user_id,
        notification_is_read: 0
      })
      .update({ notification_is_read: 1 });

    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Change profile picture
router.post('/profilepicture', upload.single('profilePicture'), async (req, res) => {
  const trx = await db.transaction();
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json(messages.NoPhoto);
    }
    const filePath = path.join(__dirname, '../../uploads/PP', file.filename);

    const webpImageBuffer = await sharp(file.path).resize({ width: 500 }).webp({ quality: 80 }).toBuffer();

    fs.writeFileSync(filePath, webpImageBuffer, 'binary');

    const user = await trx('au_users').where('user_id', req.user.user_id).select('user_profile_pic').first();

    fs.unlinkSync(file.path);

    if (user?.user_profile_pic) {
      const oldPicPath = path.join(__dirname, '../', user.user_profile_pic);
      if (fs.existsSync(oldPicPath)) {
        fs.unlinkSync(oldPicPath);
      }
    }

    const relativePath = `/uploads/PP/${file.filename}`;
    await trx('au_users').where('user_id', req.user.user_id).update({ user_profile_pic: relativePath });

    await trx.commit();

    res.json({ url: relativePath });
  } catch (err) {
    await trx.rollback();
    console.error('Erreur lors de la modification de la photo de profil:', err);
    res.status(500).json(messages.serverError);
  }
});

// Delete profile picture
router.delete('/profilepicture', async (req, res) => {
  const trx = await db.transaction();
  try {
    const user = await trx('au_users').where('user_id', req.user.user_id).select('user_profile_pic').first();

    if (user?.user_profile_pic) {
      const picPath = path.join(__dirname, '../', user.user_profile_pic);

      if (fs.existsSync(picPath)) {
        fs.unlinkSync(picPath);
      }
    }

    await trx('au_users').where('user_id', req.user.user_id).update({ user_profile_pic: null });

    await trx.commit();
    res.status(204).json(messages.DeletePP);
  } catch (err) {
    await trx.rollback();
    console.error('Erreur lors de la suppression de la photo de profil:', err);
    res.status(500).json(messages.serverError);
  }
});

//TODO: GET badges

module.exports = router;
