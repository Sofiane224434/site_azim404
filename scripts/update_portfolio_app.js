const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../portfolio/frontend/src/App.jsx');

const code = `import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import MaintenanceScreen from './components/MaintenanceScreen';

function App() {
  const [inMaintenance, setInMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [bypassed, setBypassed] = useState(() => {
    return localStorage.getItem('azim_maintenance_bypass') === 'true';
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetch('https://azim404.com/api/site-status/portfolio', {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setInMaintenance(Boolean(data.inMaintenance));
          if (data.message) setMaintenanceMessage(data.message);
        }
      })
      .catch(() => {
        // En cas de coupure réseau, ne bloque jamais l'accès
      })
      .finally(() => clearTimeout(timeoutId));

    return () => clearTimeout(timeoutId);
  }, []);

  if (inMaintenance && !bypassed) {
    return (
      <MaintenanceScreen
        siteName="Sofiane Kherarfa"
        message={maintenanceMessage || "Le site est actuellement en cours de mise à jour et d'optimisation. Nous serons de retour très prochainement."}
        onBypass={() => setBypassed(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 selection:bg-cyan-500 selection:text-black">
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
`;

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated portfolio/frontend/src/App.jsx');
