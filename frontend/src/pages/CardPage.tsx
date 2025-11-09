import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import CardUI from '../components/CardUI';

const CardPage = () => {
  return (
    <div className="content-box">
      <PageTitle />
      <LoggedInName />
      <CardUI />
    </div>
  );
};

export default CardPage;

