import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { PatientData } from '../../types';

const AllergiesPage: React.FC = () => {
  const [info, setInfo] = useState<PatientData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get('/patient/medical-data');
        const data = res.data.patient || res.data;
        setInfo(data);
      } catch (err) {
        console.error(err);
        setError("Eroare la încărcarea datelor medicale personale.");
      }
    };
    fetchInfo();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h3 className="text-2xl font-semibold mb-4 text-blue-700">
        Alergii și Istoric Medical General
      </h3>

      {error && (
        <p className="text-red-600 font-medium mb-4">{error}</p>
      )}

      {info ? (
        <div className="space-y-4">
          <p>
            <span className="font-semibold text-gray-800">Alergii declarate:</span>{' '}
            {info.allergies ? (
              <span className="text-gray-700">{info.allergies}</span>
            ) : (
              <span className="text-gray-500 italic">Nicio alergie specificată.</span>
            )}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Istoric medical general:</span>{' '}
            {info.medicalHistory ? (
              <span className="text-gray-700">{info.medicalHistory}</span>
            ) : (
              <span className="text-gray-500 italic">Niciun istoric medical general introdus.</span>
            )}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 italic">Se încarcă...</p>
      )}
    </div>
  );
};

export default AllergiesPage;
