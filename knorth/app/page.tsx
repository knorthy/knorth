"use client";
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero'; // Import the new file here

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24"> {/* pt-24 ensures the hero isn't hidden under the fixed navbar */}
        <Hero />
      </main>
    </div>
  );
}