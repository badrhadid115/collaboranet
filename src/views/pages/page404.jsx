import { Result } from 'antd';

const Page404 = () => {
  return (
    <Result
      status="404"
      title="Erreur 404: La page que vous recherchez n'existe pas."
      subTitle="Cette erreur peut être due à une mauvaise saisie de l'adresse URL, ou à un lien obsolète. Si vous pensez qu'il s'agit d'une erreur de notre part, veuillez contactez le service informatique."
    />
  );
};

export default Page404;
