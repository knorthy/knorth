"use client";
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8">
            Welcome to My Portfolio
          </h1>
          <p className="text-xl text-center text-foreground/60">
            For testing only.
          </p>
        </div>
      </main>
    </div>
  );
}