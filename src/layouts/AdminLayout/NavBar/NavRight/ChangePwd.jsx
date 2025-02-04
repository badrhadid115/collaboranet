import React, { useState } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import Box from '@mui/material/Box';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Progress } from 'antd';
import { checkPasswordStrength, pwdStrengthDescription } from 'utils/authUtils';
const ChangePwd = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const handleChangePwd = async (values, actions) => {
    try {
      const response = await axios.put('/api/change-pwd', {
        old_password: values.oldPassword,
        new_password: values.newPassword,
        confirm_password: values.confirmPassword
      });
      if (response.status === 200) {
        setSuccessMessage(response.data.subtitle);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (error) {
      const title = error.response.data.title || 'Erreur de réinitialisation';
      const subtitle =
        error.response.data.subtitle ||
        'Erreur de réinitialisation, veuillez réessayer. Si le probléme persiste, contactez le service informatique';
      console.error('Change password failed', error.response.data);
      setErrorMessage({ title, subtitle });
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      <Formik
        initialValues={{
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }}
        validationSchema={Yup.object().shape({
          oldPassword: Yup.string().required('Ancien mot de passe requis'),
          newPassword: Yup.string()
            .required('Nouveau mot de passe requis')
            .test('password', 'Le mot de passe doit contenir au moins 8 caractères', (value) => {
              return value && value.length >= 8;
            })
            .test('password', 'La complexité du mot de passe doit au moins être moyenne', (value) => {
              if (value) {
                return checkPasswordStrength(value) >= 50;
              }
            }),
          confirmPassword: Yup.string()
            .required('Confirmer le nouveau mot de passe')
            .test('passwords-match', 'Les mots de passe ne correspondent pas', function (value, context) {
              return context.parent.newPassword === value;
            })
        })}
        onSubmit={handleChangePwd}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <h5 className="text-center mb-4">Réinitialiser votre mot de passe</h5>
            <div className="form-group mb-4">
              <InputLabel htmlFor="outlined-adornment-password">Ancien mot de Passe</InputLabel>
              <Input
                startAdornment={
                  <InputAdornment position="start">
                    <i className="feather icon-lock" />
                  </InputAdornment>
                }
                error={Boolean(touched.oldPassword && errors.oldPassword)}
                fullWidth
                helperText={touched.oldPassword && errors.oldPassword}
                label="Ancien mot de Passe"
                margin="normal"
                name="oldPassword"
                onBlur={handleBlur}
                onChange={handleChange}
                type={showPassword ? 'text' : 'password'}
                value={values.oldPassword}
                variant="outlined"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              {touched.oldPassword && errors.oldPassword && <Box color="error.main">{errors.oldPassword}</Box>}
            </div>
            <div className="form-group mb-4">
              <InputLabel htmlFor="outlined-adornment-password">Mot de Passe</InputLabel>
              <Input
                startAdornment={
                  <InputAdornment position="start">
                    <i className="feather icon-lock" />
                  </InputAdornment>
                }
                error={Boolean(touched.newPassword && errors.newPassword)}
                fullWidth
                helperText={touched.newPassword && errors.newPassword}
                label="Mot de Passe"
                margin="normal"
                name="newPassword"
                onBlur={handleBlur}
                onChange={handleChange}
                type={showPassword ? 'text' : 'password'}
                value={values.newPassword}
                variant="outlined"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              {values.newPassword && (
                <Progress
                  percent={checkPasswordStrength(values.newPassword)}
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
              {values.newPassword && (
                <Box>
                  <b style={{ color: `${pwdStrengthDescription(values.newPassword).color}` }}>
                    {pwdStrengthDescription(values.newPassword).text}
                  </b>
                </Box>
              )}
              {touched.newPassword && errors.newPassword && <Box color="error.main">{errors.newPassword}</Box>}
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

            {errorMessage.title && (
              <Col sm={12}>
                <Alert variant="danger">
                  <b>{errorMessage.title}</b>
                  <br />
                  {errorMessage.subtitle}
                </Alert>
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
                  Changer le mot de passe
                </Button>
              </Col>
            </Row>
            {successMessage && (
              <Col sm={12}>
                <Alert variant="success">{successMessage}</Alert>
              </Col>
            )}
          </form>
        )}
      </Formik>
    </React.Fragment>
  );
};

export default ChangePwd;
