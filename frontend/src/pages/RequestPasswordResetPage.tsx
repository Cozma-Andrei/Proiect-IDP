import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const RequestPasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.post('/auth/reset-password', { email });
      setMessage(response.data.message || 'Emailul a fost trimis cu succes.');
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("A apărut o eroare la trimiterea emailului. Vă rugăm să încercați din nou.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Resetare Parolă</h2>
        
        {message ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">{message}</p>
            <Link to="/login" className="text-blue-600 hover:underline">
              Înapoi la Autentificare
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Introduceți adresa de email asociată contului dumneavoastră. Vă vom trimite un link securizat pentru a vă reseta parola.
            </p>
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
              {loading ? "Se trimite..." : "Trimite Link"}
            </button>

            <div className="text-center mt-4 text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">
                Înapoi la Autentificare
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestPasswordResetPage;
