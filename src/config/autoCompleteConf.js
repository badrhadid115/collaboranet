const autoCompleteConfig = {
  Clients: {
    valueKey: 'client_name',
    labelKey: 'client_name',
    keyField: 'client_id',
    link: '/clients/:client_name',
    extraFields: { rt: 'client_city', lb: 'sector_name', rb: 'client_type_name' },
    keyLabels: { client_ice: 'ICE', client_ct: 'Compte Client', client_person: 'Contact' }
  },
  Methods: {
    valueKey: 'method_name',
    labelKey: 'method_name',
    keyField: 'method_id',
    link: '#',
    extraFields: { rt: 'acc_desc' }
  },
  Labtests: {
    valueKey: 'labtest_designation',
    labelKey: 'labtest_designation',
    keyField: 'labtest_id',
    link: '#',
    extraFields: { rt: 'method_name', lb: 'acc_name', rb: 'sector_name' },
    keyLabels: { method_name: 'Methode' }
  },
  Devis: {
    valueKey: 'devis_formatted_id',
    labelKey: 'devis_formatted_id',
    keyField: 'devis_id',
    link: '/devis/:devis_full_id/:devis_version',
    extraFields: { lb: 'client_name' },
    keyLabels: { client_name: 'Client', devis_object: 'Objet' }
  },
  CreditNotes: {
    valueKey: 'cn_full_id',
    labelKey: 'cn_full_id',
    keyField: 'cn_id',
    link: '/credit-notes/:cn_full_id',
    extraFields: { rt: 'invoice_full_id', lb: 'client_name', rb: 'devis_formatted_id' },
    keyLabels: { client_name: 'Client', invoice_full_id: 'Facture', devis_formatted_id: 'Devis', purchase_order_ref: 'Commande' }
  },
  DeliveryNotes: {
    valueKey: 'dn_full_id',
    labelKey: 'dn_full_id',
    keyField: 'dn_id',
    link: '/delivery-notes/:dn_full_id',
    extraFields: { rt: 'invoice_full_id', lb: 'client_name', rb: 'devis_formatted_id' },
    keyLabels: { client_name: 'Client', invoice_full_id: 'Facture', devis_formatted_id: 'Devis', purchase_order_ref: 'Commande' }
  }
};
export default autoCompleteConfig;
