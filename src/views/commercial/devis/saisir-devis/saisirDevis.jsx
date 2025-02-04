import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Row } from 'react-bootstrap';
import axios from 'axios';
import { Spin, Form } from 'antd';
import dayjs from 'dayjs';

import { IoIosWarning } from 'react-icons/io';
import { MdOutlineFormatListBulleted } from 'react-icons/md';

import apiLinks from 'config/apiLinks';
import { initialValuesST, initialValuesFF, pdfDataST, pdfDataFF, getOptions } from './addDevisUtils';
import DevisInfo from './devisInfo';
import {
  DevisHeader,
  ClientAndObject,
  DevisElementsST,
  DevisElementsFF,
  DevisNote,
  Notes,
  Totals,
  DevisFooter,
  DevisPageHeader
} from './addDevisComponents';
import Card from 'elements/MainCard';

const AddDevis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const validTypes = useMemo(() => ['devis-standard', 'devis-format-libre'], []);
  let { type: paramType } = useParams();
  const [type, setType] = useState(paramType || 'devis-standard');
  useEffect(() => {
    if (!validTypes.includes(type)) {
      navigate(`/saisir-devis/devis-standard`, { replace: true });
      setType('devis-standard');
    }
  }, [type, navigate, validTypes]);
  document.title = `Saisir Devis ${type === 'devis-standard' ? 'Standard' : 'Format Libre'} | ${import.meta.env.VITE_APP_NAME}`;

  const [loading, setLoading] = useState(true);
  const [devisFormattedId, setDevisFormattedId] = useState('');
  const [clientOptions, setClientOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [sectorOptions, setSectorOptions] = useState([]);
  const [modalityOptions, setModalityOptions] = useState([]);
  const [labtestOptions, setLabtestOptions] = useState([]);
  const initialValues = useMemo(() => (type === 'devis-format-libre' ? initialValuesFF : initialValuesST), [type]);
  const [values, setValues] = useState(initialValues);
  const [totals, setTotals] = useState({ totalHT: 0, totalTVA: 0, totalTTC: 0 });
  const [pdfData, setPdfData] = useState(pdfDataST);
  const [localStorageName, setLocalStorageName] = useState();
  useEffect(() => {
    type === 'devis-format-libre' ? setPdfData(pdfDataFF) : setPdfData(pdfDataST);
    type === 'devis-format-libre' ? setLocalStorageName('devis-ff') : setLocalStorageName('devis');
  }, [type]);
  const [conversionRate, setConversionRate] = useState(1);
  const [form] = Form.useForm();

  useEffect(() => {
    getOptions({
      setClientOptions,
      setTypeOptions,
      setSectorOptions,
      setModalityOptions,
      setLabtestOptions,
      setDevisFormattedId,
      setLoading
    });
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const devisId = queryParams.get('id');
    const calculateTotals = (elements) => {
      const totalHT = elements
        .map((element) => element.element_price * element.element_quantity * (1 - element.element_discount / 100))
        .reduce((a, b) => a + b, 0);

      return {
        totalHT,
        totalTVA: totalHT * 0.2,
        totalTTC: totalHT * 1.2
      };
    };

    const populateForm = (data) => {
      const formattedData = { ...data, devis_date: dayjs(data.devis_date) };
      form.setFieldsValue(formattedData);
      setValues(formattedData);
      setConversionRate(formattedData.devis_currency === 'DH' ? 1 : 10);
      setTotals(calculateTotals(formattedData.elements));
    };

    const fetchDevisById = async (id) => {
      try {
        const response = await axios.get(`${apiLinks.GET.devis}/${id}`);
        if (response.data) {
          populateForm(response.data);
          localStorage.setItem(localStorageName, JSON.stringify({ ...response.data, devis_date: dayjs() }));
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Error fetching devis with ID ${id}:`, error);
        return false;
      }
    };

    const loadLocalStorageDevis = () => {
      const storedDevis = localStorage.getItem(localStorageName);
      if (storedDevis) {
        populateForm(JSON.parse(storedDevis));
        return true;
      }
      return false;
    };

    const initializeForm = () => {
      form.setFieldsValue(initialValues);
      setValues(initialValues);
      setConversionRate(1);
      setTotals({
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0
      });
    };

    (async () => {
      if (devisId) {
        const fetched = await fetchDevisById(devisId);
        if (!fetched) {
          const loaded = loadLocalStorageDevis();
          if (!loaded) initializeForm();
        }
        queryParams.delete('id');
      } else {
        const loaded = loadLocalStorageDevis();
        if (!loaded) initializeForm();
      }
      if (location.search.includes('id=')) {
        navigate(location.pathname, { replace: true });
      }
    })();
  }, [location, form, initialValues, localStorageName, type, navigate]);

  const handleChange = (_, values) => {
    setValues(values);

    if (form.getFieldValue('devis_currency') === 'DH') {
      setConversionRate(1);
    } else {
      setConversionRate(10);
    }
    const totalHT = values.elements
      .map((element) => element.element_price * element.element_quantity * (1 - element.element_discount / 100))
      .reduce((a, b) => a + b, 0);

    setTotals({
      totalHT,
      totalTVA: totalHT * 0.2,
      totalTTC: totalHT * 1.2
    });
    localStorage.setItem(localStorageName, JSON.stringify({ ...values, devis_date: dayjs(values.devis_date).format('YYYY-MM-DD') }));
  };
  useEffect(() => {
    const elementsST = values.elements.map((element) => ({
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
    const elementsFF = values.elements.map((element) => ({
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
      devis_date: dayjs(values.devis_date),
      client_name: clientOptions.find((c) => c.client_id === values.devis_fk_client_id)?.client_name,
      client_city: clientOptions.find((c) => c.client_id === values.devis_fk_client_id)?.client_city,
      devis_object: values.devis_object,
      devis_note: values.devis_note,
      devis_currency: values.devis_currency,
      devis_tax: values.devis_tax,
      devis_forfait: values.devis_forfait,
      modality_name: modalityOptions.find((m) => m.value === values.devis_fk_modality_id)?.label,
      elements: type === 'devis-standard' ? elementsST : elementsFF,
      totals: totals
    });
  }, [values, clientOptions, modalityOptions, labtestOptions, devisFormattedId, totals, conversionRate, type]);
  const onDragEnd = (result, fields) => {
    if (!result.destination) return;
    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);
    const reorderedElements = reorderedFields.map((field) => {
      return form.getFieldValue(['elements', field.name]);
    });
    form.setFieldsValue({ elements: reorderedElements });
    setValues({ ...values, elements: reorderedElements });
    localStorage.setItem(localStorageName, JSON.stringify({ ...values, elements: reorderedElements }));
  };
  const handleReset = () => {
    form.resetFields();
    localStorage.removeItem(localStorageName);
  };
  const handleSubmit = async (values) => {
    console.log(values);
  };
  return (
    <React.Fragment>
      <Spin spinning={loading} tip="Chargement des données...">
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          scrollToFirstError
          requiredMark={false}
          initialValues={initialValues}
          onValuesChange={handleChange}
        >
          <div className="desktop-only">
            <DevisPageHeader form={form} loading={loading} handleReset={handleReset} pdfData={pdfData} type={type} />
            <Row className="mb-3">
              <DevisInfo
                form={form}
                values={values}
                clientOptions={clientOptions}
                typeOptions={typeOptions}
                sectorOptions={sectorOptions}
                modalityOptions={modalityOptions}
              />
              <Card title={'Détails du devis'} icon={<MdOutlineFormatListBulleted />} isOption={true}>
                <div className="paper">
                  <DevisHeader values={values} devisFormattedId={devisFormattedId} />
                  <ClientAndObject values={values} clientOptions={clientOptions} />
                  {type === 'devis-format-libre' ? (
                    <DevisElementsFF onDragEnd={onDragEnd} form={form} values={values} conversionRate={conversionRate} />
                  ) : (
                    <DevisElementsST
                      onDragEnd={onDragEnd}
                      form={form}
                      values={values}
                      labtestOptions={labtestOptions}
                      conversionRate={conversionRate}
                    />
                  )}
                  <DevisNote values={values} />
                  <Row className="d-flex justify-content-between">
                    <Notes values={values} modalityOptions={modalityOptions} />
                    <Totals totals={totals} conversionRate={conversionRate} values={values} />
                  </Row>
                  <DevisFooter devisFormattedId={devisFormattedId} />
                </div>
              </Card>
            </Row>
          </div>
        </Form>
      </Spin>
      <div className="mobile-only">
        <div className="alert alert-warning d-flex flex-column align-items-center" role="alert">
          <IoIosWarning size={50} className="mb-4" />
          <p className="m-0">La saisie des devis n&apos;est pas disponible sur la version mobile.</p>
        </div>
      </div>
    </React.Fragment>
  );
};

export default AddDevis;
