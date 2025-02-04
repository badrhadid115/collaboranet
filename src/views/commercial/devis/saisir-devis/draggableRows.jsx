import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';
import { Form, InputNumber, Select, Input, Tooltip, Button } from 'antd';
import { MdDeleteSweep } from 'react-icons/md';
import { currencyFormatter } from 'utils/genUtils';
import Editor from 'elements/RTFEditor';
// Composant pour le champ de sélection d'un essai
const optionRender = ({ value, label, labtestOptions }) => (
  <div className="d-flex justify-content-between">
    <div className="d-flex flex-column">
      <b>{label}</b>
      <em>{`${labtestOptions.find((lt) => lt.labtest_id === value)?.method_name} [${labtestOptions.find((lt) => lt.labtest_id === value)?.acc_name}]`}</em>
    </div>
    <div className="text-end">{currencyFormatter(labtestOptions.find((lt) => lt.labtest_id === value)?.labtest_price, 'DH')}</div>
  </div>
);
const LabtestSelect = ({ field, index, labtestOptions, form }) => {
  const selectedLabtestIds = form.getFieldValue('elements')?.map((e) => e.element_fk_labtest_id) || [];
  const currentLabtest = labtestOptions.find((lt) => lt.labtest_id === form.getFieldValue(['elements', index, 'element_fk_labtest_id']));

  const options = labtestOptions.map((lt) => ({
    value: lt.labtest_id,
    label: lt.labtest_designation,
    disabled: selectedLabtestIds.includes(lt.labtest_id) && lt.labtest_id !== currentLabtest?.labtest_id
  }));

  return (
    <Form.Item
      name={[field.name, 'element_fk_labtest_id']}
      className="m-0"
      rules={[{ required: true, message: 'Veuillez choisir un essai' }]}
    >
      <Select
        style={{ width: '100%', maxWidth: 700 }}
        variant="borderless"
        placeholder="Sélectionner un essai"
        allowClear
        showSearch
        options={options}
        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        filterSort={(optionA, optionB) => (optionA?.label ?? '').localeCompare(optionB?.label ?? '')}
        optionRender={({ value, label }) => optionRender({ value, label, labtestOptions })}
        popupClassName="popup-select"
        popupMatchSelectWidth
        onChange={(value) => {
          form.setFieldValue(['elements', index, 'element_price'], labtestOptions.find((lt) => lt.labtest_id === value)?.labtest_price);
        }}
      />
    </Form.Item>
  );
};

// Composant pour le champ de quantité
const QuantityInput = ({ field }) => (
  <Form.Item name={[field.name, 'element_quantity']} className="m-0">
    <InputNumber step={1} variant="borderless" size="small" min={0.01} max={9999} />
  </Form.Item>
);

// Composant pour le champ de remise
const DiscountInput = ({ field }) => (
  <Form.Item name={[field.name, 'element_discount']} className="m-0">
    <InputNumber
      variant="borderless"
      size="small"
      formatter={(value) => `${value}%`}
      parser={(value) => value.replace('%', '')}
      step={5}
      min={0}
      max={99}
    />
  </Form.Item>
);
const PriceInput = ({ field }) => {
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
    <Form.Item name={[field.name, 'element_price']} className="m-0">
      <InputNumber step={1} variant="borderless" size="small" formatter={priceFormatter} parser={priceParser} min={0} max={999999} />
    </Form.Item>
  );
};
// Composant pour afficher les prix formatés
const PriceDisplay = ({ value }) => <span className="text-nowrap text-end">{currencyFormatter(value)}</span>;

/**
 * Composant `DraggableRowST`
 * -----------------------------
 * - Affiche une ligne de tableau permettant de gérer un élément de la liste des essais
 * - Permet de modifier l'essai, la quantité, la remise et de supprimer la ligne
 * - Utilise `react-dnd` pour le glisser-déposer
 *
 * Props :
 * - `field` : Objet représentant un élément du tableau
 * - `index` : Index de l'élément dans la liste
 * - `labtestOptions` : Liste des essais disponibles
 * - `form` : Instance du formulaire Ant Design
 * - `remove` : Fonction permettant de supprimer un élément de la liste
 * - `conversionRate` : Taux de conversion monétaire
 */
export const DraggableRowST = ({ field, index, labtestOptions, form, remove, conversionRate }) => {
  const labtest = labtestOptions.find((lt) => lt.labtest_id === form.getFieldValue(['elements', index, 'element_fk_labtest_id']));
  const defaultPrice = labtest?.labtest_price || 0;
  const price = form.getFieldValue(['elements', index, 'element_price']) || defaultPrice;
  const quantity = form.getFieldValue(['elements', index, 'element_quantity']) || 1;
  const discount = form.getFieldValue(['elements', index, 'element_discount']) || 0;
  const totalPrice = (price * quantity * (1 - discount / 100)) / conversionRate;

  return (
    <Draggable draggableId={String(field.key)} index={index}>
      {(provided) => (
        <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <td>{labtest?.labtest_full_id}</td>
          <td>
            <LabtestSelect field={field} index={index} labtestOptions={labtestOptions} form={form} />
            <Form.Item name={[field.name, 'element_note']} className="m-0">
              <Input.TextArea placeholder="Note" rows={1} className="trans-input m-0" style={{ fontStyle: 'italic' }} />
            </Form.Item>
          </td>
          <td>{labtest?.method_name}</td>
          <td>{labtest?.acc_name}</td>
          <td>
            <QuantityInput field={field} />
          </td>
          <td>
            <DiscountInput field={field} />
          </td>
          <td className="text-end text-nowrap">
            <PriceInput field={field} />
          </td>
          <td className="text-end text-nowrap">
            <PriceDisplay value={totalPrice} />
          </td>
          <td style={{ width: '1%' }}>
            <Tooltip title="Supprimer">
              <Button type="text" onClick={() => remove(field.name)} style={{ color: '#cf2020', padding: 0 }}>
                <MdDeleteSweep size={20} />
              </Button>
            </Tooltip>
          </td>
        </tr>
      )}
    </Draggable>
  );
};

const DesignationInput = ({ field }) => (
  <Form.Item
    name={[field.name, 'element_designation']}
    className="m-0"
    rules={[{ required: true, message: 'Veuillez saisir la designation' }]}
  >
    <Editor />
  </Form.Item>
);

export const DraggableRowFF = ({ field, index, form, remove, conversionRate }) => {
  const totalPrice =
    ((form.getFieldValue(['elements', index, 'element_price']) || 0) *
      (form.getFieldValue(['elements', index, 'element_quantity']) || 1) *
      (1 - (form.getFieldValue(['elements', index, 'element_discount']) || 0) / 100)) /
    conversionRate;

  return (
    <Draggable draggableId={String(field.key)} index={index}>
      {(provided) => (
        <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <td>
            <DesignationInput field={field} />
          </td>
          <td>
            <QuantityInput field={field} />
          </td>
          <td>
            <DiscountInput field={field} />
          </td>
          <td className="text-nowrap text-end">
            <PriceInput field={field} />
          </td>
          <td className="text-nowrap text-end">{currencyFormatter(totalPrice)}</td>
          <td style={{ width: '1%' }}>
            <Tooltip title="Supprimer">
              <Button type="text" onClick={() => remove(field.name)} style={{ color: 'red', padding: 0 }}>
                <MdDeleteSweep size={20} />
              </Button>
            </Tooltip>
          </td>
        </tr>
      )}
    </Draggable>
  );
};
LabtestSelect.propTypes = {
  field: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  labtestOptions: PropTypes.arrayOf(
    PropTypes.shape({
      labtest_id: PropTypes.number.isRequired,
      labtest_full_id: PropTypes.string,
      labtest_designation: PropTypes.string,
      method_name: PropTypes.string,
      acc_name: PropTypes.string,
      labtest_price: PropTypes.number
    })
  ).isRequired,
  form: PropTypes.object.isRequired
};
QuantityInput.propTypes = {
  field: PropTypes.object.isRequired
};
DiscountInput.propTypes = {
  field: PropTypes.object.isRequired
};
PriceDisplay.propTypes = {
  value: PropTypes.number.isRequired
};
DraggableRowST.propTypes = {
  field: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  labtestOptions: PropTypes.arrayOf(
    PropTypes.shape({
      labtest_id: PropTypes.number.isRequired,
      labtest_full_id: PropTypes.string,
      labtest_designation: PropTypes.string,
      method_name: PropTypes.string,
      acc_name: PropTypes.string,
      labtest_price: PropTypes.number
    })
  ).isRequired,
  form: PropTypes.object.isRequired,
  remove: PropTypes.func.isRequired,
  conversionRate: PropTypes.number.isRequired
};
DesignationInput.propTypes = {
  field: PropTypes.object.isRequired
};
PriceInput.propTypes = {
  field: PropTypes.object.isRequired
};
DraggableRowFF.propTypes = {
  field: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  form: PropTypes.object.isRequired,
  remove: PropTypes.func.isRequired,
  conversionRate: PropTypes.number.isRequired
};
