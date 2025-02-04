import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Form, Button, Popconfirm, Tooltip, DatePicker, Input, Radio, Select } from 'antd';
import { Row, Col } from 'react-bootstrap';
import dayjs from 'dayjs';
import axios from 'axios';
//used Icons
import { HiDocumentPlus } from 'react-icons/hi2';
import { FaFilePdf } from 'react-icons/fa6';
import { IoIosWarning } from 'react-icons/io';
import { VscClearAll } from 'react-icons/vsc';
import { BsInfoCircleFill } from 'react-icons/bs';
import { MdOutlineFormatListBulleted } from 'react-icons/md';
import Card from 'elements/MainCard';
import logo from 'assets/images/full-logo.png';
import { FloatToLetters } from 'utils/genUtils';
import { GenMan } from 'config/constant';
import apiLinks from 'config/apiLinks';
function SaisirFacture() {
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  document.title = `Saisir une Facture | ${import.meta.env.VITE_APP_NAME}`;
  const [invoiceId, setInvoiceId] = useState();
  const [clientOptions, setClientOptions] = useState([]);
  const [devisOptions, setDevisOptions] = useState([]);
  const [normOptions, setNormOptions] = useState([]);
  const [pdfData, setPdfData] = useState({});
  const initialDate = useMemo(() => (dayjs().date() < 5 ? dayjs().subtract(1, 'month').endOf('month') : dayjs()), []);
  const initialValues = {
    invoice_date: initialDate,
    invoice_notes: '',
    invoice_conformity: '',
    invoice_comment: '',
    invoice_fk_devis_id: '',
    invoice_fk_norm_id: ''
  };
  async function getInvoiceId(date) {
    try {
      const invoiceId = await axios.get(`${apiLinks.GET.nextInvoiceId}?date=${date}`);
      setInvoiceId(invoiceId.data);
    } catch (err) {
      console.log(err);
    }
  }
  useEffect(() => {
    getInvoiceId(initialDate.format('YYYY-MM-DD'));
  }, [initialDate]);
  const handleDateChange = (date) => {
    getInvoiceId(date.format('YYYY-MM-DD'));
  };
  async function getClients () {
    try {
      const clients = await axios.get(apiLinks.GET.clients);
      setClientOptions(clients.data);
    } catch (err) {
      console.log(err);
    }
  }
  useEffect(() => {
    getClients();
  }, []);
  //temp var
  const error = false;
  const [form] = Form.useForm();
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  const handleSubmit = async (values) => {
    console.log(values);
  };
  return (
    <React.Fragment>
      <Spin spinning={loading} tip="Chargement des données...">
        <Form form={form} initialValues={initialValues} onFinish={handleSubmit}>
          <div className="desktop-only">
            <Row className="mb-3 align-items-center justify-content-between">
              <Col>
                <h2>Saisir une Facture</h2>
              </Col>
              <Col className="float-end">
                <Popconfirm
                  title="Êtes-vous sûr de vouloir saisir cette nouvelle facture?"
                  onConfirm={() => {
                    form.submit();
                  }}
                  okButtonProps={{ loading: loading, disabled: loading }}
                  okText="Oui"
                  cancelText="Non"
                  placement="bottomRight"
                >
                  <Tooltip title="Saisir la facture">
                    <Button type="primary" shape="circle" className="float-end ms-2" icon={<HiDocumentPlus size={25} />} size="large" />
                  </Tooltip>
                </Popconfirm>

                <Tooltip title={error ? 'PDF non disponible' : 'Aperçu PDF'}>
                  <Button
                    type="primary"
                    style={{ backgroundColor: error ? '#ff7800' : '#e30022' }}
                    shape="circle"
                    className="float-end ms-2"
                    icon={error ? <IoIosWarning size={25} /> : <FaFilePdf size={20} />}
                    size="large"
                    disabled={loading || error}
                    loading={loading}
                  />
                </Tooltip>

                <Popconfirm
                  title="Êtes-vous sûr de vouloir réinitialiser la facture?"
                  okText="Oui"
                  cancelText="Non"
                  placement="bottomRight"
                >
                  <Tooltip title="Réinitialiser la facture">
                    <Button type="secondary" shape="circle" className="float-end" icon={<VscClearAll size={25} />} size="large" />
                  </Tooltip>
                </Popconfirm>
              </Col>
            </Row>
            <Row className="mb-3">
              <Card title={'Information de la facture'} icon={<BsInfoCircleFill />}>
                <Row className="mb-3">
                  <Col>
                    <Select placeholder="Client" className="w-100"></Select>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Item name="invoice_date" rules={[{ required: true, message: 'La date est obligatoire' }]}>
                      <DatePicker
                        name="invoice_date"
                        format="DD/MM/YYYY"
                        className="w-100"
                        placeholder="Date de la facture"
                        onChange={handleDateChange}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Row>
            <Row className="mb-3">
              <Card title={'Détails de la facture'} icon={<MdOutlineFormatListBulleted />} isOption={true}>
                <div className="paper text-dark">
                  <Row className="mb-3">
                    <Row className="d-flex align-items-center">
                      <Col>
                        <img src={logo} alt="logo" className="img-devis" />
                      </Col>
                      <Col className="text-end p-0">
                        <h5 className="fw-bold">Facture N° {invoiceId}</h5>
                        <h6>Date: {form?.getFieldValue('invoice_date')?.format('DD/MM/YYYY')}</h6>
                      </Col>
                    </Row>
                  </Row>
                  <Row className="mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="client-box">
                        <div className="mb-5">
                          <h4 className="fw-bold">Client</h4>
                          <span>Nom du client</span>
                          <br />
                          <span>Adresse du client</span>
                        </div>
                        <div>
                          <strong>ICE N°: </strong>
                          <span>123456789</span>
                        </div>
                      </div>
                      <div className="invoice-info-box">
                        <div className="mb-2 d-flex align-items-center w-100">
                          <div className="info-box">
                            <span>Devis N°</span>
                          </div>
                          <div className="info-text">
                            <span>25D0001</span>
                          </div>
                        </div>
                        <div className="mb-2 d-flex align-items-center w-100">
                          <div className="info-box">
                            <span>Réf de commande</span>
                          </div>
                          <div className="info-text">
                            <span>PO12345678</span>
                          </div>
                        </div>
                        <div className="mb-2 d-flex align-items-center w-100">
                          <div className="info-box">
                            <span>Date de commande</span>
                          </div>
                          <div className="info-text">
                            <span>{dayjs().format('DD/MM/YYYY')}</span>
                          </div>
                        </div>
                        <div className="mb-2 d-flex align-items-center w-100">
                          <div className="info-box">
                            <span>Dossier N°</span>
                          </div>
                          <div className="info-text">
                            <span>{dayjs().format('DD/MM/YYYY')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Row>
                  <Row className="mb-3">
                    <table className="text-dark">
                      <thead>
                        <tr>
                          <th scope="col" className="p-2">
                            Code
                          </th>
                          <th scope="col" className="w-50">
                            Désignation
                          </th>
                          <th scope="col">Méthode</th>
                          <th scope="col">Acc.*</th>
                          <th scope="col">
                            <span>Qté.</span>
                          </th>
                          <th scope="col">
                            <span>Rem.</span>
                          </th>
                          <th scope="col" className="text-nowrap">
                            Prix H.T.
                          </th>
                          <th scope="col" className="text-nowrap">
                            Total H.T.
                          </th>
                        </tr>
                      </thead>
                      {/*Test body */}
                      <tbody>
                        <tr>
                          <td>Code</td>
                          <td>Désignation</td>
                          <td>Méthode</td>
                          <td>Acc.*</td>
                          <td>Qté.</td>
                          <td>Rem.</td>
                          <td className="text-nowrap text-end">Prix H.T.</td>
                          <td className="text-nowrap text-end">Total H.T.</td>
                        </tr>
                        <tr>
                          <td>Code</td>
                          <td>Désignation</td>
                          <td>Méthode</td>
                          <td>Acc.*</td>
                          <td>Qté.</td>
                          <td>Rem.</td>
                          <td className="text-nowrap text-end">Prix H.T.</td>
                          <td className="text-nowrap text-end">Total H.T.</td>
                        </tr>
                      </tbody>
                    </table>
                  </Row>
                  <Row className="mb-3">
                    <Col xs={10}>
                      <div className="fs-6 mb-3">
                        <span className="me-2">Arrêtée la présente facture à la somme de:</span>
                        <strong>{FloatToLetters(12345.67, 'dirhams')}</strong>
                      </div>
                      <div className="fs-6">
                        <strong className="me-2">Modalités de paiement: </strong>
                        <span>Après 30 jours</span>
                      </div>
                    </Col>
                    <Col xs={2}>
                      <table className="text-dark">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Total H.T.</td>
                            <td className="text-end text-nowrap">10 000,00 DH</td>
                          </tr>

                          <tr>
                            <td className="fw-bold">T.V.A. (20%)</td>
                            <td className="text-end text-nowrap">2000,00 DH</td>
                          </tr>

                          <tr>
                            <td className="fw-bold">Total TTC</td>
                            <td className="text-end text-nowrap">12 000,00 DH</td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <div className="mt-3 w-100 d-flex justify-content-between">
                      <div className="bank-info">
                        <h6 className="fw-bold">Informations bancaires</h6>
                        <div className="border-bottom w-100" />
                        <div className="mb-2 d-flex flex-column">
                          <span>Banque: Banque Populaire</span>
                          <span>RIB: 190 780 2111679242340019 84</span>
                          <span>IBAN: MA84 1907 8021 1167 9242 3423 4001 984</span>
                          <span>SWIFT: BCPOMAMC</span>
                        </div>
                      </div>
                      <div className="gm-signature">
                        <span className="fw-bold">DIRECTEUR GÉNÉRAL</span>
                        <br />
                        <span className="fw-bold">{GenMan}</span>
                      </div>
                    </div>
                  </Row>
                  <Row className="border-top ">
                    <Col className="text-dark d-flex flex-column align-items-center w-100">
                      <small className="fw-bold">
                        Complexe des Centres Techniques, Bd Abdelmalek Essaâdi, Sidi Maârouf - 20280 - Casablanca - Maroc
                      </small>
                      <small className="fw-bold">Tél : +212 5 22 58 09 50/77 | Fax : +212 5 22 58 05 31 | E-mail : clients@ctpc.ma</small>
                      <small className="fw-bold">IF 2203774 | Patente : 36166737 | CNSS : 7376818 | ICE N°: 0016856000088</small>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="text-dark d-flex justify-content-between">
                      <small className="fw-bold">FO-M-03-01-Indice 04</small>
                      <small className="fw-bold">Rattachée à la procédure PGM.03</small>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Row>
          </div>
        </Form>
      </Spin>
      <div className="mobile-only">
        <div className="alert alert-warning d-flex flex-column align-items-center" role="alert">
          <IoIosWarning size={50} className="mb-4" />
          <p className="m-0">La saisie des factures n&apos;est pas disponible sur la version mobile.</p>
        </div>
      </div>
    </React.Fragment>
  );
}
export default SaisirFacture;
