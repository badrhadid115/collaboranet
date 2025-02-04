import { Link } from 'react-router-dom';
export const renderFileLink = (text, record) => {
  if (!record.file_full_id) {
    return <span className="text-warning">Non Défini</span>;
  }

  if (record.CanSeeLink) {
    return <Link to={`/dossiers-client/${record.file_full_id}`}>{text}</Link>;
  }

  return text;
};
export const renderDevisGroup = (text, record, permission) => {
  if (Array.isArray(record.devis) && record.devis.length > 0) {
    return (
      <div>
        {record.devis.map((devis) =>
          permission ? (
            <Link
              key={devis.devis_id}
              to={`/devis/${devis.devis_full_id}/${devis.devis_version}`}
              style={{ display: 'block', marginBottom: '4px' }}
            >
              {devis.devis_formatted_id}
            </Link>
          ) : (
            <div key={devis.devis_id} style={{ marginBottom: '4px' }}>
              {devis.devis_formatted_id}
            </div>
          )
        )}
      </div>
    );
  }
  return <span className="text-warning">Non Défini</span>;
};
