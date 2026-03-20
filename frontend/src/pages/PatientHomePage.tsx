import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Appointment, Prescription, Recommendation } from '../types';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          api.get('/appointment/patient?limit=3'),
          api.get('/prescription/patient?limit=3'),
          api.get('/recommendation/patient?limit=3')
        ]);
        
        setAppointments(res1.data.appointments || []);
        setPrescriptions(res2.data.prescriptions || []);
        setRecommendations(res3.data.recommendations || []);
      } catch (err) {
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-sm"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Bun venit la <span className="text-blue-600">CareLog</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Platforma ta personală pentru gestionarea sănătății. Totul la un click distanță.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-8 mb-12"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100 transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="bg-blue-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Programări
            </h2>
          </div>
          <div className="p-6">
            {appointments.length > 0 ? (
              <ul className="space-y-4">
                {appointments.map(appt => (
                  <li key={appt._id} className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(appt.appointmentDate).toLocaleDateString('ro-RO', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-500">{appt.notes || 'Consultație medicală'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Nicio programare viitoare</p>
              </div>
            )}
            <Link 
              to="/patient/appointments" 
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              Vezi toate programările
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              Medicamente
            </h2>
          </div>
          <div className="p-6">
            {prescriptions.length > 0 ? (
              <ul className="space-y-4">
                {prescriptions.map(pres => (
                  <li key={pres._id} className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pres.medications}</p>
                      <p className="text-sm text-gray-500">{pres.dosage}</p>
                      {pres.observations && (
                        <p className="text-xs text-gray-400 mt-1">{pres.observations}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Nicio prescripție recentă</p>
              </div>
            )}
            <Link 
              to="/patient/medications" 
              className="mt-4 inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
            >
              Vezi toate medicamentele
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100 transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="bg-green-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Recomandări
            </h2>
          </div>
          <div className="p-6">
            {recommendations.length > 0 ? (
              <ul className="space-y-4">
                {recommendations.map(rec => (
                  <li key={rec._id} className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 line-clamp-2">{rec.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(rec.issuedDate).toLocaleDateString('ro-RO', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Nicio recomandare recentă</p>
              </div>
            )}
            <Link 
              to="/patient/meal-plan" 
              className="mt-4 inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
            >
              Vezi toate recomandările
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Acțiuni rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
              color: 'blue',
              text: 'Programare nouă',
              link: '/patient/appointments'
            },
            { 
              icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
              color: 'purple',
              text: 'Alergii',
              link: '/patient/allergies'
            },
            { 
              icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
              color: 'blue',
              text: 'Analize medicale',
              link: '/patient/analyses'
            },
            {
              icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
              color: 'purple',
              text: 'Plan alimentar',
              link: '/patient/meal-plan'
            }
          ].map((action, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={action.link}
                className={`bg-${action.color}-50 hover:bg-${action.color}-100 p-4 rounded-xl text-center transition-colors duration-300 h-full flex flex-col items-center justify-center`}
              >
                <div className={`bg-${action.color}-100 p-3 rounded-full mb-3`}>
                  <svg className={`w-6 h-6 text-${action.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon}></path>
                  </svg>
                </div>
                <span className={`font-medium text-${action.color}-800`}>{action.text}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-8 text-black"
      >
        <h2 className="text-2xl font-bold mb-4">Sfaturi de sănătate</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            "Bea cel puțin 2 litri de apă pe zi",
            "Dormi 7-8 ore pe noapte pentru odihnă optimă",
            "Fă exerciții fizice cel puțin 30 de minute zilnic"
          ].map((tip, index) => (
            <div key={index} className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-1 mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p>{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;
