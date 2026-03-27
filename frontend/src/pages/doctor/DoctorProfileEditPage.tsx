import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const DoctorProfileEditPage: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/doctor/profile");
        const d = res.data?.doctor ?? res.data;
        setFirstName(d.firstName || "");
        setLastName(d.lastName || "");
        setSpecialization(d.specialization || "");
        setPhone(d.phone || "");
      } catch (e) {
        console.error(e);
        setError("Nu s-au putut încărca datele.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.put("/doctor/profile", {
        firstName,
        lastName,
        specialization,
        phone,
      });
      alert("Profil actualizat cu succes!");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data && typeof err.response.data === 'object') {
        const errorMessages = Object.entries(err.response.data)
          .map(([field, messages]: [string, any]) => {
            const msgs = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msgs}`;
          })
          .join(' | ');
        setError(errorMessages || "Actualizarea a eșuat. Încercați din nou.");
      } else {
        setError("Actualizarea a eșuat. Încercați din nou.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg mt-10 p-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Editează Profilul</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Prenume</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Nume</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Specializare</label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Telefon</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: +40712345678"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            {saving ? "Se salvează…" : "Salvează Modificările"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfileEditPage;
