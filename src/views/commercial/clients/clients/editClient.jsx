import { useState, useEffect } from 'react';
import { Modal, Switch, Select, Button, Spin } from 'antd';
import { Row, Col } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

import apiLinks from 'config/apiLinks';
const EditClient = ({ client, open, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [sectorOptions, setSectorOptions] = useState([]);
  const [clientTypeOptions, setClientTypeOptions] = useState([]);
  const [initialValues, setInitialValues] = useState({
    client_id: 0,
    client_name: '',
    client_person: '',
    client_function: '',
    client_email: '',
    client_number1: '',
    client_number2: '',
    client_address: '',
    client_city: '',
    client_ice: '',
    client_ct: '',
    client_is_ca: false,
    client_is_ht: false,
    client_fk_sector_id: 0,
    client_fk_type_id: 0
  });
  const validationSchema = Yup.object().shape({
    client_name: Yup.string()
      .required('Le nom du client est obligatoire')
      .matches(/^[A-Za-z0-9()&' ]+$/, 'Le nom doit contenir uniquement des lettres, chiffres et caractères spéciaux autorisés')
      .max(100, 'Le nom ne doit pas dépasser 100 caractères'),
    client_person: Yup.string().max(50, 'La personne ne doit pas dépasser 50 caractères'),
    client_function: Yup.string().max(100, 'La fonction ne doit pas dépasser 100 caractères'),
    client_email: Yup.string().email('Adresse e-mail invalide').nullable(),
    client_number1: Yup.string()
      .matches(/^\+?[0-9() ]+$/, 'Numéro de téléphone invalide (chiffres et + uniquement)')
      .nullable(),
    client_number2: Yup.string()
      .matches(/^\+?[0-9() ]+$/, 'Numéro de téléphone invalide (chiffres et + uniquement)')
      .nullable(),
    client_address: Yup.string().max(255, "L'adresse ne doit pas dépasser 255 caractères"),
    client_city: Yup.string()
      .matches(/^[A-ZÀ-Ÿ ]+$/, 'La ville doit contenir uniquement des lettres')
      .transform((value) => value.toUpperCase())
      .max(100, 'La ville ne doit pas dépasser 100 caractères'),
    client_ice: Yup.string()
      .matches(/^\d/, 'Le ICE doit contenir des chiffres uniquement')
      .max(20, "L'ICE ne doit pas dépasser 20 caractères"),
    client_ct: Yup.string().matches(/^\d{8}$/, 'Le CT doit contenir exactement 8 chiffres')
  });

  const getClientById = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(apiLinks.GET.clientById + id);
      return response.data;
    } catch (error) {
      Swal.fire({
        title: 'Erreur',
        text: "Une erreur est survenue, veuillez contacter l'administrateur",
        icon: 'error',
        timer: 3000
      });
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (client && open) {
      getClientById(client).then((data) => {
        const normalizedData = Object.keys(data).reduce((acc, key) => {
          acc[key] = data[key] === null ? '' : data[key];
          return acc;
        }, {});
        setInitialValues(normalizedData);
      });
    }
  }, [client, open]);

  const getOptions = async () => {
    try {
      const [sectorResponse, clientTypeResponse] = await Promise.all([
        axios.get(apiLinks.GET.sectors),
        axios.get(apiLinks.GET.clientTypes)
      ]);
      setSectorOptions(sectorResponse.data);
      setClientTypeOptions(clientTypeResponse.data);
    } catch (error) {
      Swal.fire({
        title: 'Erreur',
        text: "Une erreur est survenue, veuillez contacter l'administrateur",
        icon: 'error',
        timer: 3000
      });
      console.error('Error fetching options:', error);
    }
  };
  useEffect(() => {
    getOptions();
  }, []);

  const handleSubmit = (values, { setSubmitting }) => {
    const response = axios.put(apiLinks.PUT.clients, values);
    response
      .then((data) => {
        onSuccess();
        Swal.fire({
          title: data.data.title || 'Succès',
          text: data.data.subtitle || 'Client modifié avec succès',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      })
      .catch((error) => {
        Swal.fire({
          title: error.response.data.title || 'Erreur',
          text: error.response.data.subtitle || "Une erreur est survenue, veuillez contacter l'administrateur",
          icon: 'error',
          timer: 3000
        });
        console.error('Error adding client:', error.response.data);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  return (
    <Modal title="Modifier un Client" open={open} width={1000} footer className="rounded shadow" onCancel={onCancel}>
      <Spin spinning={loading}>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ errors, touched, handleBlur, handleChange, handleSubmit, values, setFieldValue, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Nom du client"
                      variant="standard"
                      id="client_name"
                      name="client_name"
                      type="text"
                      value={values.client_name}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_name && Boolean(errors.client_name)}
                      placeholder="Entrez le nom du client"
                      fullWidth
                    />
                    {touched.client_name && errors.client_name && <div className="text-danger">{errors.client_name}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Personne de Contact"
                      variant="standard"
                      id="client_person"
                      name="client_person"
                      value={values.client_person}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_person && Boolean(errors.client_person)}
                      placeholder="Entrez le nom de la personne"
                      fullWidth
                    />
                    {touched.client_person && errors.client_person && <div className="text-danger">{errors.client_person}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Fonction"
                      variant="standard"
                      id="client_function"
                      name="client_function"
                      value={values.client_function}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_function && Boolean(errors.client_function)}
                      placeholder="Entrez la fonction"
                      fullWidth
                    />
                    {touched.client_function && errors.client_function && <div className="text-danger">{errors.client_function}</div>}
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Adresse e-mail"
                      variant="standard"
                      id="client_email"
                      name="client_email"
                      value={values.client_email}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_email && Boolean(errors.client_email)}
                      placeholder="Entrez l'adresse e-mail"
                      fullWidth
                    />
                    {touched.client_email && errors.client_email && <div className="text-danger">{errors.client_email}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Numéro de téléphone 1"
                      variant="standard"
                      id="client_number1"
                      name="client_number1"
                      type="text"
                      value={values.client_number1}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_number1 && Boolean(errors.client_number1)}
                      placeholder="Entrez le numéro de téléphone"
                      fullWidth
                    />
                    {touched.client_number1 && errors.client_number1 && <div className="text-danger">{errors.client_number1}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Numéro de téléphone 2"
                      variant="standard"
                      id="client_number2"
                      name="client_number2"
                      value={values.client_number2}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_number2 && Boolean(errors.client_number2)}
                      placeholder="Entrez le numéro de téléphone"
                      fullWidth
                    />
                  </div>
                  {touched.client_number2 && errors.client_number2 && <div className="text-danger">{errors.client_number2}</div>}
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      multiline
                      variant="standard"
                      rows={2}
                      label="Adresse"
                      id="client_address"
                      name="client_address"
                      value={values.client_address}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="Entrez l’adresse"
                      fullWidth
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Ville"
                      variant="standard"
                      id="client_city"
                      name="client_city"
                      value={values.client_city}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_city && Boolean(errors.client_city)}
                      placeholder="Entrez la ville"
                      fullWidth
                    />
                    {touched.client_city && errors.client_city && <div className="text-danger">{errors.client_city}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="ICE"
                      variant="standard"
                      id="client_ice"
                      name="client_ice"
                      value={values.client_ice}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_ice && Boolean(errors.client_ice)}
                      placeholder="Entrez le ICE"
                      fullWidth
                    />
                    {touched.client_ice && errors.client_ice && <div className="text-danger">{errors.client_ice}</div>}
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      label="Compte Client"
                      variant="standard"
                      id="client_ct"
                      name="client_ct"
                      value={values.client_ct}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.client_ct && Boolean(errors.client_ct)}
                      placeholder="Entrez le CT (8 chiffres)"
                      fullWidth
                    />
                    {touched.client_ct && errors.client_ct && <div className="text-danger">{errors.client_ct}</div>}
                  </div>
                </Col>
              </Row>
              <Row className="mb-4">
                <Col>
                  <div className="form-group mb-4">
                    <InputLabel htmlFor="client_is_ca">Membre du C.A.</InputLabel>
                    <Switch
                      id="client_is_ca"
                      name="client_is_ca"
                      checked={values.client_is_ca}
                      checkedChildren="Oui"
                      unCheckedChildren="Non"
                      onChange={(checked) => setFieldValue('client_is_ca', checked)}
                    />
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <InputLabel htmlFor="client_is_ht">Exonéré du TVA</InputLabel>
                    <Switch
                      id="client_is_ht"
                      name="client_is_ht"
                      checked={values.client_is_ht}
                      checkedChildren="Oui"
                      unCheckedChildren="Non"
                      onChange={(checked) => setFieldValue('client_is_ht', checked)}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <InputLabel htmlFor="client_fk_sector_id">Secteur</InputLabel>
                    <Select
                      id="client_fk_sector_id"
                      value={values.client_fk_sector_id || null}
                      onChange={(value) => setFieldValue('client_fk_sector_id', value)}
                      placeholder="Choisissez un secteur"
                      style={{ width: '100%' }}
                      options={sectorOptions}
                    />
                  </div>
                </Col>
                <Col>
                  <div className="form-group mb-4">
                    <InputLabel htmlFor="client_fk_type_id">Type de client</InputLabel>
                    <Select
                      placeholder="Choisissez un type"
                      id="client_fk_type_id"
                      value={values.client_fk_type_id || null}
                      onChange={(value) => setFieldValue('client_fk_type_id', value)}
                      style={{ width: '100%' }}
                      options={clientTypeOptions}
                    />
                  </div>
                </Col>
              </Row>
              <Button
                type="primary"
                htmlType="submit"
                className="btn-block mb-4 mt-3 rounded shadow w-100"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Modifier {values.client_name}
              </Button>
            </form>
          )}
        </Formik>
      </Spin>
    </Modal>
  );
};

EditClient.propTypes = {
  client: PropTypes.number,
  open: PropTypes.bool,
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func
};
export default EditClient;
