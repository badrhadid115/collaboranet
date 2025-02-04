const AuthMessages = {
  pwdMismatch: {
    title: 'Erreur de mot de passe',
    subtitle: 'le nouveau mot de passe et sa confirmation ne correspondent pas'
  },
  LinkNotFound: {
    title: 'Lien invalide',
    subtitle: 'Le lien de réinitialisation de mot de passe est invalide ou a expiré'
  },
  LinkExpired: {
    title: 'Lien expiré',
    subtitle: 'Le lien de réinitialisation de mot de passe a expiré'
  },
  pwdResetSuccess: {
    title: 'Mot de passe réinitialisé',
    subtitle: 'Votre mot de passe a été modifié avec succès, nous allons vous rediriger vers la page de connexion'
  },
  WrongPwd: {
    title: 'Mot de passe incorrect',
    subtitle: 'Veuillez entrer un mot de passe valide'
  },
  ChangePwd: {
    title: 'Mot de passe modifié',
    subtitle: 'Votre mot de passe a été modifié avec succès,ous allons vous rediriger vers la page de connexion.'
  },
  ChangePP: {
    title: 'Photo de profil modifiée',
    subtitle: 'Votre photo de profil a été modifiée avec succès'
  },
  NoPhoto: {
    title: 'Aucune image fournie',
    subtitle: 'Veuillez fournir une image pour la photo de profil'
  },
  DeletePP: {
    title: 'Photo de profil supprimée',
    subtitle: 'Votre photo de profil a été supprimée avec succès'
  }
};

module.exports = AuthMessages;
