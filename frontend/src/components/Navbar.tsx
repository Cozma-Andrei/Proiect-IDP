import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { token, activeProfile, hasDoctorProfile, hasPatientProfile, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  let linkColorClass = '';
  let linkHoverColorClass = '';
  if (token) {
    if (activeProfile === 'Doctor') {
      linkColorClass = 'text-green-700';
      linkHoverColorClass = 'hover:text-green-500';
    } else {
      linkColorClass = 'text-blue-700';
      linkHoverColorClass = 'hover:text-blue-500';
    }
  } else {
    linkColorClass = 'text-gray-800';
    linkHoverColorClass = '';
  }

  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <div className={`flex items-center ${token ? linkColorClass : ''}`}>
          <Link to="/" className="text-xl font-bold text-gray-800 mr-6">
            CareLog
          </Link>
          {token && (
            <>
              {activeProfile === 'Admin' && (
                <Link to="/admin" className={`mr-4 ${linkHoverColorClass}`}>
                  Portal Admin
                </Link>
              )}
              {hasDoctorProfile && activeProfile === 'Doctor' && (
                <Link to="/doctor" className={`mr-4 ${linkHoverColorClass}`}>
                  Portal Doctor
                </Link>
              )}
              {hasPatientProfile && activeProfile === 'Patient' && (
                <Link to="/patient" className={`mr-4 ${linkHoverColorClass}`}>
                  Portal Pacient
                </Link>
              )}
              {!hasDoctorProfile && (
                <Link to="/create-doctor" className={`mr-4 ${linkHoverColorClass}`}>
                  Devino Doctor
                </Link>
              )}
              {!hasPatientProfile && (
                <Link to="/create-patient" className={`mr-4 ${linkHoverColorClass}`}>
                  Devino Pacient
                </Link>
              )}
            </>
          )}
        </div>
        <div className="flex items-center">
          {token ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="mr-4 hover:underline">
                Autentificare
              </Link>
              <Link to="/register" className="hover:underline">
                Înregistrare
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
