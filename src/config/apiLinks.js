const apiLinks = {
  GET: {
    sectors: '/api/comm/sectors',
    clientTypes: '/api/comm/client-types',
    types: '/api/comm/types',
    clients: '/api/comm/clients',
    clientById: '/api/comm/clients-by-id/',
    accs: '/api/comm/acc',
    modalities: '/api/comm/modalities',
    methods: '/api/comm/methods',
    labtests: '/api/comm/labtests',
    purchases: '/api/comm/purchases',
    devis: '/api/comm/devis',
    nextDevisId: '/api/comm/next-devis-id',
    invoices: '/api/comm/invoices',
    nextInvoiceId: '/api/comm/next-invoice-id',
    deliveryNotes: '/api/comm/delivery-notes',
    creditNotes: '/api/comm/credit-notes',
    samples: '/api/labo/samples',
    reports: '/api/labo/reports'
  },
  POST: {
    clients: '/api/comm/clients',
    methods: '/api/comm/methods',
    labtests: '/api/comm/labtests'
  },
  PUT: {
    clients: '/api/comm/clients',
    methods: '/api/comm/methods',
    labtests: '/api/comm/labtests'
  }
};

export default apiLinks;
