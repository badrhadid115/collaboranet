const AuthNotifications = {
    pwdReset: {
        title: "Réinitialisation de mot de passe",
        content: "Une demande de réinitialisation de mot de passe de votre compte a été reçue. Si vous n'êtes pas à l'origine de cette demande, contactez l'administrateur immédiatement. Sinon, veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe.",
        link: (token) => `reinitialiser-mdp?token=${token}`,
    },
    pwdResetSuccess: {
        title: "Mot de passe réinitialisé",
        content: "Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'administrateur en urgence.",
    },
    blockedAccount: {
        title: "Compte bloqueé",
        content: "Votre compte a été bloqueé. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'administrateur en urgence.",
    },
    LoginAttempt: {
        title: "Tentative de connexion",
        content: "Une tentative de connexion réussie a été effectuée sur votre compte. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'administrateur en urgence.",
    },
    ChangePwd : {
        title: "Changement de mot de passe",
        content: "Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'administrateur en urgence.",
    },
}

module.exports = AuthNotifications;
