import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
import InputLabel from '@mui/material/InputLabel';
import { DatePicker, Select, Switch, Radio, Form } from 'antd';
import { BsInfoCircleFill } from 'react-icons/bs';
import { RiUserStarFill } from 'react-icons/ri';
import { HiReceiptTax } from 'react-icons/hi';
import Card from 'elements/MainCard';

const ClientLegend = () => (
  <div className="fw-bold d-flex flex-column justify-content-between mt-1">
    <div className="fw-bold align-items-center d-flex">
      <RiUserStarFill size={20} className="me-1" /> Client membre de C.A.
    </div>
    <div className="fw-bold align-items-center d-flex">
      <HiReceiptTax size={20} className="me-1" /> Client exonéré de TVA
    </div>
  </div>
);

/**
 * Composant SelectInput
 * ---------------------
 * Un champ de sélection réutilisable avec validation.
 * Affiche automatiquement le message d'erreur si le champ est requis.
 *
 * Props :
 * - `label` : Libellé affiché pour le champ
 * - `name` : Nom du champ correspondant dans le formulaire
 * - `options` : Liste des options disponibles
 * - `values` : Valeurs du formulaire (Formik/AntD)
 * - `legend` (optionnel) : Affiche la légende explicative sous l'input si activé
 */
const SelectInput = ({ label, name, options, values, legend }) => (
  <Col>
    <InputLabel htmlFor={name}>{label}</InputLabel>
    <Form.Item name={name} rules={[{ required: true, message: `${label} est obligatoire` }]}>
      <Select
        style={{ width: '100%' }}
        name={name}
        placeholder={`Sélectionner ${label.toLowerCase()}`}
        value={values[name] || null}
        options={options}
        allowClear
        showSearch
        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
      />
    </Form.Item>
    {legend && <ClientLegend />}
  </Col>
);

/**
 * Composant ClientInput
 * ---------------------
 * Sélecteur permettant de choisir un client.
 * - Affiche des icônes indiquant si le client est exonéré de TVA (TVA)
 *   ou membre du conseil d'administration (C.A.).
 * - Utilise `useMemo` pour optimiser la génération des options.
 *
 * Props :
 * - `clientOptions` : Liste des clients disponibles
 * - `values` : Valeurs actuelles du formulaire
 */
const ClientInput = ({ clientOptions, values }) => {
  const clientLabel = (client) => (
    <div className="d-flex justify-content-between align-items-center w-100">
      <span>{client.client_name}</span>
      <span>
        {Boolean(client.client_is_ht) && <HiReceiptTax />}
        {Boolean(client.client_is_ca) && <RiUserStarFill />}
      </span>
    </div>
  );

  const clientSelectOptions = useMemo(
    () =>
      clientOptions.map((client) => ({
        value: client.client_id,
        label: clientLabel(client)
      })),
    [clientOptions]
  );

  return <SelectInput label="Client" name="devis_fk_client_id" options={clientSelectOptions} values={values} legend={true} />;
};

const DateInput = ({ values }) => (
  <Col>
    <InputLabel htmlFor="devis_date">Date du devis</InputLabel>
    <Form.Item name="devis_date" rules={[{ required: true, message: 'La date du devis est obligatoire' }]}>
      <DatePicker format="DD/MM/YYYY" className="w-100" name="devis_date" value={values.devis_date} />
    </Form.Item>
  </Col>
);

/*
 * Composant OtherInputs
 * ---------------------
 * Champs supplémentaires de configuration du devis
 * - T.V.A. : Si la T.V.A. est inclue
 * - Forfait : Si le devis est un forfait
 * - Devise : Choix entre DH et EUR
 *
 * Props :
 * - `values` : Valeurs actuelles du formulaire
 * */

const OtherInputs = ({ values }) => {
  const switchs = [
    { label: 'T.V.A.', name: 'devis_tax' },
    { label: 'Forfait', name: 'devis_forfait' }
  ];
  return (
    <Col>
      <Row>
        {switchs.map(({ label, name }) => (
          <Col key={name}>
            <InputLabel htmlFor={name}>{label}</InputLabel>
            <Form.Item name={name} rules={[{ required: true, message: `${label} est obligatoire` }]}>
              <Switch name={name} checkedChildren="Oui" unCheckedChildren="Non" />
            </Form.Item>
          </Col>
        ))}
        <Col>
          <InputLabel htmlFor="devis_currency">Devise</InputLabel>
          <Form.Item name="devis_currency" rules={[{ required: true, message: 'La devise est obligatoire' }]}>
            <Radio.Group name="devis_currency" value={values.devis_currency}>
              <Radio.Button value="DH">DH</Radio.Button>
              <Radio.Button value="EUR">EUR</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
    </Col>
  );
};

/**
 * Composant DevisInfo
 * -------------------
 * Ce composant affiche les informations générales du devis.
 * Il inclut la sélection du client, le type de prestation, le secteur,
 * la modalité, la date et d'autres options de configuration.
 *
 * Il utilise Bootstrap pour la mise en page et Ant Design pour les éléments de formulaire.
 *
 * Props :
 * - `form` : Instance du formulaire Ant Design
 * - `values` : Valeurs actuelles du formulaire
 * - `clientOptions` : Liste des clients disponibles
 * - `typeOptions` : Liste des types de prestation
 * - `sectorOptions` : Liste des secteurs disponibles
 * - `modalityOptions` : Liste des modalités de paiement et de livraison
 */
function DevisInfo({ values, clientOptions, typeOptions, sectorOptions, modalityOptions }) {
  return (
    <Card title={'Information du devis'} icon={<BsInfoCircleFill />}>
      <Row className="mb-3">
        <ClientInput values={values} clientOptions={clientOptions} />
        <SelectInput label="Type de prestation" name="devis_fk_type_id" options={typeOptions} values={values} />
        <SelectInput label="Secteur" name="devis_fk_sector_id" options={sectorOptions} values={values} />
      </Row>
      <Row className="mb-3">
        <SelectInput label="Modalité" name="devis_fk_modality_id" options={modalityOptions} values={values} />
        <DateInput values={values} />
        <OtherInputs values={values} />
      </Row>
    </Card>
  );
}

export default DevisInfo;

DevisInfo.propTypes = {
  values: PropTypes.object.isRequired,
  clientOptions: PropTypes.array.isRequired,
  typeOptions: PropTypes.array.isRequired,
  sectorOptions: PropTypes.array.isRequired,
  modalityOptions: PropTypes.array.isRequired
};
SelectInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  legend: PropTypes.bool
};
ClientInput.propTypes = {
  clientOptions: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired
};
DateInput.propTypes = {
  values: PropTypes.object.isRequired
};
OtherInputs.propTypes = {
  values: PropTypes.object.isRequired
};
