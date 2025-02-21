import { AutoComplete, Input, List } from 'antd';
import { Col } from 'react-bootstrap';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
export const renderAutocompleteOptions = (options, config) => {
  const renderMeta = (option) => (
    <List.Item.Meta
      title={
        <div className="d-flex justify-content-between">
          <span className="fw-bold fs-6">{option[config.labelKey]}</span>
          {config.extraFields?.rt && <span className="fs-6">{option[config.extraFields.rt]}</span>}
        </div>
      }
      description={
        <div className="d-flex justify-content-between">
          {config.extraFields?.lb && <div className="fw-bold">{option[config.extraFields.lb]}</div>}
          {config.extraFields?.rb && <div className="fw-bold">{option[config.extraFields.rb]}</div>}
        </div>
      }
    />
  );
  const generateLink = (template, option) => {
    return template.replace(/:(\w+)/g, (_, key) => option[key] || '');
  };

  return options.map((option) => {
    const value = option[config.valueKey] || '';
    const label = (
      <List.Item key={option[config.keyField]}>
        <Link to={generateLink(config.link, option)} className="text-decoration-none">
          {option.key !== config.valueKey && (
            <div className="d-flex justify-content-between text-muted">
              <small>{option.value}</small> <small className="fw-bold">{config.keyLabels[option.key]}</small>
            </div>
          )}
          {renderMeta(option)}
        </Link>
      </List.Item>
    );

    return { value, label };
  });
};
export const SearchBar = ({ autocompleteOptions, handleSearch, autoCompleteConfig }) => {
  return (
    <Col md={4} sm={6} xs={12}>
      <AutoComplete
        options={renderAutocompleteOptions(autocompleteOptions, autoCompleteConfig)}
        onSearch={handleSearch}
        placeholder="Rechercher ..."
        style={{ minWidth: '100%' }}
      >
        <Input.Search placeholder="Rechercher ..." allowClear />
      </AutoComplete>
    </Col>
  );
};
SearchBar.propTypes = {
  autocompleteOptions: PropTypes.array,
  handleSearch: PropTypes.func,
  autoCompleteConfig: PropTypes.object
};
