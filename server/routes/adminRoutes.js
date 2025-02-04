// ======================================================================
// SECTION: NPM MODULES
// ======================================================================
const express = require('express');
const router = express.Router();
const validator = require('validator');
// ======================================================================
// SECTION: LOCAL MODULES
// ======================================================================
const { db } = require('../config');
const { checkRole } = require('../middleware');
const messages = require('../messages');
// ======================================================================
// SECTION: ROUTES
// ======================================================================
// Get All Users
router.get('/users', checkRole('Super Admin'), async (req, res) => {
  try {
    const users = await db('users').orderBy('user_full_name');
    const permissions = await db('permissions');
    users.forEach((user) => {
      user.permissions = permissions.filter((permission) => permission.role_id === user.role_id);
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
// Add a new User
router.post('/users', checkRole('Super Admin'), async (req, res) => {
  //received data: first_name, last_name, email, random password, role_id
  try {
    const { first_name, last_name, email, role_id } = req.body;
    if (!first_name || !last_name || !email || !role_id) {
      console.error('Missing required fields');
      return res.status(400).json(messages.Error400);
    }
    if (!validator.isEmail(email)) {
      console.error('Invalid email address');
      return res.status(400).json(messages.Error400);
    }
    await db('au_users').insert({
      user_first_name: first_name,
      user_last_name: last_name,
      user_email: email,
      user_fk_role_id: role_id
    });
    res.status(201).json(messages.Success201);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
// Get All Roles
router.get('/roles', checkRole('Super Admin'), async (req, res) => {
  try {
    const roles = await db('au_roles').orderBy('role_name');
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
// Get All Permissions
router.get('/permissions', checkRole('Super Admin'), async (req, res) => {
  try {
    const permissions = await db('au_permissions').orderBy('permission_name');
    res.status(200).json(permissions);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
//Get Activity Log last 30 days
router.get('/activity-log', checkRole('Super Admin'), async (req, res) => {
  try {
    const activityLog = await db.transaction(async (trx) => {
      const result = await trx
        .select(
          'w_activity_log.*',
          db.raw("DATE_FORMAT(w_activity_log.timestamp, '%d/%m/%Y %H:%i:%s') as timestamp"),
          'w_users.user_full_name',
          'w_users.user_profile_pic'
        )
        .from('w_activity_log')
        .join('w_users', 'w_activity_log.user_id', 'w_users.user_id')
        .where('w_activity_log.timestamp', '>', db.raw('CURRENT_DATE - INTERVAL 30 DAY'))
        .orderBy('w_activity_log.timestamp', 'desc');
      return result;
    });
    res.status(200).json(activityLog);
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ error: 'An error occurred while fetching the activity log.' });
  }
});

// Get All Login Attempts
router.get('/login-attempts', checkRole('Super Admin'), async (req, res) => {
  try {
    const loginAttempts = await db.transaction(async (trx) => {
      const result = await trx
        .select(
          'w_login_attempts.*',
          db.raw("DATE_FORMAT(w_login_attempts.login_attempt_date, '%d/%m/%Y %H:%i:%s') as login_attempt_date"),
          'w_users.user_full_name',
          'w_users.user_profile_pic'
        )
        .from('w_login_attempts')
        .leftJoin('w_users', 'w_login_attempts.login_attempt_user', 'w_users.user_username')
        .where('w_login_attempts.login_attempt_date', '>', db.raw('CURRENT_DATE - INTERVAL 30 DAY'))
        .orderBy('w_login_attempts.login_attempt_date', 'desc');
      return result;
    });
    res.status(200).json(loginAttempts);
  } catch (err) {
    console.error('Error fetching login attempts:', err);
    res.status(500).json({ error: 'An error occurred while fetching the login attempts.' });
  }
});

module.exports = router;
