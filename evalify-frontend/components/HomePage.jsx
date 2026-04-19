import React from 'react';

const HomePage = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-md bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-lg shadow-lg shadow-blue-600/20">E</div>
            EVALIFY
          </div>
          <div className="hidden lg:flex items-center space-x-10 text-sm font-bold text-slate-400">
            <a href="#vision" className="hover:text-white transition-colors">Vision</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <button 
            onClick={onStart}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-sm transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-40 px-6 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-10 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-black tracking-widest uppercase animate-fade-in shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Launching Soon
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[1] tracking-tighter text-white drop-shadow-2xl">
            Smarter Learning. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Fairer Assessment.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
            Evalify bridges the gap between traditional lectures and modern software labs. 
            Automated tracking, attendance system, and secure classroom isolation in one workspace.
          </p>
          <div className="flex items-center justify-center">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-14 py-6 bg-blue-600 hover:bg-blue-500 rounded-[32px] font-black text-xl transition-all shadow-2xl shadow-blue-600/40 transform hover:-translate-y-2 active:translate-y-0"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-40 px-6 border-y border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Eliminating the Friction in Technical Education</h2>
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-blue-500/20 transition-all">
                 <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                   <span className="text-blue-500">01.</span> Automatic Verifiable Attendance
                 </h4>
                 <p className="text-slate-400">No more manual roll calls. Evalify logs student engagement the moment they interact with PDFs, Slides, and Coding challenges.</p>
              </div>
              <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-indigo-500/20 transition-all">
                 <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                   <span className="text-indigo-500">02.</span> Focus-Mode Learning
                 </h4>
                 <p className="text-slate-400">Secure classroom isolation ensures students stay on track without external distractions or unauthorized collaboration.</p>
              </div>
              <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-purple-500/20 transition-all">
                 <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                   <span className="text-indigo-500">03.</span> Direct Lab Submission
                 </h4>
                 <p className="text-slate-400">Teacher-specific class codes ensure students only access the materials and labs intended for their specific cohort.</p>
              </div>
            </div>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full" />
             <div className="relative bg-slate-900 border border-white/10 rounded-[48px] p-4 shadow-3xl">
                <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop" className="rounded-[36px] grayscale contrast-125" alt="Laptop Workspace" />
                {/* <div className="absolute -bottom-10 -right-10 bg-blue-600 p-8 rounded-[32px] shadow-2xl hidden md:block">
                  <p className="text-4xl font-black text-white">99.8%</p>
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mt-1">Attendance Accuracy</p>
                </div> */}
             </div>
          </div>
        </div>
      </section>

      {/* Deep Feature Highlights */}
      <section id="features" className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black mb-8">Power Features for <br />Power Instructors</h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto">A purpose-built ecosystem that solves real classroom problems.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: "Monaco Pro IDE", desc: "The same core as VS Code. High performance, multi-language, and buttery smooth directly in the browser.", icon: "⌨️" },
              { title: "Class Isolation", desc: "Materials and slides are strictly grouped by classroom, preventing unauthorized cross-access.", icon: "🔒" },
              { title: "Attendance System", desc: "Attendance is automatically taken on the basis when students interact with pdfs,slides and lab exams.", icon: "🆔" },
              { title: "Resource Vault", desc: "Securely host PDFs and Lecture Slides. Access is tracked and verified for every student view.", icon: "📦" },
              { title: "Lab Submission", desc: "One-click lab delivery. Teachers receive code snapshots immediately for grading and review.", icon: "🚀" },
              { title: "Integrity Logs", desc: "Real-time tab-switching detection and activity tracking to maintain assessment fairness.", icon: "🔐" }
            ].map((f, i) => (
              <div key={i} className="group p-12 rounded-[40px] bg-slate-900 border border-white/5 hover:bg-slate-800 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-4xl mb-10 border border-white/5 shadow-inner group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 text-white">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section id="how-it-works" className="py-40 bg-indigo-600/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-6">3 Steps to Better Classes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
             <div className="hidden md:block absolute top-[20%] left-0 w-full h-0.5 border-t border-dashed border-white/10 -z-10" />
             {[
               { step: "01", title: "Setup Classroom", desc: "Teachers create a class and get a 6-digit invite code. Upload your syllabus, slides, and lab tasks." },
               { step: "02", title: "Invite Students", desc: "Students join via the unique code. Their identity is verified by registration number for strict tracking." },
               { step: "03", title: "Engage & Monitor", desc: "As students learn and code, Evalify automatically populates your attendance and submission portal." }
             ].map((s, i) => (
               <div key={i} className="text-center">
                 <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-10 shadow-2xl shadow-blue-600/40 text-white">
                   {s.step}
                 </div>
                 <h4 className="text-2xl font-bold mb-4">{s.title}</h4>
                 <p className="text-slate-400 leading-relaxed font-medium">{s.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div>
            <div className="text-3xl font-black text-white mb-6">Evalify</div>
            <p className="text-slate-500 leading-relaxed">Built for educators who believe in a more transparent and tech-enabled learning environment.</p>
          </div>
          
          <div>
            <h5 className="font-bold text-white mb-8 uppercase tracking-widest text-sm">Quick Links</h5>
            <div className="flex flex-col space-y-4 text-slate-400 font-medium">
              <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Instructor Guide</a>
              <a href="#" className="hover:text-blue-400 transition-colors">API Integration</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Shield</a>
            </div>
          </div>
          
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-32 pt-10 border-t border-white/5 text-center text-slate-600 text-sm font-medium">
          &copy; 2025 Evalify Platforms. Created for the next generation of software masters.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;