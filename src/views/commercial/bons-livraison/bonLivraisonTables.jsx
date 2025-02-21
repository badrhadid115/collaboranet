import PropTypes from 'prop-types';
import { useState } from 'react';
import { Table, Button, Empty, DatePicker, List, Spin } from 'antd';
import VirtualList from 'rc-virtual-list';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { renderDevis } from 'utils/commUtils';

const { RangePicker } = DatePicker;

function BonLivraisonTable({ loading, filteredData, setFilteredData, data }) {
  const renderDnFullID = (text, record) => {
    return <Link to={`/bons-de-livraison/${record.dn_full_id}`}>{text}</Link>;
  };
  const [selectedDates, setSelectedDates] = useState([]);
  const renderFilterDropdown = ({ setSelectedKeys, confirm, clearFilters }) => (
    <div className="p-2">
      <RangePicker
        value={selectedDates}
        onChange={(dates) => {
          setSelectedKeys(dates ? [dates] : []);
          setSelectedDates(dates);
        }}
        format="DD/MM/YYYY"
      />
      <div className="d-flex justify-content-end mt-2">
        <Button type="primary" size="small" onClick={() => handleDateFilter(confirm)} style={{ marginRight: 8 }}>
          Ok
        </Button>
        <Button size="small" onClick={() => resetDateFilter(clearFilters, confirm)}>
          Réinitialiser
        </Button>
      </div>
    </div>
  );

  const handleDateFilter = (confirm) => {
    if (selectedDates.length === 2) {
      const [start, end] = selectedDates;
      const filtered = data.filter((record) => {
        const recordDate = dayjs(record.dn_date, 'DD/MM/YYYY');
        return recordDate.isAfter(start.startOf('day')) && recordDate.isBefore(end.endOf('day'));
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
    confirm();
  };

  const resetDateFilter = (clearFilters, confirm) => {
    setSelectedDates([]);
    setFilteredData(data);
    clearFilters();
    confirm({ closeDropdown: true });
  };

  const handleOnFilter = (value, record) => {
    if (value && value.length === 2) {
      const [start, end] = value;
      const recordDate = dayjs(record.dn_date, 'DD/MM/YYYY');
      return recordDate.isAfter(dayjs(start).startOf('day')) && recordDate.isBefore(dayjs(end).endOf('day'));
    }
    return true;
  };
  const columns = [
    {
      title: 'Bon de Livraison',
      dataIndex: 'dn_full_id',
      key: 'dn_full_id',
      render: renderDnFullID,
      width: 200
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text, record) => <Link to={`/clients/${record.client_name}`}>{text}</Link>
    },
    {
      title: 'Date',
      dataIndex: 'dn_date',
      key: 'dn_date',
      sorter: (a, b) => dayjs(a.dn_date, 'DD/MM/YYYY') - dayjs(b.dn_date, 'DD/MM/YYYY'),
      filterDropdown: renderFilterDropdown,
      onFilter: handleOnFilter,
      width: 150
    },
    {
      title: 'Facture',
      dataIndex: 'invoice_full_id',
      key: 'invoice_full_id',
      render: (text, record) => <Link to={`/factures/${record.invoice_full_id}`}>{text}</Link>,
      width: 120
    },
    {
      title: 'Devis',
      dataIndex: 'devis_formatted_id',
      key: 'devis_formatted_id',
      render: renderDevis,
      width: 120
    },
    {
      title: 'Dossier',
      dataIndex: 'file_full_id',
      key: 'file_full_id',
      render: (text, record) => <Link to={`/dossiers-client/${record.file_full_id}`}>{text}</Link>,
      width: 150
    },
    {
      title: 'Commande',
      dataIndex: 'purchase_order_ref',
      key: 'purchase_order_ref',
      width: 200
    }
  ];
  return (
    <div className="desktop-only">
      <Table
        columns={columns}
        size="small"
        dataSource={filteredData}
        loading={loading}
        rowKey="dn_id"
        tableLayout="fixed"
        pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description="Aucun Bon de Livraison" /> }}
      />
    </div>
  );
}
function BonsLivraisonMobileTable({ filteredData, loading }) {
  return (
    <div className="mobile-only">
      <Spin tip="Chargement..." size="large" spinning={loading}>
        {filteredData.length === 0 && !loading && <Empty description="Aucun Bon de Livraison" />}
        <List>
          <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="dn_id">
            {(item) => (
              <Link to={`/avoirs/${item.dn_full_id}`} className="text-decoration-none">
                <List.Item key={item.dn_id}>
                  <div className="d-flex justify-content-between w-100">
                    <div className="d-flex flex-column">
                      <h5 className="m-0 ms-2">{item.dn_full_id}</h5>
                      <h6 className="m-0 ms-2">{item.client_name}</h6>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                      <h6 className="m-0">{item.dn_date}</h6>
                      <h6 className=" text-muted m-0">{item.invoice_full_id}</h6>
                    </div>
                  </div>
                </List.Item>
              </Link>
            )}
          </VirtualList>
        </List>
      </Spin>
    </div>
  );
}
export { BonLivraisonTable, BonsLivraisonMobileTable };

BonLivraisonTable.propTypes = {
  loading: PropTypes.bool,
  filteredData: PropTypes.array,
  setFilteredData: PropTypes.func,
  data: PropTypes.array
};
BonsLivraisonMobileTable.propTypes = {
  filteredData: PropTypes.array,
  loading: PropTypes.bool
};
