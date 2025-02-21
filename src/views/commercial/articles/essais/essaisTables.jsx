import PropTypes from 'prop-types';
import { Table, Empty, Tooltip, Spin, List } from 'antd';
import VirtualList from 'rc-virtual-list';
import { FaEdit, FaCheckCircle } from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';
import { TooltipButton } from 'elements/TooltipButton';
import { generateFilterOptions, currencyFormatter } from 'utils/genUtils';

function EssaisTable({ data, CanEdit, setEditItem, handleShowEditModal, loading, filteredData }) {
  const renderLabtestIsValid = (text, record) => (
    <Tooltip title={record.labtest_is_valid ? 'Essai Valide' : 'Essai Invalide'}>
      {record.labtest_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
    </Tooltip>
  );
  const renderEditButton = (text, record) => (
    <div className="d-flex">
      <TooltipButton
        title="Modifier"
        type="secondary"
        icon={<FaEdit />}
        onClick={() => {
          setEditItem(record.labtest_id);
          handleShowEditModal();
        }}
      />
    </div>
  );
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
      render: renderLabtestIsValid,
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
      render: renderEditButton
    });

  return (
    <div className="desktop-only">
      <Table
        columns={columns}
        size="small"
        dataSource={filteredData}
        loading={loading}
        rowKey="labtest_id"
        tableLayout="fixed"
        pagination={{ position: ['bottomCenter'], pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: <Empty description="Aucun Essai" /> }}
      />
    </div>
  );
}
function EssaisMobileTable({ filteredData, loading }) {
  return (
    <div className="mobile-only">
      <Spin tip="Chargement..." size="large" spinning={loading}>
        {filteredData.length === 0 && !loading && <Empty description="Aucun Essai" />}
        <List>
          <VirtualList data={filteredData} height={420} itemHeight={20} itemKey="labtest_id">
            {(item) => (
              <List.Item key={item.labtest_id}>
                <div className="d-flex justify-content-between w-100">
                  <div className="d-flex align-items-center ">
                    {item.labtest_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
                    <h6 className="m-0 ms-2">{item.labtest_designation}</h6>
                  </div>
                  <div className="d-flex flex-column align-items-end text-end">
                    <h6 className="m-0">{item.method_name}</h6>
                    <h6 className=" text-muted m-0">{item.acc_name}</h6>
                  </div>
                </div>
              </List.Item>
            )}
          </VirtualList>
        </List>
      </Spin>
    </div>
  );
}
export { EssaisTable, EssaisMobileTable };

EssaisTable.propTypes = {
  data: PropTypes.array,
  CanEdit: PropTypes.bool,
  setEditItem: PropTypes.func,
  handleShowEditModal: PropTypes.func,
  loading: PropTypes.bool,
  filteredData: PropTypes.array
};

EssaisMobileTable.propTypes = {
  filteredData: PropTypes.array,
  loading: PropTypes.bool
};
