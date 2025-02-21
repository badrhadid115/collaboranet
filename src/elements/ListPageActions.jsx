import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Dropdown, Tooltip } from 'antd';
import { Col } from 'react-bootstrap';
import { TooltipButton } from './TooltipButton';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { TiDocumentAdd } from 'react-icons/ti';
import { IoIosList } from 'react-icons/io';
import { ImFileText2 } from 'react-icons/im';
import { downloadExcel } from 'utils/genUtils';
import excelOptions from 'config/excelOptions';
const items = [
  {
    key: '1',
    label: (
      <Link to="/saisir-devis/devis-standard">
        <div className="d-flex align-items-center">
          <IoIosList size={18} className="me-1" /> <span>Devis Standard</span>
        </div>
      </Link>
    )
  },
  {
    key: '2',
    label: (
      <Link to="/saisir-devis/devis-format-libre">
        <div className="d-flex align-items-center">
          <ImFileText2 size={16} className="me-1" /> <span>Devis Format Libre</span>
        </div>
      </Link>
    )
  }
];
const DevisAddButton = () => {
  return (
    <Tooltip title="Saisir un devis">
      <Dropdown
        menu={{
          items
        }}
      >
        <TooltipButton title="Saisir un devis" type="primary" icon={<TiDocumentAdd size={25} />} />
      </Dropdown>
    </Tooltip>
  );
};
export const ListPageActions = ({ data, dataKey, title, addTitle, CanEdit, addAction, addIcon, devis }) => {
  return (
    <Col className="text-end d-flex align-items-center justify-content-end" md={8} sm={6} xs={12}>
      <TooltipButton
        title={title}
        type="primary"
        className="excel-button desktop-only"
        icon={<PiMicrosoftExcelLogoFill size={25} />}
        onClick={() => {
          downloadExcel(data, excelOptions[dataKey]);
        }}
      />
      {CanEdit &&
        (devis ? (
          <div className="desktop-only devis-menu ms-3">
            <DevisAddButton />
          </div>
        ) : (
          <div className="desktop-only ms-3">
            <TooltipButton title={addTitle} type="primary" icon={addIcon} onClick={addAction} />
          </div>
        ))}
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
  addIcon: PropTypes.node,
  devis: PropTypes.bool
};
