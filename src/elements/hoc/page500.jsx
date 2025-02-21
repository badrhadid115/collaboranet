import { Result } from 'antd';

const Page500 = () => {
  return (
    <Result
      status="500"
      title="Erreur 500: Erreur interne du serveur"
      subTitle="Une erreur interne est survenue sur le serveur. Veuillez contacter l'administrateur."
    />
  );
};

export default Page500;
