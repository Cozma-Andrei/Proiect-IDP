import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface SystemStats {
  users: number;
  doctors: number;
  verifiedDoctors: number;
  patients: number;
  appointments: number;
  documents: number;
  medicalRecords: number;
  prescriptions: number;
  activityLogs: number;
  recentLogins24h: number;
  recentUploads24h: number;
}

const StatCard: React.FC<{ label: string; value: number; color: string; subtitle?: string }> = ({ label, value, color, subtitle }) => (
  <div className={`bg-white p-5 rounded-xl shadow border-t-4 ${color}`}>
    <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">{label}</h3>
    <p className="text-3xl font-extrabold text-gray-900">{value}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

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

  if (loading) return <div>Se incarca statisticile...</div>;
  if (!stats) return <div className="text-red-500">Eroare la preluarea statisticilor. Verificati consola.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Administrator</h2>

      {/* Primary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Utilizatori" value={stats.users} color="border-blue-500" />
        <StatCard label="Total Doctori" value={stats.doctors} color="border-green-500" subtitle={`${stats.verifiedDoctors} verificati`} />
        <StatCard label="Total Pacienti" value={stats.patients} color="border-orange-500" />
        <StatCard label="Programari" value={stats.appointments} color="border-purple-500" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Documente Cloud" value={stats.documents} color="border-cyan-500" />
        <StatCard label="Inregistrari Medicale" value={stats.medicalRecords} color="border-teal-500" />
        <StatCard label="Prescriptii" value={stats.prescriptions} color="border-pink-500" />
        <StatCard label="Log-uri Activitate" value={stats.activityLogs} color="border-gray-500" />
      </div>

      {/* Activity Summary */}
      <div className="bg-white shadow rounded-xl p-6 border-t-4 border-indigo-500">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Activitate Recenta (Ultimele 24h)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">Autentificari</span>
            <span className="text-2xl font-bold text-blue-800">{stats.recentLogins24h}</span>
          </div>
          <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-green-700 font-medium">Documente Incarcate</span>
            <span className="text-2xl font-bold text-green-800">{stats.recentUploads24h}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
