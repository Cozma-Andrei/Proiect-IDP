import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface DoctorData {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  isVerified: boolean;
  userAccountId?: {
    _id: string;
    username: string;
    email: string;
  };
}

const AdminDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/admin/doctors');
      setDoctors(response.data.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleVerify = async (doctorId: string) => {
    if (!window.confirm('Confirmați verificarea acestui doctor? Odată verificat, doctorul va putea profesa pe platformă.')) return;
    try {
      await api.put(`/admin/doctors/${doctorId}/verify`);
      fetchDoctors();
      alert('Doctor verificat cu succes!');
    } catch (err) {
      alert('Eroare la verificarea doctorului.');
    }
  };

  if (loading) return <div>Se încarcă lista de doctori...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Aprobare Doctori</h2>
      <div className="bg-white shadow rounded-xl overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nume Doctor</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cont (Email / Username)</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Specializare</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map(doc => (
                <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">
                      Dr. {doc.lastName} {doc.firstName}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {doc.userAccountId ? (
                      <>
                        <div>{doc.userAccountId.email}</div>
                        <div className="text-xs text-gray-400">@{doc.userAccountId.username}</div>
                      </>
                    ) : (
                      <span className="italic text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{doc.specialization}</td>
                  <td className="p-4">
                    {doc.isVerified ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Verificat</span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">În așteptare</span>
                    )}
                  </td>
                  <td className="p-4">
                    {!doc.isVerified && (
                      <button
                        onClick={() => handleVerify(doc._id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition shadow-sm"
                      >
                        Aprobă Doctor
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">Nu a fost găsit niciun doctor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDoctorsPage;
