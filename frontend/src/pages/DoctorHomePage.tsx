import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Appointment } from '../types';
import { motion } from 'framer-motion';

const DoctorHomePage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, profileRes] = await Promise.all([
          api.get('/appointment/doctor?limit=3'),
          api.get('/doctor/profile')
        ]);

        const appointmentsData = apptsRes.data?.appointments || apptsRes.data || [];
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);

        if (profileRes.data?.doctor) {
          setDoctorProfile(profileRes.data.doctor);
        }

      } catch (err) {
        setError('Eroare la încărcarea datelor');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 120 
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity }}
        className="h-12 w-12 border-4 border-green-500 rounded-full border-t-transparent"
      />
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">{error}</div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
      >
        Reîncarcă
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Bun venit, Dr. {doctorProfile?.lastName}
        </h1>
        <p className="text-lg text-gray-600">{doctorProfile?.specialization}</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100 transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="bg-green-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Programări urgente
            </h2>
          </div>
          <div className="p-6">
            {appointments.length > 0 ? (
              <ul className="space-y-4">
                {appointments.map((appt) => (
                  <li 
                    key={appt._id}
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(appt.appointmentDate).toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {(appt.patientId as any)?.firstName} {(appt.patientId as any)?.lastName}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        appt.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Nicio programare în următoarele zile</p>
              </div>
            )}
            <Link 
              to="/doctor/appointments" 
              className="mt-4 inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
            >
              Vezi calendar complet
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100 transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="bg-blue-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Acțiuni rapide
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/doctor/patient"
              className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Caută pacient
            </Link>
            <Link
              to="/doctor/appointments/new"
              className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Adaugă programare
            </Link>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100 transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="bg-purple-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Profilul meu
            </h2>
          </div>
          
          <div className="p-6">
            <Link
                to="/doctor/profile/edit"
                className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex flex-col items-start space-y-1"
              >
              <p className="text-gray-700">
                <span className="font-semibold">Specializare:</span> {doctorProfile?.specialization}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Telefon:</span> {doctorProfile?.phone}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Statut verificare:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                  doctorProfile?.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {doctorProfile?.isVerified ? 'Verificat' : 'În așteptare'}
                </span>
              </p>
              </Link>
            </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-12 bg-gradient-to-r from-green-500 to-blue-600 text-black rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-6">Sfaturi pentru doctori</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Recomandați hidratarea corespunzătoare",
            "Verificați alergiile înainte de prescripții",
            "Monitorizați evoluția tratamentelor"
          ].map((tip, i) => (
            <div key={i} className="flex items-start p-4 bg-white bg-opacity-10 rounded-xl">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorHomePage;
