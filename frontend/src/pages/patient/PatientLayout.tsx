import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const PatientLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-semibold text-blue-700">
            <Link to="/patient/history" className="mr-4 hover:text-blue-500">Istoric Medical</Link>
            <Link to="/patient/analyses" className="mr-4 hover:text-blue-500">Analize</Link>
            <Link to="/patient/medications" className="mr-4 hover:text-blue-500">Medicamente</Link>
            <Link to="/patient/allergies" className="mr-4 hover:text-blue-500">Alergii</Link>
            <Link to="/patient/meal-plan" className="mr-4 hover:text-blue-500">Plan Alimentar</Link>
            <Link to="/patient/appointments" className="mr-4 hover:text-blue-500">Programări</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default PatientLayout;
