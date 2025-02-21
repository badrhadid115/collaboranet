import React, { useState } from 'react';
import { Row } from 'react-bootstrap';
import { AiOutlineUserAdd } from 'react-icons/ai';
import useFetchAndSearch from 'hooks/useFetchAndSearch';
import PageState from 'elements/hoc';
import { useAuth } from 'contexts/AuthContext';
import { ListPageActions } from 'elements/ListPageActions';
import { SearchBar } from 'elements/SearchBar';
import apiLinks from 'config/apiLinks';
import autoCompleteConfig from 'config/autoCompleteConf';
import { ClientTable, ClientMobileTable } from './clientTables';
import AddClient from './addClient';
import EditClient from './editClient';

const Clients = () => {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTClients');
  const { getData, data, filteredData, autocompleteOptions, handleSearch, loading, error } = useFetchAndSearch(apiLinks.GET.clients, [
    'client_name',
    'client_ice',
    'client_ct',
    'client_person'
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
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
    getData(apiLinks.GET.clients);
    handleCloseEditModal();
  };
  const AddEditModals = () => {
    if (CanEdit) {
      return (
        <>
          <AddClient open={showAddModal} onCancel={handleCloseAddModal} onSuccess={handleSuccessAdd} />
          <EditClient client={editItem} open={showEditModal} onCancel={handleCloseEditModal} onSuccess={handleSuccessEdit} />
        </>
      );
    }
  };

  return (
    <PageState error={error} loading={loading}>
      <Row className="d-flex flex-row mb-3 align-items-center">
        <SearchBar autocompleteOptions={autocompleteOptions} handleSearch={handleSearch} autoCompleteConfig={autoCompleteConfig.Clients} />
        <ListPageActions
          data={filteredData}
          dataKey="clients"
          title="Télécharger la liste des clients"
          addTitle="Ajouter un Client"
          CanEdit={CanEdit}
          addAction={handleShowAddModal}
          addIcon={<AiOutlineUserAdd size={25} />}
        />
      </Row>
      <ClientTable
        data={data}
        CanEdit={CanEdit}
        setEditItem={setEditItem}
        handleShowEditModal={handleShowEditModal}
        loading={loading}
        filteredData={filteredData}
      />
      <ClientMobileTable filteredData={filteredData} loading={loading} />
      <AddEditModals />
    </PageState>
  );
};

export default Clients;
