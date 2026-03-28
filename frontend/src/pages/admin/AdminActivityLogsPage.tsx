import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface ActivityLogEntry {
  _id: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
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
  DOWNLOAD_DOCUMENT: 'Descărcare Document',
  CREATE_RECORD: 'Creare Înregistrare',
  UPDATE_RECORD: 'Actualizare Înregistrare',
  CREATE_PRESCRIPTION: 'Creare Prescripție',
  CREATE_RECOMMENDATION: 'Creare Recomandare',
  CREATE_APPOINTMENT: 'Creare Programare',
  UPDATE_APPOINTMENT: 'Actualizare Programare',
  UPDATE_ROLE: 'Schimbare Rol',
  DEACTIVATE_USER: 'Dezactivare Utilizator',
  SEND_MESSAGE: 'Trimitere Mesaj',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  UPLOAD_DOCUMENT: 'bg-green-100 text-green-800',
  DELETE_DOCUMENT: 'bg-red-100 text-red-800',
  CREATE_RECORD: 'bg-purple-100 text-purple-800',
  VERIFY_DOCTOR: 'bg-yellow-100 text-yellow-800',
  UPDATE_ROLE: 'bg-orange-100 text-orange-800',
  DEACTIVATE_USER: 'bg-red-100 text-red-800',
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async (page: number, action: string) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 30 };
      if (action) params.action = action;
      const response = await api.get('/admin/activity-logs', { params });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage, filterAction);
  }, [currentPage, filterAction]);

  const handleFilterChange = (action: string) => {
    setFilterAction(action);
    setCurrentPage(1);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Log-uri de Activitate</h2>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-600">Filtrează:</span>
        <button
          onClick={() => handleFilterChange('')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
            !filterAction ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Toate
        </button>
        {ALL_ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => handleFilterChange(action)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterAction === action ? 'bg-gray-800 text-white' : (ACTION_COLORS[action] || 'bg-gray-100 text-gray-600') + ' hover:opacity-80'
            }`}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500">Se încarcă log-urile...</div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white shadow rounded-xl overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data/Ora</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilizator</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acțiune</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entitate</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalii</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors text-sm">
                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('ro-RO')}
                      </td>
                      <td className="p-3 font-medium text-gray-800">{log.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{log.entity}</td>
                      <td className="p-3 text-gray-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                      <td className="p-3 text-gray-400 font-mono text-xs">{log.ipAddress}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">Nu există log-uri de activitate.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600">
                Pagina {pagination.page} din {pagination.pages} ({pagination.total} total)
              </span>
              <button
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-40"
              >
                Următor →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminActivityLogsPage;
