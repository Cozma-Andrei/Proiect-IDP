import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PatientSearchPage: React.FC = () => {
  const [cnp, setCnp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 13);
    setCnp(value);
    if (error) setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cnp.length !== 13) return;

    setLoading(true);
    setError(null);

    try {
      await api.get(`/patient/medical-data/${cnp}`);
      navigate(`/doctor/patient/${cnp}`);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Nu a fost găsit niciun pacient cu acest CNP.');
      } else {
        setError(err.response?.data?.message || 'Eroare la căutarea pacientului.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isValid = cnp.length === 13;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg ">
      <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Caută Pacient</h3>
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNP Pacient</label>
          <input 
            type="text" 
            value={cnp} 
            onChange={handleChange} 
            placeholder="Introduceți CNP-ul pacientului (13 cifre)"
            maxLength={13}
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
              error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            required 
          />
          <p className={`text-xs mt-1 ${isValid ? 'text-green-600' : 'text-gray-400'}`}>
            {cnp.length}/13 cifre
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={!isValid || loading}
          className={`w-full font-semibold py-2 px-4 rounded-xl transition ${
            isValid && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Se caută...' : 'Caută'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600 text-center">
        Pentru a vizualiza datele unui pacient, introduceți CNP-ul (Codul Numeric Personal) al acestuia.
      </p>
    </div>
  );
};

export default PatientSearchPage;
