const AuthMessages = require('./authMess');
const CommMessages = require('./commMess');
const Errors = {
  serverError: {
    title: 'Erreur serveur',
    subtitle: 'Une erreur est survenue, veuillez réessayer plus tard'
  },
  Error400: {
    title: 'Requête invalide',
    subtitle: 'La requête envoyée est invalide'
  },
  Error401: {
    title: "Erreur d'authentification",
    subtitle: 'Vos identifiants sont incorrects'
  },
  Error403: {
    title: 'Accès refusé',
    subtitle: "Vous n'avez pas les droits nécessaires pour accéder à cette ressource ou effectuer cette action"
  },
  Error404: {
    title: 'Ressource introuvable',
    subtitle: 'La ressource demandée est introuvable'
  }
};
const messages = {
  //

  ...AuthMessages,
  ...CommMessages,
  // Add other messages here
  ...Errors
};

module.exports = messages;
