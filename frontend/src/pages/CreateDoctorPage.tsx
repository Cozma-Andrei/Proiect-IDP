import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CreateDoctorPage: React.FC = () => {
  const { logout } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!firstName || !lastName || !specialization || !phone) {
      setError('Toate câmpurile obligatorii trebuie completate.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.post('/doctor', {
        firstName,
        lastName,
        specialization,
        phone
      });
      alert(response.data.message);
      logout();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data && typeof err.response.data === 'object') {
        const errorMessages = Object.entries(err.response.data)
          .map(([field, messages]: [string, any]) => {
            const msgs = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msgs}`;
          })
          .join(' | ');
        setError(errorMessages || 'Crearea profilului a eșuat. Încercați din nou.');
      } else {
        setError('Crearea profilului a eșuat. Încercați din nou.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Creare Profil Doctor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Prenume</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Nume</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Specializare</label>
            <input
              type="text"
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Telefon</label>
            <input
              type="text"
              value={phone}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, ''); // Keep only digits
                setPhone(value);
              }}
              placeholder="Ex: 0712345678"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {loading ? 'Se încarcă...' : 'Crează Profil'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDoctorPage;
