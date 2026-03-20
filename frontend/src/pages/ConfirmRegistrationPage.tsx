import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const ConfirmRegistrationPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [message, setMessage] = useState("Se confirmă înregistrarea...");
    const [error, setError] = useState<string | null>(null);
    const hasConfirmed = React.useRef(false);

    useEffect(() => {
        const confirm = async () => {
            if (!token || hasConfirmed.current) return;

            hasConfirmed.current = true;

            try {
                const response = await api.get(`/confirm/registration?token=${token}`);
                setMessage(response.data.message || "Înregistrarea a fost confirmată.");
                setTimeout(() => navigate('/login'), 3000);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || "Confirmarea a eșuat.");
            }
        };

        confirm();
    }, [token, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded shadow-md text-center max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">
                    {error ? "Eroare la confirmare" : "Confirmare înregistrare"}
                </h2>
                <p className="text-gray-700">{error || message}</p>
                {!error && (
                <p className="text-sm text-gray-500 mt-2">
                    Vei fi redirecționat către pagina de login...
                </p>
                )}
            </div>
        </div>
    );
};

export default ConfirmRegistrationPage;
