import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { MedicalRecord } from '../../types';

const MedicalHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/medicalRecord/patient');
        setRecords(res.data.medicalRecords || res.data.records || []);
      } catch (err: any) {
        console.error(err);
        setError("Eroare la încărcarea istoricului medical.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 bg-white shadow-md rounded-xl space-y-6">
      <h3 className="text-2xl font-semibold text-blue-700">Istoric Medical</h3>

      {loading && <p className="text-gray-500">Se încarcă...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && records.length === 0 && (
        <p className="text-gray-500 italic">Nu există înregistrări medicale.</p>
      )}

      <ul className="space-y-4">
        {records.map(record => (
          <li
            key={record._id}
            className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded shadow-sm"
          >
            <p className="font-semibold text-gray-800">
              {new Date(record.recordDate).toLocaleDateString()}: {record.diagnosis}
            </p>
            <p className="text-gray-700">{record.observations}</p>
            {record.recommendedTreatment && (
              <p className="text-sm text-gray-600 italic">
                Tratament recomandat: {record.recommendedTreatment}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MedicalHistoryPage;
