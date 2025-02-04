//THIRD PARTY IMPORTS
import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Fuse from 'fuse.js';
import { Table, Button, Tooltip, List, AutoComplete, Input, Empty, DatePicker } from 'antd';
import VirtualList from 'rc-virtual-list';
import { useDebouncedCallback } from 'use-debounce';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

//LOCAL IMPORTS
import { Loading, Page500, Page403, Page404 } from 'views/pages';
import { downloadExcel } from 'utils/genUtils';
import { renderDevis } from 'utils/commUtils';
import excelOptions from 'config/excelOptions';
import apiLinks from 'config/apiLinks';

//CONSTANTS
const { Search } = Input;
const { RangePicker } = DatePicker;

const BonsLivraison = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const getData = async () => {
    try {
      const response = await axios.get(apiLinks.GET.deliveryNotes);
      setData(response.data);
    } catch (error) {
      setError(error.status);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  const handleSearchTextChange = useDebouncedCallback((value) => {
    setSearchText(value);
  }, 500);

  const handleSearch = (value) => {
    if (value && value.trim() !== '') {
      const fuse = new Fuse(data, { keys: ['dn_full_id', 'client_name', 'file_full_id', 'devis_formatted_id'], threshold: 0.2 });
      const results = fuse.search(value);
      setAutocompleteOptions(results.map((result) => result.item).slice(0, 5));
    } else {
      setAutocompleteOptions([]);
    }
  };
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
      title: 'Bon de livraison',
      dataIndex: 'dn_full_id',
      key: 'dn_full_id',
      render: (text, record) => <Link to={`/bons-de-livraison/${record.dn_full_id}`}>{text}</Link>
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
      onFilter: handleOnFilter
    },
    {
      title: 'Facture',
      dataIndex: 'invoice_full_id',
      key: 'invoice_full_id',
      render: (text, record) => <Link to={`/factures/${record.invoice_full_id}`}>{text}</Link>
    },
    {
      title: 'Devis',
      dataIndex: 'devis_formatted_id',
      key: 'devis_formatted_id',
      render: renderDevis
    },
    {
      title: 'Dossier',
      dataIndex: 'file_full_id',
      key: 'file_full_id',
      render: (text, record) => <Link to={`/dossiers-client/${record.file_full_id}`}>{text}</Link>
    },
    {
      title: 'Commande',
      dataIndex: 'purchase_order_ref',
      key: 'purchase_order_ref'
    }
  ];

  useEffect(() => {
    const handleFilter = () => {
      if (searchText && searchText.trim() !== '') {
        const fuse = new Fuse(data, { keys: ['dn_full_id', 'client_name', 'file_full_id', 'devis_formatted_id'], threshold: 0.2 });
        const results = fuse.search(searchText);
        setFilteredData(results.map((result) => result.item));
      } else {
        setFilteredData(data);
      }
    };

    handleFilter();
  }, [searchText, data]);

  const renderAutocompleteOptions = (options) => {
    return options.map((option) => ({
      value: option.dn_full_id,
      label: (
        <List.Item key={option.dn_id}>
          <Link className="text-decoration-none" to={`/bons-de-livraison/${option.dn_full_id}`}>
            <List.Item.Meta
              title={
                <div className="d-flex justify-content-between">
                  <span className="fw-bold fs-6">{option.dn_full_id}</span>
                  <span className="fs-6">{option.client_name}</span>
                </div>
              }
              description={
                <div className="d-flex justify-content-between">
                  <div className="fw-bold">{option.devis_formatted_id}</div>
                  <div className="fw-bold">{option.invoice_full_id}</div>
                </div>
              }
            />
          </Link>
        </List.Item>
      )
    }));
  };
  if (loading) return <Loading />;
  if (error) {
    switch (error) {
      case 500:
        return <Page500 />;
      case 403:
        return <Page403 />;
      case 404:
        return <Page404 />;
      default:
        return <Empty description="Une erreur est survenue" />;
    }
  }

  return (
    <React.Fragment>
      <Row className="mb-3 align-items-center">
        <Col className="text-end my-3 d-flex align-items-center justify-content-end" md={18}>
          <Tooltip title="Télécharger la liste des bons de livraison">
            <Button
              shape="circle"
              type="primary"
              icon={<PiMicrosoftExcelLogoFill size={25} />}
              style={{ backgroundColor: '#008000' }}
              size="large"
              onClick={() => {
                downloadExcel(data, excelOptions.deliveryNotes);
              }}
            />
          </Tooltip>
        </Col>
        <Col md={6}>
          <AutoComplete
            options={renderAutocompleteOptions(autocompleteOptions)}
            onSearch={handleSearch}
            onSelect={(value) => setSearchText(value)}
            placeholder="Rechercher ..."
            className="autocomplete"
          >
            <Search placeholder="Rechercher ..." onChange={(e) => handleSearchTextChange(e.target.value)} allowClear />
          </AutoComplete>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="desktop-only">
            <Table
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              rowKey="purchase_id"
              tableLayout="fixed"
              pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty description="Aucun bon de livraison" /> }}
            />
          </div>
          <div className="mobile-only">
            {filteredData.length === 0 && <Empty description="Aucune bon de livraison" />}
            <List>
              <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="dn_id">
                {(item) => (
                  <List.Item key={item.dn_id}>
                    <List.Item.Meta
                      title={
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">{item.dn_full_id}</span>
                          <span className="text-end">{item.client_name}</span>
                        </div>
                      }
                      description={
                        <div className="d-flex justify-content-between">
                          <div className="fw-bold">{item.file_full_id}</div>
                          <div className="fw-bold">{item.invoice_full_id}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              </VirtualList>
            </List>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
};
export default BonsLivraison;
