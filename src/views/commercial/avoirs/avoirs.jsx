//THIRD PARTY IMPORTS
import { Row } from 'react-bootstrap';
import useFetchAndSearch from 'hooks/useFetchAndSearch';

//LOCAL IMPORTS
import PageState from 'elements/hoc';
import { ListPageActions } from 'elements/ListPageActions';
import { SearchBar } from 'elements/SearchBar';
import apiLinks from 'config/apiLinks';
import autoCompleteConfig from 'config/autoCompleteConf';

import { AvoirsTable, AvoirsMobileTable } from './avoirsTables';

const Avoirs = () => {
  const { data, filteredData, setFilteredData, autocompleteOptions, handleSearch, loading, error } = useFetchAndSearch(
    apiLinks.GET.creditNotes,
    ['cn_full_id', 'client_name', 'devis_formatted_id', 'invoice_full_id', 'purchase_order_ref']
  );

  return (
    <PageState loading={loading} error={error}>
      <Row className="mb-3 align-items-center">
        <SearchBar
          autocompleteOptions={autocompleteOptions}
          handleSearch={handleSearch}
          autoCompleteConfig={autoCompleteConfig.CreditNotes}
        />
        <ListPageActions data={data} dataKey="creditNotes" title="Télecharger la liste des avoirs" />
      </Row>
      <AvoirsTable loading={loading} filteredData={filteredData} setFilteredData={setFilteredData} data={data} />
      <AvoirsMobileTable loading={loading} filteredData={filteredData} />
    </PageState>
  );
};
export default Avoirs;
