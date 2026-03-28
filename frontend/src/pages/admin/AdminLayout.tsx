import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-semibold text-purple-700 flex flex-wrap gap-4">
            <Link to="/admin/dashboard" className="hover:text-purple-500 transition">
              Dashboard
            </Link>
            <Link to="/admin/users" className="hover:text-purple-500 transition">
              Utilizatori
            </Link>
            <Link to="/admin/doctors" className="hover:text-purple-500 transition">
              Aprobare Doctori
            </Link>
            <Link to="/admin/activity-logs" className="hover:text-purple-500 transition">
              Log-uri Activitate
            </Link>
            <Link to="/admin/reports" className="hover:text-purple-500 transition">
              Rapoarte
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
