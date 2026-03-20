import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { PatientData, MedicalRecord, DocumentData } from '../../types';

const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [newRecord, setNewRecord] = useState({ diagnosis: "", observations: "", recommendedTreatment: "" });
  const [newPrescription, setNewPrescription] = useState({ recordId: "", medications: "", dosage: "", observations: "" });
  const [newRec, setNewRec] = useState({ content: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    const fetchAll = async () => {
      try {
        const res1 = await api.get(`/patient/medical-data/${patientId}`);
        setPatient(res1.data.patient || res1.data);
        const res2 = await api.get(`/medicalRecord/patient/${patientId}`);
        setRecords(res2.data.medicalRecords || res2.data.records || []);
        const res3 = await api.get(`/document/patient/${patientId}`);
        setDocuments(res3.data.documents || res3.data || []);
      } catch (err: any) {
        console.error(err);
        setError("Eroare la încărcarea datelor pacientului. Verificați ID-ul și drepturile de acces.");
      }
    };
    fetchAll();
  }, [patientId]);

  const handleRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  const submitNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const recordDate = new Date().toISOString().split('T')[0];
      await api.post('/medicalRecord', { 
        patientId: patient?._id, 
        diagnosis: newRecord.diagnosis, 
        observations: newRecord.observations, 
        recommendedTreatment: newRecord.recommendedTreatment, 
        recordDate 
      });
      setMessage("Înregistrare medicală adăugată.");
      const res = await api.get(`/medicalRecord/patient/${patientId}`);
      setRecords(res.data.medicalRecords || res.data.records || []);
      setNewRecord({ diagnosis: "", observations: "", recommendedTreatment: "" });
    } catch (err) {
      console.error(err);
      setError("Eroare la adăugarea înregistrării medicale.");
    }
  };

  const handlePrescChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPrescription(prev => ({ ...prev, [name]: value }));
  };

  const submitNewPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post('/prescription', { 
        medicalRecordId: newPrescription.recordId, 
        medications: newPrescription.medications, 
        dosage: newPrescription.dosage, 
        observations: newPrescription.observations 
      });
      setMessage("Rețetă adăugată cu succes.");
      setNewPrescription({ recordId: "", medications: "", dosage: "", observations: "" });
    } catch (err) {
      console.error(err);
      setError("Eroare la adăugarea rețetei.");
    }
  };

  const handleRecChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRec(prev => ({ ...prev, [name]: value }));
  };

  const submitNewRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post('/recommendation', { patientId: patient?._id, content: newRec.content });
      setMessage("Recomandare emisă pacientului.");
      setNewRec({ content: "" });
    } catch (err) {
      console.error(err);
      setError("Eroare la trimiterea recomandării.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h3 className="text-2xl font-semibold mb-4">Detalii Pacient</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {patient ? (
        <div className="space-y-4 mb-4">
          <p><strong>Nume:</strong> {patient.firstName} {patient.lastName}</p>
          <p><strong>Data nașterii:</strong> {new Date(patient.birthDate).toLocaleDateString()}</p>
          <p><strong>Sex:</strong> {patient.gender}</p>
          <p><strong>Alergii:</strong> {patient.allergies || "Nespecificat"}</p>
          <p><strong>Istoric general:</strong> {patient.medicalHistory || "Nespecificat"}</p>
        </div>
      ) : (
        !error && <p>Se încarcă datele pacientului...</p>
      )}

      <h4 className="text-xl font-semibold mt-6">Istoric Medical</h4>
      {records.length === 0 ? <p>Nu există înregistrări.</p> : (
        <ul className="list-disc pl-6">
          {records.map(rec => (
            <li key={rec._id}>
              {new Date(rec.recordDate).toLocaleDateString()}: <strong>{rec.diagnosis}</strong> – {rec.observations} {rec.recommendedTreatment && (<em>(Tratament: {rec.recommendedTreatment})</em>)}
            </li>
          ))}
        </ul>
      )}

      <h4 className="text-xl font-semibold mt-6">Documente Încărcate</h4>
      {documents.length === 0 ? <p>Nu există documente.</p> : (
        <ul className="list-disc pl-6">
          {documents.map(doc => (
            <li key={doc._id}>
              {doc.documentType} – <em>{new Date(doc.uploadedAt).toLocaleDateString()}</em> 
              {doc.documentPath && (
                <a href={`http://localhost:5000/${doc.documentPath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> [Deschide]</a>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && <p className="text-green-500 mt-4">{message}</p>}

      <h4 className="text-xl font-semibold mt-6">Adaugă Înregistrare Medicală</h4>
      <form onSubmit={submitNewRecord} className="space-y-4">
        <div>
          <label>Diagnostic:{" "}
            <input 
              type="text" 
              name="diagnosis" 
              value={newRecord.diagnosis} 
              onChange={handleRecordChange} 
              required 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <div>
          <label>Observații:{" "}
            <input 
              type="text" 
              name="observations" 
              value={newRecord.observations} 
              onChange={handleRecordChange} 
              required 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <div>
          <label>Tratament recomandat:{" "}
            <input 
              type="text" 
              name="recommendedTreatment" 
              value={newRecord.recommendedTreatment} 
              onChange={handleRecordChange} 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Adaugă Înregistrare</button>
      </form>

      <h4 className="text-xl font-semibold mt-6">Prescrie Medicament</h4>
      <form onSubmit={submitNewPrescription} className="space-y-4">
        <div>
          <label>Înregistrare asociată:{" "}
            <select 
              name="recordId" 
              value={newPrescription.recordId} 
              onChange={handlePrescChange} 
              required 
              className="border border-gray-300 rounded-md p-2 w-full"
            >
              <option value="">--Selectează consultație--</option>
              {records.map(rec => (
                <option key={rec._id} value={rec._id}>
                  {new Date(rec.recordDate).toLocaleDateString()} – {rec.diagnosis}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>Medicamente:{" "}
            <input 
              type="text" 
              name="medications" 
              value={newPrescription.medications} 
              onChange={handlePrescChange} 
              required 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <div>
          <label>Dozaj:{" "}
            <input 
              type="text" 
              name="dosage" 
              value={newPrescription.dosage} 
              onChange={handlePrescChange} 
              required 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <div>
          <label>Observații:{" "}
            <input 
              type="text" 
              name="observations" 
              value={newPrescription.observations} 
              onChange={handlePrescChange} 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Adaugă Rețetă</button>
      </form>

      <h4 className="text-xl font-semibold mt-6">Emite Recomandare</h4>
      <form onSubmit={submitNewRecommendation} className="space-y-4">
        <div>
          <label>Recomandare: <br/>
            <textarea 
              name="content" 
              value={newRec.content} 
              onChange={handleRecChange} 
              rows={3} 
              cols={40} 
              placeholder="Ex: Dietă sau alte sfaturi..." 
              required 
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </label>
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Trimite Recomandare</button>
      </form>
    </div>
  );
};

export default PatientDetailPage;
