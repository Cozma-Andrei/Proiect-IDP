import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface ReportData {
  actionBreakdown: { _id: string; count: number }[];
  dailyActivity: { _id: string; count: number }[];
  topUsers: { _id: string; count: number }[];
  appointmentsByStatus: { _id: string; count: number }[];
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Autentificare',
  REGISTER: 'Înregistrare',
  CREATE_PATIENT: 'Creare Pacient',
  UPDATE_PATIENT: 'Actualizare Pacient',
  CREATE_DOCTOR: 'Creare Doctor',
  VERIFY_DOCTOR: 'Verificare Doctor',
  UPLOAD_DOCUMENT: 'Încărcare Document',
  DELETE_DOCUMENT: 'Ștergere Document',
  CREATE_RECORD: 'Creare Înregistrare',
  CREATE_PRESCRIPTION: 'Creare Prescripție',
  CREATE_RECOMMENDATION: 'Creare Recomandare',
  CREATE_APPOINTMENT: 'Creare Programare',
  UPDATE_ROLE: 'Schimbare Rol',
  DEACTIVATE_USER: 'Dezactivare Utilizator',
  SEND_MESSAGE: 'Trimitere Mesaj',
};

const STATUS_LABELS: Record<string, string> = {
  Scheduled: 'Programată',
  Completed: 'Finalizată',
  Cancelled: 'Anulată',
  Pending: 'În așteptare',
  Confirmed: 'Confirmată',
};

const AdminReportsPage: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get('/admin/report');
        setReport(response.data.report);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div>Se generează raportul...</div>;
  if (!report) return <div className="text-red-500">Eroare la generarea raportului.</div>;

  const maxActionCount = Math.max(...report.actionBreakdown.map(a => a.count), 1);
  const maxDailyCount = Math.max(...report.dailyActivity.map(d => d.count), 1);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Rapoarte Statistice</h2>

      {/* Action Breakdown */}
      <div className="bg-white shadow rounded-xl p-6 border-t-4 border-indigo-500">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Distribuție Acțiuni</h3>
        <div className="space-y-2">
          {report.actionBreakdown.map(item => (
            <div key={item._id} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-48 truncate">{ACTION_LABELS[item._id] || item._id}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-5 rounded-full transition-all"
                  style={{ width: `${(item.count / maxActionCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-800 w-12 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Activity (last 30 days) */}
      <div className="bg-white shadow rounded-xl p-6 border-t-4 border-green-500">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Activitate Zilnică (Ultimele 30 zile)</h3>
        {report.dailyActivity.length === 0 ? (
          <p className="text-gray-400 italic">Nu există date pentru ultimele 30 de zile.</p>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {report.dailyActivity.map(day => (
              <div key={day._id} className="flex flex-col items-center min-w-[20px]" title={`${day._id}: ${day.count} acțiuni`}>
                <div
                  className="w-4 bg-green-400 rounded-t hover:bg-green-600 transition-colors"
                  style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-[9px] text-gray-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {day._id.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Active Users */}
        <div className="bg-white shadow rounded-xl p-6 border-t-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Utilizatori Activi</h3>
          <ol className="space-y-2">
            {report.topUsers.map((user, i) => (
              <li key={user._id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-2">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-yellow-200 text-yellow-800' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-800 text-sm">{user._id}</span>
                </span>
                <span className="text-sm font-bold text-blue-700">{user.count} acțiuni</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Appointment Status Distribution */}
        <div className="bg-white shadow rounded-xl p-6 border-t-4 border-orange-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Stare Programări</h3>
          <div className="space-y-3">
            {report.appointmentsByStatus.map(item => (
              <div key={item._id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{STATUS_LABELS[item._id] || item._id}</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
