import React, { useState } from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';

import Box from '@mui/material/Box';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginSubmit = async (values, actions) => {
    try {
      const response = await axios.post('/api/login', {
        username: values.email,
        password: values.password
      });

      if (response.data) {
        window.location.href = '/';
      }
    } catch (error) {
      const message =
        error.response.data.message ||
        'Connexion échouée, veuillez verifier vos identifiants. Si le probléme persiste, contactez le service informatique';
      console.error('Login failed', error.response.data);
      setErrorMessage(message);
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email('Veuillez entrer un email valide').max(255).required("L'email est requis"),
        password: Yup.string().max(255).required('Le mot de passe est requis')
      })}
      onSubmit={handleLoginSubmit}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
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
          <div className="form-group mb-4">
            <InputLabel htmlFor="outlined-adornment-password">Mot de Passe</InputLabel>
            <Input
              startAdornment={
                <InputAdornment position="start">
                  <i className="feather icon-lock" />
                </InputAdornment>
              }
              error={Boolean(touched.password && errors.password)}
              fullWidth
              helperText={touched.password && errors.password}
              label="Mot de Passe"
              margin="normal"
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              variant="outlined"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {touched.password && errors.password && <Box color="error.main">{errors.password}</Box>}
          </div>

          {errorMessage && (
            <Col sm={12}>
              <Alert variant="danger">{errorMessage}</Alert>
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
                Connexion
              </Button>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default LoginForm;
