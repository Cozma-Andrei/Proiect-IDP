import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { token, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  let linkColorClass = '';
  let linkHoverColorClass = '';
  if (token) {
    if (role === 'Doctor') {
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
              {role === 'Doctor' && (
                <>
                  <Link to="/doctor" className={`mr-4 ${linkHoverColorClass}`}>
                    Portal Doctor
                  </Link>
                  <Link to="/create-patient" className={`mr-4 ${linkHoverColorClass}`}>
                    Devino Pacient
                  </Link>
                </>
              )}
              {role === 'Patient' && (
                <>
                  <Link to="/patient" className={`mr-4 ${linkHoverColorClass}`}>
                    Portal Pacient
                  </Link>
                  <Link to="/create-doctor" className={`mr-4 ${linkHoverColorClass}`}>
                    Devino Doctor
                  </Link>
                </>
              )}
              {role === 'User' && (
                <>
                  <Link to="/create-patient" className={`mr-4 ${linkHoverColorClass}`}>
                    Devino Pacient
                  </Link>
                  <Link to="/create-doctor" className={`mr-4 ${linkHoverColorClass}`}>
                    Devino Doctor
                  </Link>
                </>
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
