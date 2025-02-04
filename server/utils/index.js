const os = require('os');
const crypto = require('crypto');
const { sendEmail, sendNotificationAndEmail } = require('./emailer');
const { GetNextMethodFullId, GetNextLabTestFullId, GetNextDevisFullId, GetNextInvoiceFullId } = require('./getIDs');
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    for (const info of interfaceInfo) {
      if (!info.internal && info.family === 'IPv4') {
        return info.address;
      }
    }
  }
  return '127.0.0.1';
}
async function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  sendEmail,
  sendNotificationAndEmail,
  getLocalIpAddress,
  generateRandomToken,
  GetNextMethodFullId,
  GetNextLabTestFullId,
  GetNextDevisFullId,
  GetNextInvoiceFullId
};
