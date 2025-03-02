const apiLinks = {
  GET: {
    auth: '/api/auth',
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
    devis: (filter) => `/api/comm/devis/${filter}`,
    devisPdf: (devisId) => `/api/comm/devis-pdf/${devisId}`,
    nextDevisId: '/api/comm/next-devis-id',
    invoices: '/api/comm/invoices',
    nextInvoiceId: '/api/comm/next-invoice-id',
    devisOptions: (id) => `/api/comm/devis-options/${id}`,
    invoiceNorms: '/api/comm/invoice-norms',
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
  },
  logout: '/api/logout'
};

export default apiLinks;
