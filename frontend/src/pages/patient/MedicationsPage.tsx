import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Prescription } from '../../types';

const MedicationsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await api.get('/prescription/patient');
        setPrescriptions(res.data.prescriptions || res.data || []);
      } catch (err) {
        console.error(err);
        setError("Eroare la încărcarea rețetelor.");
      }
    };
    fetchPrescriptions();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 bg-white shadow-md rounded-xl space-y-6">
      <h3 className="text-2xl font-semibold text-blue-700">Medicamente și Rețete</h3>

      {error && <p className="text-red-600">{error}</p>}

      {prescriptions.length === 0 ? (
        <p className="text-gray-500 italic">Nu există medicamente prescrise.</p>
      ) : (
        <ul className="space-y-4">
          {prescriptions.map(pres => (
            <li
              key={pres._id}
              className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded shadow-sm"
            >
              <p className="font-semibold text-gray-800">
                <strong>Medicație:</strong> {pres.medications}
              </p>
              <p className="text-gray-700">
                <strong>Dozaj:</strong> {pres.dosage}
              </p>
              {pres.observations && (
                <p className="text-sm text-gray-600 italic">
                  {pres.observations}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MedicationsPage;
