import { useState, useEffect } from 'react';
import { Modal, Select, Button, Spin } from 'antd';
import { Row, Col } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

import apiLinks from 'config/apiLinks';

const AddMethod = ({ open, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [accOptions, setAccOptions] = useState([]);
  const initialValues = {
    method_name: '',
    method_fk_acc_id: ''
  };
  const validationSchema = Yup.object().shape({
    method_name: Yup.string().required('Le nom est obligatoire').max(255, 'Le nom ne doit pas dépasser 255 caractères'),
    method_fk_acc_id: Yup.number().required("L'accréditation est obligatoire")
  });
  const getOptions = async () => {
    try {
      const response = await axios.get(apiLinks.GET.accs);
      setAccOptions(response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Une erreur s'est produite lors de la récupération des accréditations",
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
    const response = axios.post(apiLinks.POST.methods, values);
    response
      .then((data) => {
        Swal.fire({
          icon: 'success',
          title: data.data.title || 'Méthode ajoutée',
          text: data.data.subtitle || 'La méthode a été ajoutée avec succès',
          timer: 1500,
          showConfirmButton: false
        });
        onSuccess();
        resetForm();
      })
      .catch((error) => {
        Swal.fire({
          title: error.response.data.title || 'Erreur',
          text: error.response.data.subtitle || "Une erreur est survenue, veuillez contacter l'administrateur",
          icon: 'error',
          timer: 3000
        });
        console.error('Error adding method:', error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Modal title="Ajouter une méthode" open={open} onCancel={onCancel} footer={null}>
      <Spin spinning={loading} tip="Chargement des données...">
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ errors, touched, handleBlur, handleChange, handleSubmit, values, setFieldValue, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <TextField
                      fullWidth
                      label="Nom de la méthode"
                      name="method_name"
                      variant="standard"
                      placeholder="Nom de la méthode"
                      value={values.method_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.method_name && Boolean(errors.method_name)}
                      helperText={touched.method_name && errors.method_name}
                    />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="form-group mb-4">
                    <InputLabel id="method_fk_acc_id">Accréditation</InputLabel>
                    <Select
                      className="w-100"
                      id="method_fk_acc_id"
                      name="method_fk_acc_id"
                      value={values.method_fk_acc_id || null}
                      options={accOptions}
                      onChange={(value) => setFieldValue('method_fk_acc_id', value)}
                      onBlur={handleBlur}
                      placeholder="Accréditation"
                      error={touched.method_fk_acc_id && Boolean(errors.method_fk_acc_id)}
                    />
                    {touched.method_fk_acc_id && errors.method_fk_acc_id && <div className="text-danger">{errors.method_fk_acc_id}</div>}
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="btn-block mb-4 mt-3 rounded shadow w-100"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Ajouter la méthode
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
AddMethod.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};
export default AddMethod;
