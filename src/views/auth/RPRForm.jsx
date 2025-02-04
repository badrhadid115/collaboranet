import React, { useState } from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import Box from '@mui/material/Box';

const RPRForm = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const handleRPRSubmit = async (values, actions) => {
    try {
      const response = await axios.post('/api/req-pwd-reset', {
        email: values.email
      });

      if (response.data) {
        setSuccessMessage(response.data.message);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (error) {
      const message =
        error.response.data.message ||
        'Erreur de réinitialisation, veuillez réessayer. Si le probléme persiste, contactez le service informatique';
      console.error('RPR failed', error.response.data);
      setErrorMessage(message);
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        email: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email('Veuillez entrer un email valide').max(255).required("L'email est requis")
      })}
      onSubmit={handleRPRSubmit}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <h5 className="mb-4 text-center">Réinitialiser le mot de passe</h5>
          <div className="form-group mb-4">
            <InputLabel htmlFor="outlined-adornment-email">Adresse Email</InputLabel>
            <Input
              startAdornment={
                <InputAdornment position="start">
                  <i className="feather icon-mail" />
                </InputAdornment>
              }
              error={Boolean(touched.email && errors.email)}
              fullWidth
              helperText={touched.email && errors.email}
              label="Adresse Email"
              margin="normal"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              type="email"
              value={values.email}
              variant="outlined"
            />
            {touched.email && errors.email && <Box color="error.main">{errors.email}</Box>}
          </div>
          {errorMessage && (
            <Col sm={12}>
              <Alert variant="danger">{errorMessage}</Alert>
            </Col>
          )}
          {successMessage && (
            <Col sm={12}>
              <Alert variant="success">{successMessage}</Alert>
            </Col>
          )}
          {errors.submit && (
            <Col sm={12}>
              <Alert>{errors.submit}</Alert>
            </Col>
          )}

          <Row>
            <Col mt={2}>
              <Button
                className="btn-block mb-4 mt-3 rounded shadow w-100"
                color="primary"
                disabled={isSubmitting}
                size="large"
                type="submit"
                variant="primary"
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default RPRForm;
