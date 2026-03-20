import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PatientSearchPage: React.FC = () => {
  const [patientId, setPatientId] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      navigate(`/doctor/patient/${patientId.trim()}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg ">
      <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Caută Pacient</h3>
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Pacient</label>
          <input 
            type="text" 
            value={patientId} 
            onChange={e => setPatientId(e.target.value)} 
            placeholder="Introdu numele sau numarul de telefon pacientului"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required 
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition"
        >
          Caută
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600 text-center">
        Pentru a vizualiza datele unui pacient, introduceți numele acestuia sau numarul de telefon.
      </p>
    </div>
  );
};

export default PatientSearchPage;
