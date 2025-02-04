import zxcvbn from 'zxcvbn';

function checkPasswordStrength(password) {
  const result = zxcvbn(password).score * 25;
  return result;
}
function pwdStrengthDescription(password) {
  const result = zxcvbn(password).score;
  let desc = { text: '', color: '' };
  switch (result) {
    case 0:
      desc.text = 'Très Faible';
      desc.color = '#f44336';
      break;
    case 1:
      desc.text = 'Faible';
      desc.color = '#ff5e0e';
      break;
    case 2:
      desc.text = 'Moyen';
      desc.color = '#ff9800';
      break;
    case 3:
      desc.text = 'Fort';
      desc.color = '#8bc34a';
      break;
    case 4:
      desc.text = 'Très Fort';
      desc.color = '#4caf50';
      break;
    default:
      desc.text = 'Erreur';
      desc.color = '#f44336';
      break;
  }

  return desc;
}

export { checkPasswordStrength, pwdStrengthDescription };
