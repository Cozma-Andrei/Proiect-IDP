import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-semibold text-purple-700">
            <Link to="/admin/dashboard" className="mr-4 hover:text-purple-500">
              Dashboard Statistici
            </Link>
            <Link to="/admin/users" className="mr-4 hover:text-purple-500">
              Gestiune Utilizatori
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
