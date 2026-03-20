import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { DocumentData } from '../../types';

const AnalysesPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await api.get('/document');
        setDocuments(res.data.documents || res.data || []);
      } catch (err) {
        console.error(err);
        setError("Eroare la încărcarea analizelor.");
      }
    };
    fetchDocuments();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white shadow-md rounded-xl">
      <h3 className="text-2xl font-semibold text-blue-700 mb-4">
        Analize și Documente Medicale
      </h3>

      {error && (
        <p className="text-red-600 font-medium mb-4">{error}</p>
      )}

      {documents.length === 0 ? (
        <p className="text-gray-500 italic">Nu există documente încărcate.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map(doc => (
            <li
              key={doc._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 px-4 py-3 rounded-md shadow-sm border border-gray-200"
            >
              <div>
                <p className="text-gray-800 font-medium">{doc.documentType}</p>
                <p className="text-sm text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </p>
              </div>
              {doc.documentPath && (
                <a
                  href={`http://localhost:5000/${doc.documentPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-2 sm:mt-0"
                >
                  Descarcă
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AnalysesPage;
