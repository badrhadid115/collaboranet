import PropTypes from 'prop-types';
import { Table, Empty, Tooltip, Spin, List } from 'antd';
import VirtualList from 'rc-virtual-list';
import { FaEdit, FaCheckCircle } from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';
import { TooltipButton } from 'elements/TooltipButton';
import { generateFilterOptions } from 'utils/genUtils';
function MethodsTable({ data, CanEdit, setEditItem, handleShowEditModal, loading, filteredData }) {
  const renderMethodIsValid = (text, record) => (
    <Tooltip title={record.method_is_valid ? 'Méthode Valide' : 'Méthode Invalide'}>
      {record.method_is_valid ? <FaCheckCircle style={{ color: 'green' }} /> : <FaCircleXmark style={{ color: 'red' }} />}
    </Tooltip>
  );
  const renderEditButton = (text, record) => (
    <div className="d-flex">
      <TooltipButton
        title="Modifier"
        type="secondary"
        icon={<FaEdit />}
        onClick={() => {
          setEditItem(record.method_id);
          handleShowEditModal();
        }}
      />
    </div>
  );
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
      render: renderMethodIsValid,
      width: 50
    },
    {
      title: 'Code',
      dataIndex: 'method_full_id',
      key: 'method_full_id',
      width: 100
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
      width: 150,
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
      render: renderEditButton
    });

  return (
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
  );
}
function MethodsMobileTable({ filteredData, loading }) {
  return (
    <div className="mobile-only">
      <Spin tip="Chargement..." size="large" spinning={loading}>
        {filteredData.length === 0 && !loading && <Empty description="Aucune Méthode" />}
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
      </Spin>
    </div>
  );
}
export { MethodsTable, MethodsMobileTable };

MethodsTable.propTypes = {
  data: PropTypes.array,
  CanEdit: PropTypes.bool,
  setEditItem: PropTypes.func,
  handleShowEditModal: PropTypes.func,
  loading: PropTypes.bool,
  filteredData: PropTypes.array
};

MethodsMobileTable.propTypes = {
  filteredData: PropTypes.array,
  loading: PropTypes.bool
};
