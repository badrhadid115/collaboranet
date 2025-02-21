import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Tooltip, Table, Empty, List } from 'antd';
import VirtualList from 'rc-virtual-list';
import { RiUserStarFill } from 'react-icons/ri';
import { HiReceiptTax } from 'react-icons/hi';
import { FaEdit } from 'react-icons/fa';
import { generateFilterOptions } from 'utils/genUtils';
import { TooltipButton } from 'elements/TooltipButton';
const getFilterOptions = (data) => ({
  sector_name: generateFilterOptions(data, 'sector_name'),
  client_type_name: generateFilterOptions(data, 'client_type_name'),
  client_name: [
    { text: 'Membre du CA', value: 'CA' },
    { text: 'Exonéré du TVA', value: 'HT' }
  ]
});

const getFilters = {
  client_name: (value, record) => {
    if (value === 'CA') return record.client_is_ca === 1;
    if (value === 'HT') return record.client_is_ht === 1;
    return true;
  },
  sector_name: (value, record) => (value ? record.sector_name === value : true),
  client_type_name: (value, record) => (value ? record.client_type === value : true)
};

const renderIconColumn = (_, record) => {
  if (record.client_is_ca === 1) return <RiUserStarFill size={20} color="#D4AF37" />;
  if (record.client_is_ht === 1) return <HiReceiptTax size={20} color="#89CFF0" />;
  return null;
};

const renderClientNameColumn = (text) => (
  <Tooltip title={text}>
    <Link to={`./${text}`} className="text-decoration-none">
      {text}
    </Link>
  </Tooltip>
);
const renderClientPersonColumn = (text, record) =>
  text ? (
    <>
      <span>{text}</span>
      {record.client_function && (
        <>
          <br />
          <small>{record.client_function}</small>
        </>
      )}
    </>
  ) : (
    <i className="text-warning">Non Défini</i>
  );
const renderEditColumn = (text, record, setEditItem, handleShowEditModal) => (
  <div className="d-flex">
    <TooltipButton
      title="Modifier"
      type="secondary"
      icon={<FaEdit />}
      onClick={() => {
        setEditItem(record.client_id);
        handleShowEditModal();
      }}
    />
  </div>
);
const renderTexts = (text) => text || <i className="text-warning">Non Défini</i>;
const getColumns = (data, CanEdit, setEditItem, handleShowEditModal) => {
  const filterOptions = getFilterOptions(data);

  const columns = [
    { title: '', dataIndex: 'client_is_ca', key: 'client_is_ca', width: 60, render: renderIconColumn },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      ellipsis: true,
      width: 250,
      filters: filterOptions.client_name,
      onFilter: getFilters.client_name,
      render: renderClientNameColumn
    },
    {
      title: 'Personne de Contact',
      dataIndex: 'client_person',
      key: 'client_person',
      render: renderClientPersonColumn
    },
    {
      title: 'Secteur',
      dataIndex: 'sector_name',
      key: 'sector_name',
      filters: filterOptions.sector_name,
      onFilter: getFilters.sector_name,
      render: (text) => renderTexts(text)
    },
    {
      title: 'Nature',
      dataIndex: 'client_type_name',
      key: 'client_type_name',
      filters: filterOptions.client_type_name,
      onFilter: getFilters.client_type_name,
      render: (text) => renderTexts(text)
    },
    {
      title: 'Compte Client',
      dataIndex: 'client_ct',
      key: 'client_ct',
      render: (text) => renderTexts(text)
    },
    { title: 'ICE', dataIndex: 'client_ice', key: 'client_ice', render: (text) => renderTexts(text) }
  ];

  if (CanEdit) {
    columns.push({
      title: '',
      dataIndex: '',
      key: '',
      width: 50,
      render: (text, record) => renderEditColumn(text, record, setEditItem, handleShowEditModal)
    });
  }

  return columns;
};

function ClientTable({ data, CanEdit, setEditItem, handleShowEditModal, loading, filteredData }) {
  const columns = getColumns(data, CanEdit, setEditItem, handleShowEditModal);

  return (
    <div className="desktop-only">
      <Table
        columns={columns}
        size="small"
        dataSource={filteredData}
        loading={loading}
        rowKey="client_id"
        tableLayout="fixed"
        pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description="Aucun Client" /> }}
      />
    </div>
  );
}

ClientTable.propTypes = {
  data: PropTypes.array.isRequired,
  CanEdit: PropTypes.bool.isRequired,
  setEditItem: PropTypes.func.isRequired,
  handleShowEditModal: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  filteredData: PropTypes.array.isRequired
};

function ClientMobileTable({ filteredData, loading }) {
  return (
    <div className="mobile-only">
      {filteredData.length === 0 && !loading && <Empty description="Aucun Client" />}
      <List>
        <VirtualList data={filteredData} height={600} itemHeight={20} itemKey="client_id">
          {(option) => (
            <List.Item key={option.client_id}>
              <Link to={`./${option.client_name}`} className="w-100 text-decoration-none">
                <List.Item.Meta
                  title={
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold fs-6">{option.client_name}</span>
                      <span className="text-end">{option.client_person}</span>
                    </div>
                  }
                  description={
                    <div className="d-flex justify-content-between">
                      <div className="fw-bold">{option.sector_name}</div>
                      <div className="fw-bold">{option.client_type_name}</div>
                    </div>
                  }
                />
              </Link>
            </List.Item>
          )}
        </VirtualList>
      </List>
    </div>
  );
}
ClientMobileTable.propTypes = {
  filteredData: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired
};

export { ClientTable, ClientMobileTable };
