const autoCompleteConfig = {
  Clients: {
    valueKey: 'client_name',
    labelKey: 'client_name',
    keyField: 'client_id',
    link: '/clients/:client_name',
    extraFields: { rt: 'client_person', lb: 'sector_name', rb: 'client_type_name' }
  }
};
export default autoCompleteConfig;
