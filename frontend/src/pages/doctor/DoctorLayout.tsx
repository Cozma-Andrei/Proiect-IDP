import { Link, Outlet } from 'react-router-dom';

const DoctorLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-semibold text-green-700">
            <Link to="/doctor/appointments" className="mr-4 hover:text-green-500">
              Programările Mele
            </Link>
            <Link to="/doctor/appointments/new" className="mr-4 hover:text-green-500">
              Adaugă Programare
            </Link>
            <Link to="/doctor/patient" className="mr-4 hover:text-green-500">
              Caută Pacient
            </Link>
            <Link to="/doctor/messages" className="mr-4 hover:text-green-500">
              Mesaje
            </Link>
            <Link to="/doctor/profile/edit" className="mr-4 hover:text-green-500">
              Editare Profil
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default DoctorLayout;
