import PropTypes from 'prop-types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { List, Tooltip, Button, Input, AutoComplete } from 'antd';
import { Col } from 'react-bootstrap';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';

import excelOptions from 'config/excelOptions';
export async function downloadExcel(data, options = {}) {
  const { include = [], exclude = [], headers = {}, fileName = 'file' } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  const orderedKeys = Object.keys(headers).filter((key) => (include.length === 0 || include.includes(key)) && !exclude.includes(key));

  const headerRow = orderedKeys.map((key) => headers[key] || key);
  worksheet.addRow(headerRow);

  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  data.forEach((item) => {
    const row = orderedKeys.map((key) => item[key] || '');
    worksheet.addRow(row);
  });

  const columnWidths = [];
  // eslint-disable-next-line no-unused-vars
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell, colIndex) => {
      const cellValue = cell.value ? cell.value.toString() : '';
      const currentWidth = columnWidths[colIndex] || 10;
      columnWidths[colIndex] = Math.min(30, Math.max(currentWidth, cellValue.length + 2));
    });
  });

  worksheet.columns = columnWidths.map((width) => ({ width }));

  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}
export const generateFilterOptions = (data, field) => {
  return [...new Set(data.map((item) => item[field]))]
    .filter((option) => option !== '' && option !== null)
    .sort((a, b) => a.localeCompare(b))
    .map((option) => ({ text: option, value: option }));
};
export const currencyFormatter = (amount, currency = '') => {
  let formattedAmount;
  if (amount && amount > 0) {
    if (currency) {
      formattedAmount = `${amount.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${currency}`;
    } else {
      formattedAmount = amount.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }
  return formattedAmount?.replace(/\u202F/g, ' ');
};
/**
 * Convert a float number to a string representing the same number in words.
 * @param {number} number The number to convert.
 * @param {string} [currency] The currency to use in the output string.
 * @returns {string} The number in words.
 * @example
 * FloatToLetters(123.45, 'euros') // 'cent vingt-trois euros et quarante-cinq centimes.'
 */
export function FloatToLetters(number, currency) {
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
export const TooltipButton = ({ title, icon, onClick, ...props }) => (
  <Tooltip title={title}>
    <Button onClick={onClick} shape="circle" icon={icon} size="large" {...props} />
  </Tooltip>
);
TooltipButton.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.node,
  onClick: PropTypes.func
};
export const renderAutocompleteOptions = (options, config) => {
  const renderMeta = (option) => (
    <List.Item.Meta
      title={
        <div className="d-flex justify-content-between">
          <span className="fw-bold fs-6">{option[config.labelKey]}</span>
          {config.extraFields?.rt && <span className="fs-6">{option[config.extraFields.rt]}</span>}
        </div>
      }
      description={
        <div className="d-flex justify-content-between">
          {config.extraFields?.lb && <div className="fw-bold">{option[config.extraFields.lb]}</div>}
          {config.extraFields?.rb && <div className="fw-bold">{option[config.extraFields.rb]}</div>}
        </div>
      }
    />
  );
  const generateLink = (template, option) => {
    return template.replace(/:(\w+)/g, (_, key) => option[key] || '');
  };

  return options.map((option) => {
    const value = option[config.valueKey] || '';
    const label = (
      <List.Item key={option[config.keyField]}>
        <Link to={generateLink(config.link, option)} className="text-decoration-none">
          {renderMeta(option)}
        </Link>
      </List.Item>
    );

    return { value, label };
  });
};
export const SearchBar = ({ autocompleteOptions, handleSearch, autoCompleteConfig }) => {
  return (
    <Col md={3}>
      <AutoComplete
        options={renderAutocompleteOptions(autocompleteOptions, autoCompleteConfig)}
        onSearch={handleSearch}
        placeholder="Rechercher ..."
        style={{ minWidth: '100%' }}
      >
        <Input.Search placeholder="Rechercher ..." allowClear />
      </AutoComplete>
    </Col>
  );
};
SearchBar.propTypes = {
  autocompleteOptions: PropTypes.array,
  handleSearch: PropTypes.func,
  autoCompleteConfig: PropTypes.object
};
export const ListPageActions = ({ data, dataKey, title, addTitle, CanEdit, addAction, addIcon }) => {
  return (
    <Col className="text-end my-3 d-flex align-items-center justify-content-end" md={18}>
      <TooltipButton
        title={title}
        type="primary"
        className="excel-button"
        icon={<PiMicrosoftExcelLogoFill size={25} />}
        onClick={() => {
          downloadExcel(data, excelOptions[dataKey]);
        }}
      />
      <div className="desktop-only ms-3">
        {CanEdit && <TooltipButton title={addTitle} type="primary" icon={addIcon} onClick={addAction} />}
      </div>
    </Col>
  );
};
ListPageActions.propTypes = {
  data: PropTypes.array,
  dataKey: PropTypes.string,
  title: PropTypes.string,
  addTitle: PropTypes.string,
  CanEdit: PropTypes.bool,
  addAction: PropTypes.func,
  addIcon: PropTypes.node
};
