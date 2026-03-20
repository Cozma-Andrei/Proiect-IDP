import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Recommendation } from '../../types';

const MealPlanPage: React.FC = () => {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await api.get('/recommendation/patient');
        setRecs(res.data.recommendations || res.data || []);
      } catch (err) {
        console.error(err);
        setError("Eroare la încărcarea recomandărilor.");
      }
    };
    fetchRecs();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 bg-white shadow-md rounded-xl space-y-6">
      <h3 className="text-2xl font-semibold text-blue-700">Plan Alimentar și Recomandări</h3>

      {error && <p className="text-red-600">{error}</p>}

      {recs.length === 0 ? (
        <p className="text-gray-500 italic">Nu aveți recomandări personalizate încă.</p>
      ) : (
        <ul className="space-y-4">
          {recs.map(rec => (
            <li
              key={rec._id}
              className="p-4 bg-green-50 border-l-4 border-green-400 rounded shadow-sm"
            >
              <p className="text-gray-800">{rec.content}</p>
              <p className="text-sm text-gray-500 mt-1">
                Recomandat la {new Date(rec.issuedDate).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MealPlanPage;
