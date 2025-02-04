const excelOptions = {
  clients: {
    include: [
      'client_name',
      'client_city',
      'client_address',
      'sector_name',
      'client_type_name',
      'client_person',
      'client_ct',
      'client_ice'
    ],
    exclude: [],
    headers: {
      client_name: 'Client',
      client_city: 'Ville',
      client_address: 'Adresse',
      sector_name: 'Secteur',
      client_type_name: 'Nature',
      client_person: 'Contact',
      client_ct: 'Compte Client',
      client_ice: 'ICE'
    },
    fileName: 'Clients'
  },
  methods: {
    include: ['method_full_id', 'method_name', 'acc_desc'],
    exclude: [],
    headers: {
      method_full_id: 'Code',
      method_name: 'Méthode',
      acc_desc: 'Accréditation'
    },
    fileName: 'Méthodes'
  },
  labtests: {
    include: ['labtest_full_id', 'labtest_designation', 'method_name', 'sector_name', 'acc_name', 'labtest_price'],
    exclude: [],
    headers: {
      labtest_full_id: 'Code',
      labtest_designation: 'Essai',
      method_name: 'Méthode',
      sector_name: 'Secteur',
      acc_name: 'Accréditation',
      labtest_price: 'Prix'
    },
    fileName: 'Essais'
  },
  purchases: {
    include: [
      'purchase_order_ref',
      'purchase_date',
      'client_name',
      'devis_formatted_id',
      'file_full_id',
      'devis_total_ht',
      'devis_total_ttc'
    ],
    exclude: [],
    headers: {
      purchase_order_ref: 'Commande',
      purchase_date: 'Date',
      client_name: 'Client',
      devis_formatted_id: 'Devis',
      file_full_id: 'Dossier',
      devis_total_ht: 'Montant HT',
      devis_total_ttc: 'Montant TTC'
    },
    fileName: 'Commandes'
  },
  deliveryNotes: {
    include: ['dn_full_id', 'client_name', 'dn_date', 'invoice_full_id', 'devis_formatted_id', 'file_full_id', 'purchase_order_ref'],
    exclude: [],
    headers: {
      dn_full_id: 'Bon de Livraison',
      dn_date: 'Date',
      client_name: 'Client',
      invoice_full_id: 'Facture',
      devis_formatted_id: 'Devis',
      file_full_id: 'Dossier',
      purchase_order_ref: 'Date de commande'
    },
    fileName: 'Bons de Livraison'
  },
  creditNotes: {
    include: [
      'cn_full_id',
      'cn_comment',
      'client_name',
      'cn_date',
      'invoice_full_id',
      'devis_formatted_id',
      'file_full_id',
      'purchase_order_ref'
    ],
    exclude: [],
    headers: {
      cn_full_id: 'Avoir',
      cn_comment: 'Commentaire',
      cn_date: 'Date',
      client_name: 'Client',
      invoice_full_id: 'Facture',
      devis_formatted_id: 'Devis',
      file_full_id: 'Dossier',
      purchase_order_ref: 'Date de commande'
    },
    fileName: 'Avoirs'
  },
  samples: {
    include: ['sample_full_id', 'sample_name', 'sample_description', 'sample_date', 'client_name', 'file_full_id'],
    exclude: [],
    headers: {
      sample_full_id: 'Code',
      sample_name: 'Nom',
      sample_description: 'Description',
      sample_date: 'Date',
      client_name: 'Client',
      file_full_id: 'Dossier'
    },
    fileName: 'Echantillons'
  },
  reports: {
    include: ['report_full_id', 'report_type', 'client_name', 'report_date', 'file_full_id', 'devis'],
    exclude: [],
    headers: {
      report_full_id: 'Rapport',
      report_type: 'Type',
      client_name: 'Client',
      report_date: 'Date',
      file_full_id: 'Dossier',
      devis: 'Devis'
    },
    fileName: 'Rapports'
  }
};

export default excelOptions;
