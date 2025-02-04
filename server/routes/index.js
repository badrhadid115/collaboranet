const express = require('express');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const commRoutes = require('./commRoutes');
const laboRoutes = require('./laboRoutes');
/*const homeRoutes = require("./homeRoutes");


const driveRoutes = require("./driveRoutes");

const finRoutes = require("./finRoutes");
const otherRoutes = require("./otherRoutes");*/

const router = express.Router();

// Group routes with prefixes
router.use('/', authRoutes);
router.use('/admin', adminRoutes);
router.use('/comm', commRoutes);
router.use('/labo', laboRoutes);
/*router.use("/", homeRoutes);


router.use("/drive", driveRoutes);

router.use("/fin", finRoutes);
router.use("/", otherRoutes);*/

module.exports = router;
