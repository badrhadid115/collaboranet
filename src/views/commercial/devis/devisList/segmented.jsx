import PropTypes from 'prop-types';
import { Col, Row } from 'react-bootstrap';
import { Segmented, Select } from 'antd';
import { HiMiniArchiveBoxXMark } from 'react-icons/hi2';
import { TbProgressCheck } from 'react-icons/tb';
import { MdOutgoingMail, MdLibraryAddCheck } from 'react-icons/md';
import { HiDatabase } from 'react-icons/hi';

function DevisSegmented({ onStatusChange, value }) {
  const options = [
    {
      label: (
        <span className="d-flex align-items-center justify-content-center gap-2">
          <HiMiniArchiveBoxXMark /> Archivé
        </span>
      ),
      value: 'archived'
    },
    {
      label: (
        <span className="d-flex align-items-center justify-content-center gap-2">
          <TbProgressCheck /> En validation
        </span>
      ),
      value: 'inprogress'
    },
    {
      label: (
        <span className="d-flex align-items-center justify-content-center gap-2">
          <MdOutgoingMail /> Envoyé
        </span>
      ),
      value: 'sent'
    },
    {
      label: (
        <span className="d-flex align-items-center justify-content-center gap-2">
          <MdLibraryAddCheck /> Accepté
        </span>
      ),
      value: 'accepted'
    },
    {
      label: (
        <span className="d-flex align-items-center justify-content-center gap-2">
          <HiDatabase /> Tous
        </span>
      ),
      value: 'all'
    }
  ];

  const handleStatusChange = (value) => {
    onStatusChange(value);
  };

  return (
    <Row className="my-3 align-items-center">
      <Col lg={6} md={6} sm={6} xs={12}>
        <div className="desktop-only">
          <Segmented options={options} block value={value} onChange={handleStatusChange} />
        </div>
        <div className="mobile-only">
          <span className="fw-bold">Statut</span>
          <Select
            options={options}
            value={value}
            style={{ width: '100%' }}
            onChange={handleStatusChange}
            placeholder="Filtrer par statut"
          />
        </div>
      </Col>
    </Row>
  );
}

export default DevisSegmented;

DevisSegmented.propTypes = {
  onStatusChange: PropTypes.func,
  value: PropTypes.string
};
