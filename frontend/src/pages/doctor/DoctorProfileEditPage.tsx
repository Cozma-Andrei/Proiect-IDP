// src/pages/doctor/DoctorProfileEditPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const DoctorProfileEditPage: React.FC = () => {
  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone,          setPhone]          = useState("");

  const [loading, setLoading] = useState(true);   // true până aducem datele
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const navigate = useNavigate();

  /* ───────────────── pre-încărcăm profilul ───────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/doctor/profile");   // ACELAȘI end-point ca în Home
        const d   = res.data?.doctor ?? res.data;       // backend-ul tău întoarce .doctor
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

  /* ───────────────── submit ───────────────── */
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
      setError(
        err.response?.data?.message ||
        "Actualizarea a eșuat. Încercați din nou."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ───────────────── UI ───────────────── */
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
