import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Row } from 'react-bootstrap';
import { PiFilePdf } from 'react-icons/pi';
import PageState from 'elements/hoc';
import useFetchAndSearch from 'hooks/useFetchAndSearch';
import { useAuth } from 'contexts/AuthContext';
import { ListPageActions } from 'elements/ListPageActions';
import { SearchBar } from 'elements/SearchBar';
import apiLinks from 'config/apiLinks';
import autoCompleteConfig from 'config/autoCompleteConf';
import DevisSegmented from './segmented';
import { Table, Empty, Tooltip, Button, Modal } from 'antd';
import { DevisProgressBar } from 'utils/commUtils';
import { currencyFormatter } from 'utils/genUtils';
import { TooltipButton } from 'elements/TooltipButton';
import { BlobProvider } from '@react-pdf/renderer';
import Devis from 'pdf-templates/devis';
function DevisListPage() {
  const { user } = useAuth();
  const CanEdit = user?.permissions?.includes('CanPOSTClients');
  const CanSend = user?.permissions?.includes('CanPOSTDevis');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'inprogress';
  const [fetchFilter, setFetchFilter] = useState(initialStatus);
  const [apiUrl, setApiUrl] = useState(apiLinks.GET.devis(fetchFilter));
  const [pdfData, setPdfData] = useState([]);
  const [isPDFReady, setIsPDFReady] = useState(false);
  const { getData, data, filteredData, autocompleteOptions, handleSearch, loading, error } = useFetchAndSearch(apiUrl, [
    'devis_formatted_id',
    'client_name',
    'devis_object'
  ]);
  const onStatusChange = (value) => {
    setFetchFilter(value);
    setApiUrl(apiLinks.GET.devis(value));
    setSearchParams({ status: value });
  };
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && statusFromUrl !== fetchFilter) {
      setFetchFilter(statusFromUrl);
    }
  }, [searchParams, fetchFilter]);
  useEffect(() => {
    getData();
  }, [getData, fetchFilter]);
  //TODO: refine this function
  const getDevisPdfData = async (devisId) => {
    try {
      const response = await fetch(apiLinks.GET.devisPdf(devisId));
      const data = await response.json();

       const elementsST = data.elements.map((element) => ({
            labtest_full_id: labtestOptions.find((lt) => lt.labtest_id === element.element_fk_labtest_id)?.labtest_full_id,
            labtest_designation: labtestOptions.find((lt) => lt.labtest_id === element.element_fk_labtest_id)?.labtest_designation,
            element_note: element.element_note,
            method_name: labtestOptions.find((lt) => lt.labtest_id === element.element_fk_labtest_id)?.method_name,
            acc_name: labtestOptions.find((lt) => lt.labtest_id === element.element_fk_labtest_id)?.acc_name,
            element_quantity: element.element_quantity,
            element_discount: element.element_discount,
            element_price: element.element_price,
            element_total: element.element_price * element.element_quantity * (1 - element.element_discount / 100)
          }));
          const elementsFF = data.elements.map((element) => ({
            element_designation: element.element_designation,
            element_quantity: element.element_quantity,
            element_discount: element.element_discount,
            element_price: element.element_price,
            element_total: element.element_price * element.element_quantity * (1 - element.element_discount / 100)
          }));
          setPdfData({
            devis_type: type === 'devis-standard' ? 'ST' : 'FF',
            conversion_rate: conversionRate,
            devis_formatted_id: devisFormattedId,
            devis_date: dayjs(data.devis_date),
            client_name: clientOptions.find((c) => c.client_id === data.devis_fk_client_id)?.client_name,
            client_city: clientOptions.find((c) => c.client_id === data.devis_fk_client_id)?.client_city,
            devis_object: data.devis_object,
            devis_note: data.devis_note,
            devis_currency: data.devis_currency,
            devis_tax: data.devis_tax,
            devis_forfait: data.devis_forfait,
            modality_name: modalityOptions.find((m) => m.value === data.devis_fk_modality_id)?.label,
            elements: type === 'devis-standard' ? elementsST : elementsFF,
            totals: totals
          });
          setIsPDFReady(true);
      console.log('PDF data:', data);
    } catch (error) {
      console.error('Error fetching pdf data:', error);
    }
  };
  const columns = [
    {
      title: '',
      dataIndex: 'devis_id',
      key: 'icons',
      width: '5%'
    },
    {
      title: 'Devis N°',
      dataIndex: 'devis_formatted_id',
      key: 'devis_formatted_id',
      width: '10%',
      render: (text, record) => (
        <Link to={`/devis/${record.devis_full_id}/${record.devis_version}`} target="_blank">
          {text}
        </Link>
      ),
      sorter: (a, b) => a.devis_formatted_id.localeCompare(b.devis_formatted_id)
    },
    {
      title: 'Status',
      dataIndex: 'devis_fk_status',
      key: 'devis_fk_status',
      render: (text, record) => (
        <DevisProgressBar currentStep={record.status_name} status={record.devis_fk_status_id} steps={9} error={record.devis_error} />
      ),
      sorter: (a, b) => a.devis_fk_status_id - b.devis_fk_status_id
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      width: '20%',
      render: (text) => (
        <Tooltip title={text}>
          <Link to={`/clients/${text}`} className="text-decoration-none" target="_blank">
            {text}
          </Link>
        </Tooltip>
      )
    },
    {
      title: 'Objet',
      dataIndex: 'devis_object',
      key: 'devis_object',
      width: '30%',
      sorter: (a, b) => a.devis_object.localeCompare(b.devis_object)
    },
    {
      title: 'Date',
      dataIndex: 'devis_date',
      key: 'devis_date',
      width: '10%'
    },
    {
      title: 'Type',
      dataIndex: 'type_name',
      key: 'type_name'
    },
    {
      title: 'Secteur',
      dataIndex: 'sector_name',
      key: 'sector_name'
    },
    {
      title: 'Montant',
      dataIndex: 'devis_total_ht',
      key: 'devis_total_ht',
      width: '15%',
      align: 'right',
      rowClassName: 'text-nowrap',
      sorter: (a, b) => a.devis_total_ht - b.devis_total_ht,
      render: (text, record) => currencyFormatter(text, record.devis_currency)
    },
    {
      title: '',
      dataIndex: 'devis_id',
      key: 'actions',
      width: '5%',
      //test button pdf, no actions yet
      //TODO: add actions
      render: (text, record) => (
        <div className="d-flex justify-content-center">
          <TooltipButton
            title="Télécharger le devis [PDF]"
            type="secondary"
            icon={<PiFilePdf />}
            size="small"
            onClick={() => {
              getDevisPdfData(record.devis_formatted_id);
            }}
          />
        </div>
      )
    }
  ];
  return (
    <PageState loading={loading} error={error}>
      <DevisSegmented onStatusChange={onStatusChange} value={fetchFilter} />
      <Row className="d-flex flex-row mb-3 align-items-center">
        <SearchBar autocompleteOptions={autocompleteOptions} handleSearch={handleSearch} autoCompleteConfig={autoCompleteConfig.Devis} />
        <ListPageActions data={data} dataKey="devis" title="Télecharger la liste des devis" devis={true} CanEdit={CanEdit} />
      </Row>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="devis_id"
        loading={loading}
        locale={{ emptyText: <Empty description="Aucun devis" /> }}
      />
      {isPDFReady && (
        <BlobProvider document={<Devis devisData={pdfData} />} fileName="devis.pdf">
          {({ blob, url, loading, error }) => {
            if (error) {
              console.error('Error generating PDF:', error);
            }

            if (loading) {
              return (
                <Modal title="Generation du devis" open footer={null} closable={false} centered>
                  <p>Chargement... veuillez patientez </p>
                </Modal>
              );
            }

            if (!loading && url) {
              setIsPDFReady(false);
              window.open(url, '_blank');
            }

            return null;
          }}
        </BlobProvider>
      )}
    </PageState>
  );
}
export default DevisListPage;
