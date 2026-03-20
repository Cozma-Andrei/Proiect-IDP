import React, { useEffect, useState } from 'react';
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
      alert("Nu s-a putut actualiza statusul programării.");
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
                {new Date(appt.appointmentDate).toLocaleString()} - 
                <span className="text-blue-700"> Pacient: {appt.patientId.firstName} {appt.patientId.lastName}</span> - 
                <span className={appt.status === 'Completed' ? 'text-green-700' : 'text-yellow-600'}> Status: {appt.status}</span>
              </p>

              {appt.status !== 'Completed' && (
                <>
                  <button 
                    onClick={() => updateStatus(appt._id, 'Completed')} 
                    className="mt-2 text-white bg-green-500 px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none"
                  >
                    Finalizează
                  </button>
                  
                  {appt.status !== 'Cancelled' && (
                    <button 
                      onClick={() => updateStatus(appt._id, 'Cancelled')} 
                      className="mt-2 ml-4 text-white bg-red-500 px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none"
                    >
                      Anulează
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
