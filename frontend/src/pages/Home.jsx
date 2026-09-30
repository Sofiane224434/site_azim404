import Hero from '../components/Hero.jsx';
import ContactSection from '../components/ContactSection.jsx';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <ContactSection />
    </div>
  );
}
