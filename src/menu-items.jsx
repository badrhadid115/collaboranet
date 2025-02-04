const menuItems = {
  items: [
    {
      id: 'home',
      title: 'Accueil',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard',
          title: 'Tableau de bord',
          type: 'item',
          icon: 'fa fa-tachometer-alt',
          url: '/'
        },
        {
          id: 'statistics',
          title: 'Statistiques',
          type: 'item',
          icon: 'fa fa-chart-line',
          url: '/statistiques'
        }
      ]
    },
    {
      id: 'commercial',
      title: 'Commercial',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'clients',
          title: 'Clients',
          type: 'item',
          icon: 'feather icon-users',
          url: '/clients'
        },
        {
          id: 'articles',
          title: 'Articles',
          type: 'collapse',
          icon: 'fa fa-flask',
          children: [
            {
              id: 'methods',
              title: 'Méthodes',
              type: 'item',
              url: '/methodes'
            },
            {
              id: 'labtests',
              title: 'Essais',
              type: 'item',
              url: '/essais'
            }
          ]
        },
        {
          id: 'devis',
          title: 'Devis',
          type: 'item',
          icon: 'fa fa-file-invoice',
          url: '/devis',
          badge: {
            title: '1',
            type: 'label-danger'
          }
        },
        {
          id: 'purchases',
          title: 'Commandes',
          type: 'item',
          icon: 'fa fa-tags',
          url: '/commandes'
        },
        {
          id: 'invoices',
          title: 'Factures',
          type: 'item',
          icon: 'fa fa-file-invoice-dollar',
          url: '/factures'
        },
        {
          id: 'delivery-notes',
          title: 'Bons de livraison',
          type: 'item',
          icon: 'fa fa-file-alt',
          url: '/bons-de-livraison'
        },
        {
          id: 'credit-notes',
          title: 'Avoirs',
          type: 'item',
          icon: 'fa fa-receipt',
          url: '/avoirs'
        },
        {
          id: 'agreements',
          title: 'Conventions',
          type: 'item',
          icon: 'fa fa-file-contract',
          url: '/conventions'
        }
      ]
    },
    {
      id: 'laboratory',
      title: 'Laboratoire',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'samples',
          title: 'Echantillons',
          type: 'item',
          icon: 'fa fa-vials',
          url: '/echantillons'
        },
        {
          id: 'rapports',
          title: 'Rapports',
          type: 'item',
          icon: 'fa fa-clipboard',
          url: '/rapports'
        },
        {
          id: 'files',
          title: 'Dossiers Clients',
          type: 'item',
          icon: 'fa fa-folder-open',
          url: '/dossiers',
          badge: {
            title: '1',
            type: 'label-danger'
          }
        },
        {
          id: 'tasks',
          title: 'Tâches',
          type: 'item',
          icon: 'fa fa-tasks',
          url: '/taches',
          badge: {
            title: '1',
            type: 'label-danger'
          }
        }
      ]
    },
    {
      id: 'finance',
      title: 'Financier',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'transactions',
          title: 'Ordres de virement',
          type: 'item',
          icon: 'fa fa-exchange-alt',
          url: '/ordres-de-virement'
        },
        {
          id: 'bank-accounts',
          title: 'Comptes bancaires',
          type: 'item',
          icon: 'fa fa-university',
          url: '/comptes-bancaires'
        },
        {
          id: 'beneficiaries',
          title: 'Bénéficiaires',
          type: 'item',
          icon: 'fa fa-user-tie',
          url: '/beneficiaires'
        }
      ]
    },
    {
      id: 'certification',
      title: 'Certification',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'sample-plans',
          title: "Plans d'échantillonnage",
          type: 'item',
          icon: 'fa fa-vial',
          url: '/plans-dechantillonnage'
        },
        {
          id: 'deviations',
          title: "Fiches d'écarts",
          type: 'item',
          icon: 'fa fa-exclamation-triangle',
          url: '/fiches-decart'
        },
        {
          id: 'eval-reports',
          title: "Rapports d'évaluation",
          type: 'item',
          icon: 'fa fa-file-alt',
          url: '/rapports-devaluation'
        },
        {
          id: 'certificates',
          title: 'Attestations',
          type: 'item',
          icon: 'fa fa-certificate',
          url: '/attestations'
        },
        {
          id: 'certification-requests',
          title: 'Demandes de certification',
          type: 'item',
          icon: 'fa fa-folder',
          url: '/demandes-de-certification'
        }
      ]
    },
    {
      id: 'administration',
      title: 'Administration',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'users',
          title: 'Utilisateurs',
          type: 'item',
          icon: 'fa fa-user-friends',
          url: '/utilisateurs'
        },
        {
          id: 'activities',
          title: 'Journal des activités',
          type: 'item',
          icon: 'fa fa-history',
          url: '/journal-des-activites'
        },
        {
          id: 'login-history',
          title: 'Historique de connexion',
          type: 'item',
          icon: 'fa fa-sign-in-alt',
          url: '/historique-de-connexion'
        }
      ]
    },
    {
      id: 'links',
      title: 'Liens utiles',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'norms',
          title: 'Normes',
          type: 'item',
          icon: 'fa fa-globe',
          url: '/normes'
        },
        {
          id: 'certification-bodies',
          title: "Portées d'accreditation",
          type: 'collapse',
          icon: 'fa fa-building',
          children: [
            {
              id: 'semac',
              title: 'SEMAC',
              type: 'item',
              url: '/semac'
            },
            {
              id: 'cofrac',
              title: 'COFRAC',
              type: 'item',
              url: '/cofrac'
            },
            {
              id: 'renault',
              title: 'Renault',
              type: 'item',
              url: '/renault'
            },
            {
              id: 'nadcap',
              title: 'NADCAP',
              type: 'item',
              url: '/nadcap'
            },
            {
              id: 'onssa',
              title: 'ONSSA',
              type: 'item',
              url: '/onssa'
            },
            {
              id: 'airbus',
              title: 'Airbus',
              type: 'item',
              url: '/airbus'
            }
          ]
        },
        {
          id: 'about',
          title: 'A propos',
          type: 'item',
          icon: 'fa fa-info-circle',
          url: '/a-propos'
        }
      ]
    }
  ]
};

export default menuItems;
