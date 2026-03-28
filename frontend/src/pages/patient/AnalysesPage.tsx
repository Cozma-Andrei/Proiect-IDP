import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { DocumentData } from '../../types';

const AnalysesPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/document');
      setDocuments(res.data.documents || res.data || []);
    } catch (err) {
      console.error(err);
      setError("Eroare la încărcarea analizelor.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentType.trim()) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType.trim());

      await api.post('/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Documentul a fost încărcat cu succes în cloud!');
      setDocumentType('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Eroare la încărcarea documentului.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string, docName: string) => {
    try {
      const response = await api.get(`/document/${docId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError("Eroare la descărcarea documentului.");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Sigur doriți să ștergeți acest document? Acțiunea este ireversibilă.')) return;

    try {
      await api.delete(`/document/${docId}`);
      setMessage('Documentul a fost șters cu succes.');
      fetchDocuments();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Eroare la ștergerea documentului.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 space-y-8">

      {/* Upload Section */}
      <div className="bg-white shadow-md rounded-xl p-6 border-t-4 border-blue-500">
        <h3 className="text-xl font-semibold text-blue-700 mb-4">
          Încarcă Document Medical
        </h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip Document</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selectează tipul --</option>
              <option value="Analiză sânge">Analiză sânge</option>
              <option value="Radiografie">Radiografie</option>
              <option value="Ecografie">Ecografie</option>
              <option value="RMN">RMN</option>
              <option value="CT">CT</option>
              <option value="Electrocardiogramă">Electrocardiogramă</option>
              <option value="Test COVID">Test COVID</option>
              <option value="Rețetă">Rețetă</option>
              <option value="Altele">Altele</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fișier (PDF, imagine)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Maxim 5 MB. Formate acceptate: PDF, JPEG, PNG, GIF.</p>
          </div>
          <button
            type="submit"
            disabled={uploading || !selectedFile || !documentType}
            className={`w-full font-semibold py-2 px-4 rounded-xl transition ${
              uploading || !selectedFile || !documentType
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploading ? 'Se încarcă în cloud...' : 'Încarcă în Cloud'}
          </button>
        </form>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✅ {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-xl font-semibold text-blue-700 mb-4">
          Documentele Mele
        </h3>

        {documents.length === 0 ? (
          <p className="text-gray-500 italic">Nu există documente încărcate.</p>
        ) : (
          <ul className="space-y-3">
            {documents.map(doc => (
              <li
                key={doc._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 px-4 py-3 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{doc.documentType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {doc.originalName && <span className="mr-2">{doc.originalName}</span>}
                    {new Date(doc.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  {doc.documentPath && (
                    <button
                      onClick={() => handleDownload(doc._id, doc.originalName || `${doc.documentType}.pdf`)}
                      className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded border border-blue-200 shadow-sm text-sm transition"
                    >
                      ☁️ Descarcă
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1 rounded border border-red-200 shadow-sm text-sm transition"
                  >
                    🗑️ Șterge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnalysesPage;
