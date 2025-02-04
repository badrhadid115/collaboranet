import React, { useState, useEffect } from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import Box from '@mui/material/Box';
import Swal from 'sweetalert2';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Progress } from 'antd';
import { checkPasswordStrength, pwdStrengthDescription } from 'utils/authUtils';
const ResetPwdForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    setToken(token);
  }, []);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleResetPwdSubmit = async (values, actions) => {
    try {
      if (token) {
        const response = await axios.put('/api/reset-pwd', {
          new_password: values.password,
          confirm_password: values.confirmPassword,
          token: token
        });

        if (response.data) {
          setSuccess(true);
        }
      }
    } catch (error) {
      const message =
        error.response.data.message ||
        'Réinitialisation du mot de passe impossible, veuillez réessayer. Si le probléme persiste, contactez le service informatique';
      console.error('Reset password failed', error.response.data);
      setErrorMessage(message);
    } finally {
      actions.setSubmitting(false);
    }
  };
  useEffect(() => {
    success &&
      Swal.fire({
        icon: 'success',
        title: 'Votre mot de passe a bien été changé',
        showConfirmButton: false,
        timer: 1500
      });
    success &&
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
  }, [success]);
  return (
    <Formik
      initialValues={{
        password: '',
        confirmPassword: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        password: Yup.string()
          .max(25)
          .required('Le mot de passe est requis')
          .test('password', 'Le mot de passe doit contenir au moins 8 caractères', (value) => {
            return value && value.length >= 8;
          })
          .test('password', 'La complexité du mot de passe doit au moins être moyenne', (value) => {
            if (value) {
              return checkPasswordStrength(value) >= 50;
            }
          }),
        confirmPassword: Yup.string()
          .max(25)
          .required('La confirmation du mot de passe est requise')
          .test('confirmPassword', 'Les mots de passe doivent correspondre', (value, context) => {
            return context.parent.password === value;
          })
      })}
      onSubmit={handleResetPwdSubmit}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <h5 className="text-center mb-4">Réinitialiser votre mot de passe</h5>
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
            {values.password && (
              <Progress
                percent={checkPasswordStrength(values.password)}
                showInfo={false}
                size="small"
                status="active"
                style={{ marginBottom: '10px' }}
                strokeColor={{
                  '0%': '#ff4d4f',
                  '50%': '#faad14',
                  '100%': '#52c41a'
                }}
              />
            )}
            {values.password && <Box>{pwdStrengthDescription(values.password)}</Box>}
            {touched.password && errors.password && <Box color="error.main">{errors.password}</Box>}
          </div>

          <div className="form-group mb-4">
            <InputLabel htmlFor="outlined-adornment-password">Confirmer le mot de Passe</InputLabel>
            <Input
              startAdornment={
                <InputAdornment position="start">
                  <i className="feather icon-lock" />
                </InputAdornment>
              }
              error={Boolean(touched.confirmPassword && errors.confirmPassword)}
              fullWidth
              helperText={touched.confirmPassword && errors.confirmPassword}
              label="Confirmer le mot de Passe"
              margin="normal"
              name="confirmPassword"
              onBlur={handleBlur}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              value={values.confirmPassword}
              variant="outlined"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {touched.confirmPassword && errors.confirmPassword && <Box color="error.main">{errors.confirmPassword}</Box>}
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
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default ResetPwdForm;
