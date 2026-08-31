export default function ExperiencePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">
          Full <span style={{ color: "#ffe566" }}>Experience</span>
        </h1>
        <p className="text-foreground/60 mb-12">
          Detailed view of my professional journey, leadership roles, and volunteer work.
        </p>
        
        {/* Content will be added here */}
        <div className="text-center text-foreground/40 py-20">
          <p className="text-lg">Content coming soon...</p>
          <a 
            href="/#experience" 
            className="inline-block mt-8 px-6 py-3 rounded-2xl bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
