//THIRD PARTY IMPORTS
import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Fuse from 'fuse.js';
import { Table, Button, Tooltip, List, AutoComplete, Input, Empty, DatePicker } from 'antd';
import VirtualList from 'rc-virtual-list';
import { useDebouncedCallback } from 'use-debounce';
import { FaEdit, FaPlus } from 'react-icons/fa';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

//LOCAL IMPORTS
import { Loading, Page500, Page403, Page404 } from 'elements/hoc';
import { useAuth } from 'contexts/AuthContext';
import { downloadExcel } from 'utils/genUtils';
import { renderFileLink } from 'utils/laboUtils';
import excelOptions from 'config/excelOptions';
import apiLinks from 'config/apiLinks';

//CONSTANTS
const { Search } = Input;
const { RangePicker } = DatePicker;

const Echantillons = () => {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTSamples');
  const CanViewClient = user?.permissions?.includes('CanViewClients');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);

  async function getData() {
    try {
      const response = await axios.get(apiLinks.GET.samples);
      setData(response.data);
    } catch (error) {
      setError(error.status);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  const handleSearchTextChange = useDebouncedCallback((value) => {
    setSearchText(value);
  }, 500);

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
        const recordDate = dayjs(record.sample_date, 'DD/MM/YYYY');
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
      const recordDate = dayjs(record.sample_date, 'DD/MM/YYYY');
      return recordDate.isAfter(dayjs(start).startOf('day')) && recordDate.isBefore(dayjs(end).endOf('day'));
    }
    return true;
  };
  const columns = [
    {
      title: 'Echantillon',
      dataIndex: 'sample_full_id',
      key: 'sample_full_id',
      render: (text, record) => <Link to={`/echantillons/${record.sample_full_id}`}>{text}</Link>,
      sorter: (a, b) => a.sample_full_id.localeCompare(b.sample_full_id)
    },
    {
      title: 'Description',
      dataIndex: 'sample_name',
      key: 'sample_name',
      render: (text, record) => (
        <>
          <span>{text}</span>
          <br />
          <span className="text-muted">{record.sample_description}</span>
        </>
      )
    },
    {
      title: 'Quantité',
      dataIndex: 'sample_quantity',
      key: 'sample_quantity'
    },
    {
      title: 'Date',
      dataIndex: 'sample_date',
      key: 'sample_date',
      filterDropdown: renderFilterDropdown,
      onFilter: handleOnFilter,
      sorter: (a, b) => dayjs(a.sample_date, 'DD/MM/YYYY').unix() - dayjs(b.sample_date, 'DD/MM/YYYY').unix()
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text, record) => {
        if (!record.client_name) {
          return <i className="text-warning">Non Defini</i>;
        }
        if (CanViewClient) {
          return <Link to={`/clients/${record.client_name}`}>{text}</Link>;
        }
        return text;
      }
    },
    {
      title: 'Dossier',
      dataIndex: 'file_full_id',
      key: 'file_full_id',
      render: renderFileLink,
      filters: [
        {
          text: 'Non Associé',
          value: 0
        },
        {
          text: 'Associé',
          value: 1
        }
      ],
      onFilter: (value, record) => {
        if (value === 0) {
          return !record.file_full_id || record.file_full_id.trim() === '';
        }
        if (value === 1) {
          return record.file_full_id && record.file_full_id.trim() !== '';
        }
        return true;
      }
    }
  ];
  CanEdit &&
    columns.push({
      title: '',
      dataIndex: '',
      key: 'actions',
      width: 50,

      // eslint-disable-next-line no-unused-vars
      render: (text, record) => (
        <Tooltip title="Modifier">
          <Button type="secondary" shape="circle" icon={<FaEdit />} />
        </Tooltip>
      )
    });
  const handleSearch = (value) => {
    if (value && value.trim() !== '') {
      const fuse = new Fuse(data, {
        keys: ['sample_full_id', 'sample_name', 'sample_description', 'client_name', 'file_full_id'],
        threshold: 0.2
      });
      const results = fuse.search(value);
      setAutocompleteOptions(results.map((result) => result.item).slice(0, 5));
    } else {
      setAutocompleteOptions([]);
    }
  };
  useEffect(() => {
    const handleFilter = () => {
      if (searchText && searchText.trim() !== '') {
        const fuse = new Fuse(data, {
          keys: ['sample_full_id', 'sample_name', 'sample_description', 'client_name', 'file_full_id'],
          threshold: 0.2
        });
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
      value: option.sample_full_id,
      label: (
        <List.Item key={option.sample_id}>
          <Link className="text-decoration-none" to={`/echantillons/${option.sample_full_id}`}>
            <List.Item.Meta
              title={
                <div className="d-flex justify-content-between">
                  <span className="fw-bold fs-6">{option.sample_full_id}</span>
                  <span className="fs-6">{option.client_name}</span>
                </div>
              }
              description={
                <div className="d-flex justify-content-between">
                  <div className="fw-bold">{option.sample_name}</div>
                  <div className="fw-bold">{option.file_full_id}</div>
                </div>
              }
            />
          </Link>
        </List.Item>
      )
    }));
  };

  //error handling
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
          <Tooltip title="Télécharger la liste des échantillons">
            <Button
              shape="circle"
              type="primary"
              icon={<PiMicrosoftExcelLogoFill size={25} />}
              style={{ backgroundColor: '#008000' }}
              size="large"
              onClick={() => {
                downloadExcel(data, excelOptions.samples);
              }}
            />
          </Tooltip>
          {CanEdit && (
            <div className="desktop-only ms-3">
              <Tooltip title="Ajouter un échantillon">
                <Button shape="circle" type="primary" icon={<FaPlus size={20} />} size="large" />
              </Tooltip>
            </div>
          )}
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
              rowKey="sample_id"
              tableLayout="fixed"
              pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty description="Aucun échantillon" /> }}
            />
          </div>
          <div className="mobile-only">
            {filteredData.length === 0 && <Empty description="Aucun échantillon" />}
            <List>
              <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="sample_id">
                {(item) => (
                  <List.Item key={item.purchase_id}>
                    <Link className="text-decoration-none" to={`/echantillons/${item.sample_full_id}`}>
                      <List.Item.Meta
                        title={
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold">{item.sample_full_id}</span>
                            <span className="text-end">{item.client_name}</span>
                          </div>
                        }
                        description={
                          <div className="d-flex justify-content-between">
                            <div className="fw-bold">{item.sample_name}</div>
                            <div className="fw-bold">{item.file_full_id}</div>
                          </div>
                        }
                      />
                    </Link>
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

export default Echantillons;
