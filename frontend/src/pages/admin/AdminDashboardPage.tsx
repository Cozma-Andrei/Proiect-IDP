import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface SystemStats {
  users: number;
  doctors: number;
  verifiedDoctors: number;
  patients: number;
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Se încarcă statisticile...</div>;
  if (!stats) return <div className="text-red-500">Eroare la preluarea statisticilor. Verificați consola.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Administrator</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-blue-500">
          <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Total Utilizatori</h3>
          <p className="text-4xl font-extrabold text-gray-900">{stats.users}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-green-500">
          <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Total Doctori</h3>
          <p className="text-4xl font-extrabold text-gray-900">{stats.doctors}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-purple-500">
          <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Doctori Verificați</h3>
          <p className="text-4xl font-extrabold text-gray-900">{stats.verifiedDoctors}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-orange-500">
          <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Total Pacienți</h3>
          <p className="text-4xl font-extrabold text-gray-900">{stats.patients}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
