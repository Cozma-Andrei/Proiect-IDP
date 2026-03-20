import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const AddDoctorAppointmentPage: React.FC = () => {
  const navigate = useNavigate();

  const [patientId,  setPatientId]  = useState("");
  const [date,       setDate]       = useState("");
  const [time,       setTime]       = useState("");
  const [reason,     setReason]     = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError("Selectați un pacient !"); return; }

    setError(null);
    setLoading(true);
    try {
      const appointmentDate = new Date(`${date}T${time}:00`);
      await api.post("/appointment/for-patient", { patientId, appointmentDate: appointmentDate.toISOString(), time, notes: reason });
      alert("Programarea a fost creată!");
      navigate("/doctor/appointments", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Crearea programării a eșuat.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Adaugă programare</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block mb-1 text-sm font-medium">Pacient</label>
            <input
              type="text"
              onChange={(e) => {
                setPatientId(e.target.value);
              }}
              placeholder="Nume / telefon"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Ora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Motiv</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            {loading ? "Se încarcă..." : "Salvează"}
          </button>
        </form>
      </div>
  );
};

export default AddDoctorAppointmentPage;
