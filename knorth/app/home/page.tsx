"use client";
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="home" className="pt-24">
        <Hero />
      </main>
    </div>
  );
}
