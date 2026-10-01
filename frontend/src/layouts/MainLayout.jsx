import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-gray-100 selection:bg-cyan-500 selection:text-black">
      <Header />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
