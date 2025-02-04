const CommMessages = {
  existingClient: {
    title: 'Client déjà existant',
    subtitle: 'Un client avec ce nom ou ICE existe déjà'
  },
  clientAdded: (name) => ({
    title: 'Client ajouté',
    subtitle: `Le client "${name}" a été ajouté avec succès`
  }),
  nonExistingClient: {
    title: 'Client invalide',
    subtitle: 'Veuillez choisir un client valide'
  },
  clientModified: (name) => ({
    title: 'Client modifié',
    subtitle: `Le client "${name}" a été modifié avec succès`
  }),
  existingMethod: {
    title: 'Méthode déjà existante',
    subtitle: 'Une méthode avec ce nom existe déjà'
  },
  nonExistingAcc: {
    title: 'Accréditation invalide',
    subtitle: 'Veuillez choisir une accréditation valide'
  },
  methodAdded: (name) => ({
    title: 'Méthode ajoutée',
    subtitle: `La méthode "${name}" a été ajoutée avec succès`
  }),
  nonExistingMethod: {
    title: 'Méthode invalide',
    subtitle: 'Veuillez choisir une méthode valide'
  },
  methodModified: (name) => ({
    title: 'Méthode modifiée',
    subtitle: `La méthode "${name}" a été modifiée avec succès`
  }),
  existingLabtest: {
    title: 'Essai déjà existant',
    subtitle: 'Un essai avec ce nom existe déjà'
  },
  nonExistingSector: {
    title: 'Secteur invalide',
    subtitle: 'Veuillez choisir un secteur valide'
  },
  invalidPrice: {
    title: 'Prix invalide',
    subtitle: 'Veuillez saisir un prix valide, supérieur à 0 et inférieur à 1 000 000'
  },
  labtestAdded: (name) => ({
    title: 'Essai ajouté',
    subtitle: `L'essai "${name}" a été ajouté avec succès`
  }),
  nonExistingLabtest: {
    title: 'Essai invalide',
    subtitle: 'Veuillez choisir un essai valide'
  },
  labtestModified: (name) => ({
    title: 'Essai modifié',
    subtitle: `L'essai "${name}" a été modifié avec succès`
  })
};

module.exports = CommMessages;
