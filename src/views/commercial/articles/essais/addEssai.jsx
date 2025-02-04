import { useState, useEffect } from 'react';
import { Modal, Select, Button, Spin, InputNumber } from 'antd';
import { Row, Col } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

import apiLinks from 'config/apiLinks';

const AddEssai = ({ open, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [methodOptions, setMethodOptions] = useState([]);
  const [sectorOptions, setSectorOptions] = useState([]);
  const initialValues = {
    labtest_designation: '',
    labtest_price: 0,
    labtest_fk_method_id: '',
    labtest_fk_sector_id: ''
  };
  const validationSchema = Yup.object().shape({
    labtest_designation: Yup.string().required('Le nom est obligatoire').max(255, 'Le nom ne doit pas dépasser 255 caractères'),
    labtest_price: Yup.number()
      .required('Le prix est obligatoire')
      .min(0, 'Le prix doit être supérieur à 0')
      .max(1000000, 'Le prix doit être inférieur à 1 000 000'),
    labtest_fk_method_id: Yup.number().required('La méthode est obligatoire'),
    labtest_fk_sector_id: Yup.number().required('Le secteur est obligatoire')
  });
  const getOptions = async () => {
    try {
      const response = await axios.get(apiLinks.GET.methods);
      setMethodOptions(
        response.data
          .filter((method) => method.method_is_valid === 1)
          .map((method) => ({ value: method.method_id, label: `${method.method_name} [${method.acc_name}]` }))
      );
      const response2 = await axios.get(apiLinks.GET.sectors);
      setSectorOptions(response2.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Une erreur s'est produite lors de la récupération des méthodes ou des secteurs",
        timer: 2000
      });

      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getOptions();
  }, []);
  const handleSubmit = (values, { setSubmitting, resetForm }) => {
    const response = axios.post(apiLinks.POST.labtests, values);
    response
      .then((data) => {
        resetForm();
        onSuccess();
        Swal.fire({
          icon: 'success',
          title: data.data.title || 'Essai ajouté',
          text: data.data.subtitle || `L'essai a été ajouté avec succès`,
          timer: 2000
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: error.response.data.title || 'Erreur',
          text: error.response.data.subtitle || "Une erreur s'est produite, veuillez contacter l'administrateur",
          timer: 2000
        });

        console.error(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  //Extra
  const priceFormatter = (value) => {
    if (value) {
      const numericValue = parseFloat(value.toString().replace(/\s/g, '').replace(',', '.'));

      return numericValue
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    return value;
  };
  const priceParser = (value) => {
    if (value) {
      return parseFloat(value.replace(/\s/g, '').replace(',', '.')).toFixed(2);
    }
    return value;
  };
  return (
    <Modal title="Ajouter un essai" open={open} onCancel={onCancel} footer={null}>
      <Spin spinning={loading} tip="Chargement des données...">
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ errors, touched, handleBlur, handleChange, handleSubmit, values, setFieldValue, isSubmitting }) => (
            <form onSubmit={handleSubmit}>
              <Row>
                <Col>
                  <InputLabel>Nom de l&apos;essai</InputLabel>
                  <TextField
                    fullWidth
                    variant="standard"
                    name="labtest_designation"
                    value={values.labtest_designation}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.labtest_designation && Boolean(errors.labtest_designation)}
                    helperText={touched.labtest_designation && errors.labtest_designation}
                  />
                </Col>
              </Row>
              <Row>
                <Col>
                  <InputLabel>Prix de l&apos;essai</InputLabel>
                  <InputNumber
                    className="w-100"
                    name="labtest_price"
                    addonAfter="DH"
                    formatter={priceFormatter}
                    parser={priceParser}
                    min="0"
                    max="1000000"
                    step={0.01}
                    stringMode
                    value={values.labtest_price}
                    onChange={(value) => setFieldValue('labtest_price', value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col>
                  <InputLabel>Méthode</InputLabel>
                  <Select
                    className="w-100"
                    name="labtest_fk_method_id"
                    value={values.labtest_fk_method_id || null}
                    onChange={(value) => setFieldValue('labtest_fk_method_id', value)}
                    onBlur={handleBlur}
                    options={methodOptions}
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    allowClear
                    showSearch
                    placeholder="Sélectionner la méthode"
                  />
                </Col>
                {touched.labtest_fk_method_id && errors.labtest_fk_method_id && (
                  <div className="text-danger">{errors.labtest_fk_method_id}</div>
                )}
              </Row>
              <Row>
                <Col className="mb-3">
                  <InputLabel>Secteur</InputLabel>
                  <Select
                    className="w-100"
                    name="labtest_fk_sector_id"
                    value={values.labtest_fk_sector_id || null}
                    onChange={(value) => setFieldValue('labtest_fk_sector_id', value)}
                    onBlur={handleBlur}
                    options={sectorOptions}
                    allowClear
                    showSearch
                    placeholder="Sélectionner le secteur"
                  />
                  {touched.labtest_fk_sector_id && errors.labtest_fk_sector_id && (
                    <div className="text-danger">{errors.labtest_fk_sector_id}</div>
                  )}
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button className="w-100" type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                    Ajouter l&apos;essai
                  </Button>
                </Col>
              </Row>
            </form>
          )}
        </Formik>
      </Spin>
    </Modal>
  );
};

AddEssai.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default AddEssai;
