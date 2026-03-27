import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ChooseProfilePage: React.FC = () => {
  const { chooseProfile, hasDoctorProfile, hasPatientProfile, role } = useAuth();
  const navigate = useNavigate();
  const hasAdmin = role === 'Admin';

  useEffect(() => {
    let profileCount = 0;
    if (hasDoctorProfile) profileCount++;
    if (hasPatientProfile) profileCount++;
    if (hasAdmin) profileCount++;

    if (profileCount <= 1) {
      navigate('/', { replace: true });
    }
  }, [hasDoctorProfile, hasPatientProfile, hasAdmin, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg border text-center">
        <h2 className="text-3xl font-extrabold mb-4 text-gray-800">Selectează Profilul</h2>
        <p className="text-gray-600 mb-8 text-sm">
          Contul tău are asociate atât un profil de Doctor, cât și unul de Pacient. 
          Te rugăm să alegi în ce portal dorești să navighezi acum.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {hasPatientProfile && (
            <button
              onClick={() => chooseProfile('Patient')}
              className="flex-1 min-w-[200px] flex flex-col items-center justify-center p-6 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-500 transition text-blue-700"
            >
              <span className="text-4xl mb-3">👤</span>
              <span className="text-xl font-semibold">Intră ca Pacient</span>
            </button>
          )}

          {hasDoctorProfile && (
            <button
              onClick={() => chooseProfile('Doctor')}
              className="flex-1 min-w-[200px] flex flex-col items-center justify-center p-6 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-500 transition text-green-700"
            >
              <span className="text-4xl mb-3">🩺</span>
              <span className="text-xl font-semibold">Intră ca Doctor</span>
            </button>
          )}

          {hasAdmin && (
            <button
              onClick={() => chooseProfile('Admin')}
              className="flex-1 min-w-[200px] flex flex-col items-center justify-center p-6 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-500 transition text-purple-700"
            >
              <span className="text-4xl mb-3">🛠️</span>
              <span className="text-xl font-semibold">Intră ca Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChooseProfilePage;
