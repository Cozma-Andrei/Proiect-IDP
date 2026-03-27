import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientLayout from './pages/patient/PatientLayout';
import MedicalHistoryPage from './pages/patient/MedicalHistoryPage';
import AnalysesPage from './pages/patient/AnalysesPage';
import MedicationsPage from './pages/patient/MedicationsPage';
import AllergiesPage from './pages/patient/AllergiesPage';
import MealPlanPage from './pages/patient/MealPlanPage';
import PatientAppointmentsPage from './pages/patient/AppointmentsPage';
import DoctorLayout from './pages/doctor/DoctorLayout';
import PatientSearchPage from './pages/doctor/PatientSearchPage';
import PatientDetailPage from './pages/doctor/PatientDetailPage';
import DoctorAppointmentsPage from './pages/doctor/AppointmentsPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import ConfirmRegistrationPage from './pages/ConfirmRegistrationPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChooseProfilePage from './pages/ChooseProfilePage';
import CreatePatientPage from './pages/CreatePatientPage';
import CreateDoctorPage from './pages/CreateDoctorPage';
import Navbar from './components/Navbar';
import PatientHomePage from './pages/PatientHomePage';
import DoctorHomePage from './pages/DoctorHomePage';
import { useAuth } from './hooks/useAuth';
import DoctorProfileEditPage  from "./pages/doctor/DoctorProfileEditPage";
import AddDoctorAppointmentPage from './pages/doctor/AddDoctorAppointmentPage';


const App: React.FC = () => {
  const { token, role, activeProfile, hasDoctorProfile, hasPatientProfile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/choose-profile" element={<ChooseProfilePage />} />
        <Route path="/forgot-password" element={<RequestPasswordResetPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/confirm-registration/:token" element={<ConfirmRegistrationPage />} />
        <Route path="/create-patient" element={<CreatePatientPage />} />
        <Route path="/create-doctor" element={<CreateDoctorPage />} />

        <Route
          path="/patient/*"
          element={
            token && (activeProfile === 'Patient' || role === 'Patient' || hasPatientProfile) ? <PatientLayout /> : <Navigate to="/login" />
          }
        >
          <Route index element={<Navigate to="history" />} />
          <Route path="history" element={<MedicalHistoryPage />} />
          <Route path="analyses" element={<AnalysesPage />} />
          <Route path="medications" element={<MedicationsPage />} />
          <Route path="allergies" element={<AllergiesPage />} />
          <Route path="meal-plan" element={<MealPlanPage />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
        </Route>

        <Route
          path="/doctor/*"
          element={
            token && (activeProfile === 'Doctor' || role === 'Doctor' || hasDoctorProfile) ? <DoctorLayout /> : <Navigate to="/login" />
          }
        >
          <Route index element={<Navigate to="appointments" />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="appointments/new" element={<AddDoctorAppointmentPage />} />
          <Route path="profile/edit" element={<DoctorProfileEditPage />} />
          <Route path="patient" element={<PatientSearchPage />} />
          <Route path="patient/:patientId" element={<PatientDetailPage />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            token && (activeProfile === 'Admin' || role === 'Admin') ? <AdminLayout /> : <Navigate to="/login" />
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={
          token ? (
            activeProfile === 'Patient' ? (
              <PatientHomePage />
            ) : activeProfile === 'Doctor' ? (
              <DoctorHomePage />
            ) : activeProfile === 'Admin' ? (
              <Navigate to="/admin" />
            ) : (
              ( (hasPatientProfile ? 1 : 0) + (hasDoctorProfile ? 1 : 0) + (role === 'Admin' ? 1 : 0) ) > 1 ? (
                <Navigate to="/choose-profile" />
              ) : (
                <Navigate to="/create-patient" />
              )
            )
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </>
  );
};

export default App;
