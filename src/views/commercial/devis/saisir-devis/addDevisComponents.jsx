import PropTypes from 'prop-types';

import { Row, Col } from 'react-bootstrap';
import { Form, Input, Button, Tooltip, Popconfirm } from 'antd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { BlobProvider } from '@react-pdf/renderer';

import { MdAdd } from 'react-icons/md';
import { HiDocumentPlus } from 'react-icons/hi2';
import { VscClearAll } from 'react-icons/vsc';
import { FaFilePdf } from 'react-icons/fa6';
import { IoIosWarning } from 'react-icons/io';

import logo from 'assets/images/full-logo.png';
import { DraggableRowST, DraggableRowFF } from './draggableRows';
import { currencyFormatter } from 'utils/genUtils';
import { GenMan } from 'config/constant';
import Devis from 'pdf-templates/devis';
//Composant entête de la page web du devis
export function DevisPageHeader({ form, loading, handleReset, pdfData, type }) {
  return (
    <Row className="mb-3 align-items-center justify-content-between">
      <Col>
        <h2>Saisir un Devis</h2>
        <h5>Devis {type === 'devis-standard' ? 'Standard' : 'Format Libre'}</h5>
      </Col>
      <Col className="float-end">
        <Popconfirm
          title="Êtes-vous sûr de vouloir saisisr ce nouveau devis?"
          onConfirm={() => {
            form.submit();
          }}
          okButtonProps={{ loading: loading, disabled: loading }}
          okText="Oui"
          cancelText="Non"
          placement="bottomRight"
        >
          <Tooltip title="Saisir un devis">
            <Button type="primary" shape="circle" className="float-end ms-2" icon={<HiDocumentPlus size={25} />} size="large" />
          </Tooltip>
        </Popconfirm>
        <BlobProvider document={<Devis devisData={pdfData} />}>
          {({ url, loading, error }) => (
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
                onClick={() => {
                  window.open(url, '_blank');
                }}
              />
            </Tooltip>
          )}
        </BlobProvider>
        <Popconfirm
          title="Êtes-vous sûr de vouloir réinitialiser le devis?"
          onConfirm={handleReset}
          okText="Oui"
          cancelText="Non"
          placement="bottomRight"
        >
          <Tooltip title="Réinitialiser le devis">
            <Button type="secondary" shape="circle" className="float-end" icon={<VscClearAll size={25} />} size="large" />
          </Tooltip>
        </Popconfirm>
      </Col>
    </Row>
  );
}
DevisPageHeader.propTypes = {
  form: PropTypes.object,
  loading: PropTypes.bool,
  handleReset: PropTypes.func,
  pdfData: PropTypes.object,
  type: PropTypes.string
};
//Composant entéte du devis
export function DevisHeader({ values, devisFormattedId }) {
  return (
    <Row className="mb-3">
      <Row className="d-flex align-items-center">
        <Col>
          <img src={logo} alt="logo" className="img-devis" />
        </Col>
        <Col className="text-end">
          <h5 className="fw-bold">Devis N° {devisFormattedId}</h5>
          <h6>Date: {values.devis_date.format('DD/MM/YYYY')}</h6>
          <h6>Validité: {values.devis_date.add(1, 'months').format('DD/MM/YYYY')}</h6>
        </Col>
      </Row>
    </Row>
  );
}
DevisHeader.propTypes = {
  values: PropTypes.object,
  devisFormattedId: PropTypes.string
};
//Composant client et objet
export function ClientAndObject({ values, clientOptions }) {
  return (
    <>
      <Row>
        <Col className="me-5">
          <div className="devis-box">
            <h4 className="fw-bold">Client</h4>
            <div>
              <span className="text-dark">{clientOptions.find((c) => c.client_id === values.devis_fk_client_id)?.client_name}</span>
              <br />
              <span className="text-dark">{clientOptions.find((c) => c.client_id === values.devis_fk_client_id)?.client_city}</span>
            </div>
          </div>
        </Col>
        <Col>
          <div className="devis-box">
            <h4 className="fw-bold">Objet</h4>
            <div>
              <Form.Item name="devis_object" rules={[{ required: true, message: "L'objet est obligatoire" }]}>
                <Input.TextArea
                  name="devis_object"
                  value={values.devis_object}
                  autoSize={{ minRows: 3, maxRows: 3 }}
                  placeholder="Objet du devis"
                  className="trans-input"
                />
              </Form.Item>
            </div>
          </div>
        </Col>
      </Row>
      <Row className="text-dark mt-3 mb-3">
        <span>Madame, Monsieur,</span>
        <span>Suite à votre demande, nous avons le plaisir de vous faire parvenir notre offre commerciale :</span>
      </Row>
    </>
  );
}

ClientAndObject.propTypes = {
  values: PropTypes.object,
  clientOptions: PropTypes.array
};
//Composant Table de devis standard
export function DevisElementsST({ onDragEnd, labtestOptions, form, conversionRate }) {
  return (
    <Row>
      <Form.List name="elements">
        {(fields, { add, remove }) => (
          <DragDropContext
            onDragEnd={(result) => {
              onDragEnd(result, fields);
            }}
          >
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
                    <div className="d-flex flex-column">
                      <span>Qté.</span>
                    </div>
                  </th>
                  <th scope="col">
                    <div className="d-flex flex-column">
                      <span>Rem.</span>
                    </div>
                  </th>
                  <th scope="col" className="text-nowrap">
                    Prix H.T.
                  </th>
                  <th scope="col" className="text-nowrap">
                    Total H.T.
                  </th>
                </tr>
              </thead>
              <Droppable droppableId="table">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {fields.map((field, index) => (
                      <DraggableRowST
                        key={field.key}
                        field={field}
                        index={index}
                        labtestOptions={labtestOptions}
                        form={form}
                        remove={remove}
                        conversionRate={conversionRate}
                      />
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
            <Form.Item>
              <Button type="button" onClick={() => add({ element_fk_labtest_id: null, element_quantity: 1, element_discount: 0 })} block>
                <MdAdd /> Ajouter un essai
              </Button>
            </Form.Item>
          </DragDropContext>
        )}
      </Form.List>
    </Row>
  );
}
DevisElementsST.propTypes = {
  onDragEnd: PropTypes.func,
  labtestOptions: PropTypes.array,
  form: PropTypes.object,
  conversionRate: PropTypes.number
};
export function DevisElementsFF({ onDragEnd, form, conversionRate }) {
  return (
    <Row>
      <Form.List name="elements">
        {(fields, { add, remove }) => (
          <DragDropContext
            onDragEnd={(result) => {
              onDragEnd(result, fields);
            }}
          >
            <table className="text-dark">
              <thead>
                <tr>
                  <th scope="col" className="w-50">
                    Désignation
                  </th>
                  <th scope="col">
                    <div className="d-flex flex-column">
                      <span>Qté.</span>
                    </div>
                  </th>
                  <th scope="col">
                    <div className="d-flex flex-column">
                      <span>Rem.</span>
                    </div>
                  </th>
                  <th scope="col" className="text-nowrap">
                    Prix H.T.
                  </th>
                  <th scope="col" className="text-nowrap">
                    Total H.T.
                  </th>
                </tr>
              </thead>
              <Droppable droppableId="table">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {fields.map((field, index) => (
                      <DraggableRowFF
                        key={field.key}
                        field={field}
                        index={index}
                        form={form}
                        remove={remove}
                        conversionRate={conversionRate}
                      />
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
            <Form.Item>
              <Button
                type="button"
                onClick={() => add({ element_designation: '', element_quantity: 1, element_discount: 0, element_price: 0 })}
                block
              >
                <MdAdd /> Ajouter une désignation
              </Button>
            </Form.Item>
          </DragDropContext>
        )}
      </Form.List>
    </Row>
  );
}
DevisElementsFF.propTypes = {
  onDragEnd: PropTypes.func,
  form: PropTypes.object,
  conversionRate: PropTypes.number
};
//Composant Notes du devis (entree par l'utilisateur)
export function DevisNote({ values }) {
  return (
    <Row>
      <Col>
        <div>
          <Form.Item name="devis_note">
            <Input.TextArea
              name="devis_note"
              value={values.devis_note}
              autoSize={{ minRows: 3, maxRows: 3 }}
              placeholder="Notes"
              className="trans-input"
            />
          </Form.Item>
        </div>
      </Col>
    </Row>
  );
}
DevisNote.propTypes = {
  values: PropTypes.object
};
//Composant Notes sur le devis (non modifiable par l'utilisateur)
export function Notes({ values, modalityOptions }) {
  return (
    <Col xs={8}>
      <div className="devis-box">
        <h4 className="fw-bold">Notes</h4>
        <p className="text-dark">
          <b>Modalité de paiement:</b> {modalityOptions.find((m) => m.value === values.devis_fk_modality_id)?.label}
          <br />
          <b>Délai de livraison:</b> À planifier lors de la réception de votre bon de commande
          <br />
          <b>Validité de l&apos;offre:</b> 1 mois
          <br />
          <b>
            <em>Sauf spécification contraire, la conformité est déclarée sans tenir en compte les incertitudes</em>
          </b>
          <br />
          <br />
          <b>
            *:Acc. (Accréditation): La nature d&apos;accriditation de l&apos;essai; Cofrac : CO . Semac: SE . ND: Nadcap. Non Accrédité : NA
          </b>
        </p>
      </div>
    </Col>
  );
}

Notes.propTypes = {
  values: PropTypes.object,
  modalityOptions: PropTypes.array
};
//Composant Total
export function Totals({ totals, conversionRate, values }) {
  return (
    <Col xs={2}>
      <table className="text-dark">
        <tbody>
          <tr>
            <td className="fw-bold">Total H.T.</td>
            <td className="text-end text-nowrap">
              {isNaN(totals.totalHT) || totals.totalHT === 0 ? (
                <span className="text-danger">#Erreur#</span>
              ) : (
                currencyFormatter(totals.totalHT / conversionRate, values.devis_currency)
              )}
            </td>
          </tr>
          {Boolean(values.devis_tax) && (
            <tr>
              <td className="fw-bold">T.V.A. (20%)</td>
              <td className="text-end text-nowrap">
                {isNaN(totals.totalTVA) || totals.totalTVA === 0 ? (
                  <span className="text-danger">#Erreur#</span>
                ) : (
                  currencyFormatter(totals.totalTVA / conversionRate, values.devis_currency)
                )}
              </td>
            </tr>
          )}
          {Boolean(values.devis_tax) && (
            <tr>
              <td className="fw-bold">Total TTC</td>
              <td className="text-end text-nowrap">
                {isNaN(totals.totalTTC) || totals.totalTTC === 0 ? (
                  <span className="text-danger">#Erreur#</span>
                ) : (
                  currencyFormatter(totals.totalTTC / conversionRate, values.devis_currency)
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Col>
  );
}
Totals.propTypes = {
  totals: PropTypes.object,
  conversionRate: PropTypes.number,
  values: PropTypes.object
};

//Composant Pied de page
export function DevisFooter({ devisFormattedId }) {
  return (
    <>
      <Row>
        <div className="text-dark mt-3 w-100 d-flex justify-content-between">
          <div className="client-signature ">
            <span>ACCEPTATION DE L&apos;OFFRE {devisFormattedId}</span>
            <br />
            <span>Date / Nom / Signature / Cachet de la société</span>
          </div>

          <div className="gm-signature">
            <span className="fw-bold">DIRECTEUR GÉNÉRAL</span>
            <br />
            <span className="fw-bold">{GenMan}</span>
          </div>
        </div>
      </Row>
      <Row className="text-dark mt-3 mb-3 border-bottom text-center">
        <span className="fw-bold fs-6">Merci de nous avoir fait confiance</span>
        <br />
        <small className="fw-bold mb-3">
          Si vous avez des questions concernant ce devis, Veuillez contacter le Responsable Technico-Commercial : commercial@ctpc.ma
        </small>
      </Row>
      <Row>
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
          <small className="fw-bold">FO-M-03-01-Indice 06</small>
          <small className="fw-bold">Rattachée à la procédure PGM.03</small>
        </Col>
      </Row>
    </>
  );
}

DevisFooter.propTypes = {
  devisFormattedId: PropTypes.string
};
