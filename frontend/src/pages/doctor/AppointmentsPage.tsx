import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Appointment } from '../../types';

const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointment/doctor');
        setAppointments(res.data.appointments || res.data || []);
      } catch (err) {
        console.error(err);
        setError("Eroare la încărcarea programărilor medicului.");
      }
    };
    fetchAppointments();
  }, []);

  const updateStatus = async (apptId: string, newStatus: string) => {
    try {
      await api.put(`/appointment/${apptId}/status`, { status: newStatus });
      setAppointments(prev => prev.map(appt => 
        appt._id === apptId ? { ...appt, status: newStatus } : appt
      ));
    } catch (err) {
      console.error(err);
      alert("Nu s-a putut finaliza programarea.");
    }
  };

  const deleteAppointment = async (apptId: string) => {
    try {
      await api.delete(`/appointment/${apptId}`);
      setAppointments(prev => prev.filter(appt => appt._id !== apptId));
    } catch (err) {
      console.error(err);
      alert("Nu s-a putut șterge programarea.");
    }
  };
console.log(appointments)
  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 bg-white shadow-md rounded-xl space-y-6">
      <h3 className="text-2xl font-semibold text-green-700">Programările Mele (Doctor)</h3>
      
      {error && <p className="text-red-600">{error}</p>}
      {appointments.length === 0 ? (
        <p className="text-gray-500 italic">Nu aveți programări.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map(appt => (
            <li
              key={appt._id}
              className="p-4 bg-green-50 border-l-4 border-green-400 rounded shadow-sm"
            >
              <p className="font-semibold text-gray-800">
                {new Date(appt.appointmentDate).toLocaleDateString('ro-RO')} la {appt.time} - 
                <span className="text-blue-700"> Pacient: {appt.patientId.firstName} {appt.patientId.lastName}</span>
                {appt.status === 'Completed' && (
                  <span className="ml-3 px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full uppercase">Finalizat</span>
                )}
              </p>

              {appt.status !== 'Completed' && (
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => updateStatus(appt._id, 'Completed')} 
                    className="text-white bg-green-500 px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none text-sm font-medium"
                  >
                    Finalizează
                  </button>
                  
                  <button 
                    onClick={() => deleteAppointment(appt._id)} 
                    className="text-white bg-red-500 px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none text-sm font-medium"
                  >
                    Anulează
                  </button>

                  {appt.patientId?.userAccountId && (
                    <Link
                      to={`/doctor/messages?userId=${appt.patientId.userAccountId}`}
                      className="px-4 py-2 flex items-center text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition font-medium"
                    >
                      ✉️ Mesaj
                    </Link>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
