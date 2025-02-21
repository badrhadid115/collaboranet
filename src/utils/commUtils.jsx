import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Tooltip, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

import { currencyFormatter } from 'utils/genUtils';
export const renderMontant = (devis_total_ht, record) => {
  if (!devis_total_ht) {
    return <span className="text-warning">Non Défini</span>;
  }

  return (
    <>
      <span>{currencyFormatter(devis_total_ht, 'DH')}</span>
      {record.devis_tax > 0 && (
        <>
          <br />
          <span className="text-muted">{currencyFormatter(record.devis_total_ttc, 'DH')} TTC</span>
        </>
      )}
    </>
  );
};

export const renderDevis = (text, record) => {
  return <Link to={`/devis/${record.devis_full_id}/${record.devis_version}`}>{text}</Link>;
};
const statusMap = {
  Créée: {
    icon: <ClockCircleOutlined style={{ color: '#fefefe' }} />,
    text: 'Créée',
    className: 'bg-warning'
  },
  Déposée: {
    icon: <FileDoneOutlined style={{ color: '#fefefe' }} />,
    text: 'Déposée',
    className: 'bg-info'
  },
  Réglée: {
    icon: <CheckCircleOutlined style={{ color: '#fefefe' }} />,
    text: 'Réglée',
    className: 'bg-success'
  }
};

export const InvoiceStatus = ({ status }) => {
  const statusInfo = statusMap[status] || {};
  return (
    <Tooltip title={statusInfo.text || 'Status Inconnu'}>
      <div
        className={`d-flex align-items-center justify-content-center rounded-circle p-1 mr-5 ${statusInfo.className}`}
        style={{
          width: '25px',
          height: '25px',
          color: 'white',
          fontSize: '15px'
        }}
      >
        {statusInfo.icon}
      </div>
    </Tooltip>
  );
};

InvoiceStatus.propTypes = {
  status: PropTypes.string.isRequired
};

const conformityMap = {
  'N/A': {
    icon: <MinusCircleOutlined />,
    text: 'N/A',
    className: 'bg-secondary'
  },
  Conforme: {
    icon: <CheckCircleOutlined />,
    text: 'Conforme',
    className: 'bg-success'
  },
  'Non Conforme': {
    icon: <CloseCircleOutlined />,
    text: 'Non Conforme',
    className: 'bg-danger'
  }
};
export const ConformityStatus = ({ status }) => {
  const statusInfo = conformityMap[status] || {};

  return (
    <Tooltip title={statusInfo.text || 'Status Inconnu'}>
      <div
        className={`d-flex align-items-center justify-content-center rounded-circle ${statusInfo.className}`}
        style={{
          width: '25px',
          height: '25px',
          color: 'white',
          fontSize: '15px'
        }}
      >
        {statusInfo.icon}
      </div>
    </Tooltip>
  );
};

ConformityStatus.propTypes = {
  status: PropTypes.string.isRequired
};

export function NumberToLetters(number, currency = '') {
  if (number < 0 || number > 999999999.99) {
    return '##ERROR##';
  }
  const letter = {
    0: 'zéro',
    1: 'un',
    2: 'deux',
    3: 'trois',
    4: 'quatre',
    5: 'cinq',
    6: 'six',
    7: 'sept',
    8: 'huit',
    9: 'neuf',
    10: 'dix',
    11: 'onze',
    12: 'douze',
    13: 'treize',
    14: 'quatorze',
    15: 'quinze',
    16: 'seize',
    17: 'dix-sept',
    18: 'dix-huit',
    19: 'dix-neuf',
    20: 'vingt',
    30: 'trente',
    40: 'quarante',
    50: 'cinquante',
    60: 'soixante',
    70: 'soixante-dix',
    80: 'quatre-vingt',
    90: 'quatre-vingt-dix'
  };

  const convertLessThan100 = (num) => {
    if (num <= 20) return letter[num];
    const unit = num % 10;
    const ten = Math.floor(num / 10) * 10;
    if (num < 70 || (num > 79 && num < 90)) {
      return unit === 0 ? letter[ten] : `${letter[ten]}-${letter[unit]}`;
    } else {
      return `${letter[ten - 10]}-${letter[10 + unit]}`;
    }
  };

  const convertToLetters = (num) => {
    if (num === 0) return letter[0];

    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const rest = num % 100;

    let result = '';

    if (billion > 0) {
      result += billion === 1 ? 'un milliard ' : `${convertToLetters(billion)} milliards `;
    }

    if (million > 0) {
      result += million === 1 ? 'un million ' : `${convertToLetters(million)} millions `;
    }

    if (thousand > 0) {
      result += thousand === 1 ? 'mille ' : `${convertToLetters(thousand)} mille `;
    }

    if (hundred > 0) {
      result += hundred === 1 ? 'cent ' : `${letter[hundred]} cents `;
    }

    if (rest > 0) {
      result += convertLessThan100(rest);
    }

    return result.trim();
  };

  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);

  let result = convertToLetters(integerPart) + ' ' + currency;

  if (decimalPart > 0) {
    result += ' et ' + convertToLetters(decimalPart) + ' centimes';
  }

  return result + '.';
}

export const DevisProgressBar = ({ currentStep, status, steps, error }) => {
  const texts = {
    0: 'Archivé',
    8: 'Accepté',
    9: 'Facturé'
  };
  const textColors = {
    0: 'text-danger fw-bold',
    8: 'text-success fw-bold',
    9: 'text-info fw-bold'
  };
  if (texts[status]) {
    return <span className={textColors[status]}>{texts[status]}</span>;
  }
  const percentage = ((status + 1) / steps) * 100;
  if (status === 0) {
    return <span className={'text-danger'}>{currentStep}</span>;
  }
  if (status === steps - 1) {
    return <span className={'text-success'}>{currentStep}</span>;
  }
  if (status === steps) {
    return <span className={'text-info'}>{currentStep}</span>;
  }
  const strokeColor = (status) => {
    let initialColors = [];
    for (let i = 0; i < status; i++) {
      initialColors.push('#52c41a');
    }
    initialColors.push('#1890ff');
    for (let i = status + 1; i < steps; i++) {
      initialColors.push('#bfbfbf');
    }
    if (error) {
      initialColors[status] = '#f5222d';
    }
    return initialColors;
  };
  const textColor = error ? 'text-danger' : '';
  return (
    <div className="d-flex flex-column text-center justify-content-center align-items-center">
      <span className={textColor}>{currentStep}</span>
      <Progress percent={percentage} steps={steps} showInfo={false} size={[10, 5]} strokeColor={strokeColor(status)} />
    </div>
  );
};
DevisProgressBar.propTypes = {
  currentStep: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
  steps: PropTypes.number.isRequired,
  error: PropTypes.bool
};
