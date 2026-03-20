import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Appointment, DoctorData } from '../../types';

const PatientAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [form, setForm] = useState({ doctorId: "", date: "", time: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointment/patient');
      setAppointments(res.data.appointments || res.data || []);
    } catch (err) {
      console.error(err);
      setError("Eroare la încărcarea programărilor.");
    }
  };

  useEffect(() => {
    fetchAppointments();
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctor/all');
        setDoctors(res.data.doctors || res.data || []);
      } catch (err) {
        console.error("Nu s-au putut încărca doctorii pentru programare.");
      }
    };
    fetchDoctors();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const bookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const appointmentDate = new Date(`${form.date}T${form.time}`);
      await api.post('/appointment', {
        doctorId: form.doctorId,
        appointmentDate: appointmentDate.toISOString(),
        time: form.time,
        notes: form.notes || "Consultație"
      });
      setMessage("Programare creată cu succes.");
      setForm({ doctorId: "", date: "", time: "", notes: "" });
      fetchAppointments();
    } catch (err) {
      console.error(err);
      setError("Eroare la crearea programării. Verificați datele introduse.");
    }
  };

  const cancelAppointment = async (apptId: string) => {
    try {
      await api.put(`/appointment/${apptId}/cancel`);
      setAppointments(prev => prev.filter(appt => appt._id !== apptId));
    } catch (err) {
      console.error(err);
      alert("Eroare la anularea programării.");
    }
  };

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.appointmentDate) >= now);
  const past = appointments.filter(a => new Date(a.appointmentDate) < now);

  const getDoctorName = (id: string) => {
    const doctor = doctors.find(doc => doc._id === id);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : `Dr. ${id}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white shadow-md rounded-xl space-y-6">
      <h3 className="text-2xl font-semibold text-blue-700">Programările Mele</h3>

      {error && <p className="text-red-600">{error}</p>}
      {message && <p className="text-green-600">{message}</p>}

      <div>
        <h4 className="text-lg font-medium mb-2">Programări viitoare:</h4>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 italic">(Niciuna)</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map(appt => (
              <li
                key={appt._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-100 rounded-md border"
              >
                <div>
                  <p className="font-medium text-gray-800">{new Date(appt.appointmentDate).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{getDoctorName(appt.doctorId._id)} - Status: {appt.status}</p>
                </div>
                <button
                  onClick={() => cancelAppointment(appt._id)}
                  className="mt-2 sm:mt-0 px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Anulează
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Programări trecute:</h4>
        {past.length === 0 ? (
          <p className="text-gray-500 italic">(Niciuna)</p>
        ) : (
          <ul className="space-y-2">
            {past.map(appt => (
              <li
                key={appt._id}
                className="p-3 bg-gray-50 rounded-md border text-sm text-gray-700"
              >
                {new Date(appt.appointmentDate).toLocaleString()} - {getDoctorName(appt.doctorId._id)} - Status: {appt.status}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-lg font-medium mb-3">Fă o programare nouă:</h4>
        <form onSubmit={bookAppointment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Medic:</label>
            <select
              name="doctorId"
              value={form.doctorId}
              onChange={handleInputChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">--Selectează medic--</option>
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>
                  {doc.firstName} {doc.lastName} {doc.specialization && `(${doc.specialization})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleInputChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ora:</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleInputChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note:</label>
            <input
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleInputChange}
              placeholder="Motivul consultației"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Programează
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;
