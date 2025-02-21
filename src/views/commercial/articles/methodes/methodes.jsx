import React, { useState } from 'react';
import { Row } from 'react-bootstrap';
import useFetchAndSearch from 'hooks/useFetchAndSearch';
import { FaPlus } from 'react-icons/fa';
import PageState from 'elements/hoc';
import { useAuth } from 'contexts/AuthContext';
import { SearchBar } from 'elements/SearchBar';
import { ListPageActions } from 'elements/ListPageActions';
import apiLinks from 'config/apiLinks';
import autoCompleteConfig from 'config/autoCompleteConf';
import { MethodsTable, MethodsMobileTable } from './methodsTables';
import AddMethod from './addMethod';
import EditMethod from './editMethod';
function Methods() {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTClients');
  const { getData, data, filteredData, autocompleteOptions, handleSearch, loading, error } = useFetchAndSearch(apiLinks.GET.methods, [
    'method_name'
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(0);

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
  const AddEditModals = () => {
    if (CanEdit) {
      return (
        <>
          <AddMethod open={showAddModal} onCancel={handleCloseAddModal} onSuccess={handleSuccessAdd} />
          <EditMethod method={editItem} open={showEditModal} onCancel={handleCloseEditModal} onSuccess={handleSuccessEdit} />
        </>
      );
    }
  };
  return (
    <PageState error={error} loading={loading}>
      <Row className="d-flex flex-row mb-3 align-items-center">
        <SearchBar autocompleteOptions={autocompleteOptions} handleSearch={handleSearch} autoCompleteConfig={autoCompleteConfig.Methods} />
        <ListPageActions
          data={filteredData}
          dataKey="methods"
          title="Télécharger la liste des méthodes"
          addTitle="Ajouter une Méthode"
          CanEdit={CanEdit}
          addAction={handleShowAddModal}
          addIcon={<FaPlus size={25} />}
        />
      </Row>
      <MethodsTable
        data={data}
        CanEdit={CanEdit}
        setEditItem={setEditItem}
        handleShowEditModal={handleShowEditModal}
        loading={loading}
        filteredData={filteredData}
      />
      <MethodsMobileTable filteredData={filteredData} loading={loading} />
      <AddEditModals />
    </PageState>
  );
}
export default Methods;
