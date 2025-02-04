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
import { downloadExcel, generateFilterOptions, currencyFormatter } from 'utils/genUtils';
import excelOptions from 'config/excelOptions';
import apiLinks from 'config/apiLinks';
import AddEssai from './addEssai';
import EditEssai from './editEssai';
const { Search } = Input;
function Labtests() {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTLabTests');
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
      const response = await axios.get(apiLinks.GET.labtests);
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
    acc_name: generateFilterOptions(data, 'acc_name'),
    sector_name: generateFilterOptions(data, 'sector_name')
  };
  const onFilters = {
    acc_name: (value, record) => {
      return value ? record.acc_name === value : true;
    },
    sector_name: (value, record) => {
      return value ? record.sector_name === value : true;
    }
  };
  const columns = [
    {
      title: '',
      dataIndex: 'labtest_is_valid',
      key: 'labtest_is_valid',
      render: (text, record) => (
        <Tooltip title={record.labtest_is_valid ? 'Essai Valide' : 'Essai Invalide'}>
          {record.labtest_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
        </Tooltip>
      ),
      width: 50
    },
    {
      title: 'Code',
      dataIndex: 'labtest_full_id',
      key: 'labtest_full_id'
    },
    {
      title: 'Essai',
      dataIndex: 'labtest_designation',
      key: 'labtest_designation',
      width: '40%'
    },
    {
      title: 'Méthode',
      dataIndex: 'method_name',
      key: 'method_name'
    },
    {
      title: 'Acc.',
      dataIndex: 'acc_name',
      key: 'acc_name',

      filters: filterOptions.acc_name,
      onFilter: (value, record) => onFilters.acc_name(value, record)
    },
    {
      title: 'Secteur',
      dataIndex: 'sector_name',
      key: 'sector_name',

      filters: filterOptions.sector_name,
      onFilter: (value, record) => onFilters.sector_name(value, record)
    },

    {
      title: 'Prix',
      dataIndex: 'labtest_price',
      key: 'labtest_price',
      className: 'text-end text-nowrap',
      render: (text, record) => currencyFormatter(record.labtest_price, 'DH'),
      sorter: (a, b) => a.labtest_price - b.labtest_price
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
                setEditItem(record.labtest_id);
                handleShowEditModal();
              }}
            />
          </Tooltip>
        </div>
      )
    });

  const handleSearch = (value) => {
    if (value && value.trim() !== '') {
      const fuse = new Fuse(data, { keys: ['labtest_designation', 'method_name'], threshold: 0.2 });
      const results = fuse.search(value);
      setAutocompleteOptions(results.map((result) => result.item.labtest_designation).slice(0, 5));
    } else {
      setAutocompleteOptions([]);
    }
  };
  useEffect(() => {
    const handleFilter = () => {
      if (searchText && searchText.trim() !== '') {
        const fuse = new Fuse(data, { keys: ['labtest_designation', 'method_name'], threshold: 0.2 });
        const results = fuse.search(searchText);
        setFilteredData(results.map((result) => result.item));
      } else {
        setFilteredData(data);
      }
    };
    handleFilter();
  }, [searchText, data]);
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
          <Tooltip title="Télécharger la liste des essais">
            <Button
              shape="circle"
              type="primary"
              icon={<PiMicrosoftExcelLogoFill size={25} />}
              style={{ backgroundColor: '#008000' }}
              size="large"
              onClick={() => {
                downloadExcel(data, excelOptions.labtests);
              }}
            />
          </Tooltip>
          {CanEdit && (
            <div className="desktop-only ms-3">
              <Tooltip title="Ajouter un Essai">
                <Button shape="circle" onClick={handleShowAddModal} type="primary" icon={<FaPlus size={20} />} size="large" />
              </Tooltip>
            </div>
          )}
        </Col>
        <Col md={6}>
          <AutoComplete
            options={autocompleteOptions.map((option) => ({ value: option }))}
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
              rowKey="labtest_id"
              tableLayout="fixed"
              pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty description="Aucune Méthode" /> }}
            />
          </div>
          <div className="mobile-only">
            {filteredData.length === 0 && <Empty description="Aucun Client" />}
            <List>
              <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="labtest_id">
                {(item) => (
                  <List.Item key={item.labtest_id}>
                    <div className="d-flex justify-content-between w-100">
                      <div>
                        <span className="m-0">{item.labtest_designation}</span>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        <i className="m-0">{item.method_name}</i>
                        <small className=" text-muted m-0">{item.acc_name}</small>
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
          <AddEssai open={showAddModal} onCancel={handleCloseAddModal} onSuccess={handleSuccessAdd} />
          <EditEssai labtest={editItem} open={showEditModal} onCancel={handleCloseEditModal} onSuccess={handleSuccessEdit} />
        </>
      )}
    </React.Fragment>
  );
}
export default Labtests;
