import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Fuse from 'fuse.js';
import { Table, Button, Tooltip, List, AutoComplete, Input, Empty } from 'antd';
import VirtualList from 'rc-virtual-list';
import { useDebouncedCallback } from 'use-debounce';
import { FaEdit, FaPlus, FaCheckCircle } from 'react-icons/fa';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaCircleXmark } from 'react-icons/fa6';
import { Loading, Page500, Page403, Page404 } from 'views/pages';
import { useAuth } from 'views/auth/AuthContext';
import { downloadExcel, generateFilterOptions } from 'utils/genUtils';
import excelOptions from 'config/excelOptions';
import apiLinks from 'config/apiLinks';
import AddMethod from './addMethod';
import EditMethod from './editMethod';
const { Search } = Input;
function Methods() {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTMethods');
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
      const response = await axios.get(apiLinks.GET.methods);
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
    acc_desc: generateFilterOptions(data, 'acc_desc')
  };
  const onFilters = {
    acc_desc: (value, record) => {
      return value ? record.acc_desc === value : true;
    }
  };
  const columns = [
    {
      title: '',
      dataIndex: 'method_is_valid',
      key: 'method_is_valid',
      render: (text, record) => (
        <Tooltip title={record.method_is_valid ? 'Méthode Valide' : 'Méthode Invalide'}>
          {record.method_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
        </Tooltip>
      ),
      width: 50
    },
    {
      title: 'Code',
      dataIndex: 'method_full_id',
      key: 'method_full_id'
    },
    {
      title: 'Méthode',
      dataIndex: 'method_name',
      key: 'method_name'
    },
    {
      title: 'Accréditation',
      dataIndex: 'acc_desc',
      key: 'acc_desc',
      filters: filterOptions.acc_desc,
      onFilter: (value, record) => onFilters.acc_desc(value, record)
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
        <div className="d-flex">
          <Tooltip title="Modifier">
            <Button
              type="secondary"
              shape="circle"
              icon={<FaEdit />}
              onClick={() => {
                setEditItem(record.method_id);
                handleShowEditModal();
              }}
            />
          </Tooltip>
        </div>
      )
    });

  const handleSearch = (value) => {
    if (value && value.trim() !== '') {
      const fuse = new Fuse(data, { keys: ['method_name'], threshold: 0.3 });
      const results = fuse.search(value);
      setAutocompleteOptions(results.map((result) => result.item).slice(0, 5));
    } else {
      setAutocompleteOptions([]);
    }
  };
  useEffect(() => {
    const handleFilter = () => {
      if (searchText && searchText.trim() !== '') {
        const fuse = new Fuse(data, { keys: ['method_name'], threshold: 0.3 });
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
      value: option.method_name,
      label: (
        <List.Item key={option.method_id}>
          <List.Item.Meta
            title={
              <div className="d-flex justify-content-between align-items-center">
                <div className="align-items-center">
                  {option.method_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
                  <span className="fw-bold fs-6 ms-2">{option.method_name}</span>
                </div>
                <span className="fs-6">{option.acc_desc}</span>
              </div>
            }
          />
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
          <Tooltip title="Télécharger la liste des métodes">
            <Button
              shape="circle"
              type="primary"
              icon={<PiMicrosoftExcelLogoFill size={25} />}
              style={{ backgroundColor: '#008000' }}
              size="large"
              onClick={() => {
                downloadExcel(data, excelOptions.methods);
              }}
            />
          </Tooltip>
          {CanEdit && (
            <div className="desktop-only ms-3">
              <Tooltip title="Ajouter une Méthode">
                <Button shape="circle" onClick={handleShowAddModal} type="primary" icon={<FaPlus size={20} />} size="large" />
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
              rowKey="method_id"
              tableLayout="fixed"
              pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty description="Aucune Méthode" /> }}
            />
          </div>
          <div className="mobile-only">
            {filteredData.length === 0 && <Empty description="Aucune Méthode" />}
            <List>
              <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="method_id">
                {(item) => (
                  <List.Item key={item.method_id}>
                    <div className="d-flex justify-content-between w-100">
                      <div className="d-flex align-items-center ">
                        {item.method_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
                        <h5 className="m-0 ms-2">{item.method_name}</h5>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        <h6 className="m-0">{item.method_full_id}</h6>
                        <h6 className=" text-muted m-0">{item.acc_name}</h6>
                      </div>
                    </div>
                  </List.Item>
                )}
              </VirtualList>
            </List>
          </div>
        </Col>
      </Row>
      {CanEdit && (
        <>
          <AddMethod open={showAddModal} onCancel={handleCloseAddModal} onSuccess={handleSuccessAdd} />
          <EditMethod method={editItem} open={showEditModal} onCancel={handleCloseEditModal} onSuccess={handleSuccessEdit} />
        </>
      )}
    </React.Fragment>
  );
}
export default Methods;
