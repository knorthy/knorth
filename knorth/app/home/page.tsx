"use client";
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ChatWidget from '@/components/chat/ChatWidget';

export default function Home() {
  return (
    <div>
      <Navbar />
      <main id="home" className="pt-24">
        <Hero />
      </main>
      <ChatWidget />
    </div>
  );
}
