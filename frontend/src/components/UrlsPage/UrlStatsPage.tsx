import { useParams } from "react-router-dom";

const UrlStatsPage = () => {
  const { id } = useParams();

  return <div>UrlStatsPage of {id}</div>;
};

export default UrlStatsPage;
