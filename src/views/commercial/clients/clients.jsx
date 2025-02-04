import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Fuse from 'fuse.js';
import { Table, Button, Tooltip, List, AutoComplete, Input, Empty } from 'antd';
import VirtualList from 'rc-virtual-list';
import { AiOutlineUserAdd } from 'react-icons/ai';
import { FaEdit } from 'react-icons/fa';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { RiUserStarFill } from 'react-icons/ri';
import { HiReceiptTax } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { Loading, Page500, Page403, Page404 } from 'views/pages';
import { useAuth } from 'views/auth/AuthContext';
import { downloadExcel, generateFilterOptions } from 'utils/genUtils';
import excelOptions from 'config/excelOptions';
import apiLinks from 'config/apiLinks';
import AddClient from './addClient';
import EditClient from './editClient';
const { Search } = Input;

const Clients = () => {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTClients');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const getData = async () => {
    try {
      const response = await axios.get(apiLinks.GET.clients);
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

  const filterOptions = {
    sector_name: generateFilterOptions(data, 'sector_name'),
    client_type_name: generateFilterOptions(data, 'client_type_name'),
    client_name: [
      {
        text: 'Membre du CA',
        value: 'CA'
      },
      {
        text: 'Exonéré du TVA',
        value: 'HT'
      }
    ]
  };
  const onFilters = {
    client_name: (value, record) => {
      if (value === 'CA') {
        return record.client_is_ca === 1;
      }
      if (value === 'HT') {
        return record.client_is_ht === 1;
      }
      return true;
    },
    sector_name: (value, record) => {
      return value ? record.sector_name === value : true;
    },
    client_type_name: (value, record) => {
      return value ? record.client_type === value : true;
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'client_is_ca',
      key: 'client_is_ca',
      width: 60,
      render: (text, record) => (
        <div className="d-flex flex-column">
          {record.client_is_ca === 1 && (
            <Tooltip title="Membre du CA">
              <RiUserStarFill size={20} color="#D4AF37" />
            </Tooltip>
          )}
          {record.client_is_ht === 1 && (
            <Tooltip title="Exonéré du TVA">
              <HiReceiptTax size={20} color="#89CFF0" />
            </Tooltip>
          )}
        </div>
      )
    },

    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      ellipsis: true,
      width: 250,
      filters: filterOptions.client_name,
      onFilter: (value, record) => onFilters.client_name(value, record),
      render: (text) => (
        <Tooltip title={text}>
          <Link to={`./${text}`} className="text-decoration-none">
            {text}
          </Link>
        </Tooltip>
      )
    },
    {
      title: 'Personne de Contact',
      dataIndex: 'client_person',
      key: 'client_person',
      render: (text, record) =>
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
        )
    },
    {
      title: 'Secteur',
      dataIndex: 'sector_name',
      key: 'sector_name',
      filters: filterOptions.sector_name,
      onFilter: (value, record) => onFilters.sector_name(value, record),
      render: (text, record) => (record.sector_id ? text : <i className="text-warning">Non Défini</i>)
    },
    {
      title: 'Nature',
      dataIndex: 'client_type_name',
      key: 'client_type_name',
      filters: filterOptions.client_type_name,
      onFilter: (value, record) => onFilters.client_type_name(value, record),
      render: (text, record) => (record.client_type_id ? text : <i className="text-warning">Non Défini</i>)
    },
    {
      title: 'Compte Client',
      dataIndex: 'client_ct',
      key: 'client_ct',
      render: (text) => text || <i className="text-warning">Non Défini</i>
    },
    {
      title: 'ICE',
      dataIndex: 'client_ice',
      key: 'client_ice',
      render: (text) => text || <i className="text-warning">Non Défini</i>
    }
  ];
  CanEdit &&
    columns.push({
      title: '',
      dataIndex: '',
      key: '',
      width: 50,
      render: (text, record) => (
        <div className="d-flex">
          <Tooltip title="Modifier">
            <Button
              type="secondary"
              shape="circle"
              icon={<FaEdit />}
              onClick={() => {
                setEditItem(record.client_id);
                handleShowEditModal();
              }}
            />
          </Tooltip>
        </div>
      )
    });
  const handleSearch = (value) => {
    if (value && value.trim() !== '') {
      const fuse = new Fuse(data, { keys: ['client_name'], threshold: 0.3 });
      const results = fuse.search(value);
      setAutocompleteOptions(results.map((result) => result.item).slice(0, 5));
    } else {
      setAutocompleteOptions([]);
    }
  };

  useEffect(() => {
    const handleFilter = () => {
      if (searchText && searchText.trim() !== '') {
        const fuse = new Fuse(data, { keys: ['client_name'], threshold: 0.3 });
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
      value: option.client_name,
      label: (
        <List.Item key={option.client_id}>
          <Link to={`./${option.client_name}`} className="text-decoration-none">
            <List.Item.Meta
              title={
                <div className="d-flex justify-content-between">
                  <span className="fw-bold fs-6">{option.client_name}</span>
                  <span className="fs-6">{option.client_person}</span>
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
      )
    }));
  };
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };
  const handleSuccessAdd = () => {
    getData();
    handleCloseAddModal();
  };
  const handleShowEditModal = () => {
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };
  const handleSuccessEdit = () => {
    getData();
    handleCloseEditModal();
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
          <Tooltip title="Télécharger la liste des clients">
            <Button
              shape="circle"
              type="primary"
              icon={<PiMicrosoftExcelLogoFill size={25} />}
              style={{ backgroundColor: '#008000' }}
              size="large"
              onClick={() => {
                downloadExcel(data, excelOptions.clients);
              }}
            />
          </Tooltip>
          <div className="desktop-only ms-3">
            {CanEdit && (
              <Tooltip title="Ajouter un Client">
                <Button shape="circle" onClick={handleShowAddModal} type="primary" icon={<AiOutlineUserAdd size={25} />} size="large" />
              </Tooltip>
            )}
          </div>
        </Col>
        <Col md={6}>
          <AutoComplete
            options={renderAutocompleteOptions(autocompleteOptions)}
            onSearch={handleSearch}
            onSelect={(value) => setSearchText(value)}
            placeholder="Rechercher ..."
            style={{ minWidth: '100%' }}
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
              size="small"
              dataSource={filteredData}
              loading={loading}
              rowKey="client_id"
              tableLayout="fixed"
              pagination={{ position: ['bottomCenter'], pageSize: 20 }}
              locale={{ emptyText: <Empty description="Aucun Client" /> }}
            />
          </div>
          <div className="mobile-only">
            {filteredData.length === 0 && !loading && <Empty description="Aucun Client" />}
            <List>
              <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="client_id">
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
        </Col>
      </Row>
      {CanEdit && (
        <>
          <AddClient open={showAddModal} onCancel={handleCloseAddModal} onSuccess={handleSuccessAdd} />
          <EditClient client={editItem} open={showEditModal} onCancel={handleCloseEditModal} onSuccess={handleSuccessEdit} />
        </>
      )}
    </React.Fragment>
  );
};

export default Clients;
