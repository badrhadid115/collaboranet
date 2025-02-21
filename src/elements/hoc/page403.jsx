import { Result } from 'antd';

const Page403 = () => {
  return (
    <Result
      status="403"
      title="Erreur 403 : Vous n'avez pas les droits pour accéder à cette page."
      subTitle="Vos permissions nous permettent pas d'accéder à cette page. Si vous pensez qu'il s'agit d'une erreur de notre part, veuillez contactez le service informatique."
    />
  );
};

export default Page403;
