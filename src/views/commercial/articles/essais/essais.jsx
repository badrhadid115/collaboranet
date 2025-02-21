import React, { useState } from 'react';
import { Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import useFetchAndSearch from 'hooks/useFetchAndSearch';
import PageState from 'elements/hoc';
import { SearchBar } from 'elements/SearchBar';
import { ListPageActions } from 'elements/ListPageActions';
import apiLinks from 'config/apiLinks';
import autoCompleteConfig from 'config/autoCompleteConf';
import { useAuth } from 'contexts/AuthContext';
import { EssaisTable, EssaisMobileTable } from './essaisTables';
import AddEssai from './addEssai';
import EditEssai from './editEssai';
function Labtests() {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTClients');
  const { getData, data, filteredData, autocompleteOptions, handleSearch, loading, error } = useFetchAndSearch(apiLinks.GET.labtests, [
    'labtest_designation',
    'method_name'
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
    getData();
    handleCloseEditModal();
  };
  const AddEditModals = () => {
    if (CanEdit) {
      return (
        <>
          <AddEssai open={showAddModal} onCancel={handleCloseAddModal} onSuccess={handleSuccessAdd} />
          <EditEssai labtest={editItem} open={showEditModal} onCancel={handleCloseEditModal} onSuccess={handleSuccessEdit} />
        </>
      );
    }
  };
  return (
    <PageState loading={loading} error={error}>
      <Row className="mb-3 align-items-center">
        <SearchBar autocompleteOptions={autocompleteOptions} handleSearch={handleSearch} autoCompleteConfig={autoCompleteConfig.Labtests} />
        <ListPageActions
          data={filteredData}
          dataKey="labtests"
          title="Télécharger la liste des essais"
          addTitle="Ajouter un essai"
          CanEdit={CanEdit}
          addAction={handleShowAddModal}
          addIcon={<FaPlus size={25} />}
        />
      </Row>
      <EssaisTable
        data={data}
        CanEdit={CanEdit}
        setEditItem={setEditItem}
        handleShowEditModal={handleShowEditModal}
        loading={loading}
        filteredData={filteredData}
      />
      <EssaisMobileTable filteredData={filteredData} loading={loading} />
      <AddEditModals />
    </PageState>
  );
}
export default Labtests;
