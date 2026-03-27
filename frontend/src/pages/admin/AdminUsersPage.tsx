import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isConfirmed: boolean;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
      alert('Rol modificat cu succes!');
    } catch (err) {
      alert('Eroare la modificarea rolului.');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm('Ești sigur/ă că vrei să dezactivezi acest utilizator? Această acțiune nu îl va șterge, doar nu-i va mai permite logarea până la reactivare.')) return;
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      fetchUsers();
      alert('Utilizator dezactivat!');
    } catch (err) {
      alert('Eroare la dezactivare.');
    }
  };

  if (loading) return <div>Se încarcă utilizatorii...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestionare Utilizatori</h2>
      <div className="bg-white shadow rounded-xl overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilizator</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol Curent</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{u.username}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">{u._id}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="border border-gray-300 rounded-lg p-1.5 text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="User">User</option>
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {u.isConfirmed ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Activ</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Inactiv</span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.isConfirmed && (
                      <button
                        onClick={() => handleDeactivate(u._id)}
                        className="text-red-500 hover:text-red-700 hover:underline text-sm font-semibold transition"
                      >
                        Dezactivează
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">Nu a fost găsit niciun utilizator.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
