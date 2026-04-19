import React, { useState } from 'react';

const Layout = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'materials', label: 'Materials', icon: '📚' },
    ...(user?.role !== 'TEACHER' ? [{ id: 'ide', label: 'Coding IDE', icon: '💻' }] : []),
    ...(user?.role !== 'TEACHER' ? [{ id: 'assignments', label: 'Active Assessments', icon: '📝' }] : []),
    ...(user?.role === 'TEACHER' ? [{ id: 'assessment-builder', label: 'Assessment Builder', icon: '🛠️' }] : []),
    { id: 'attendance', label: 'Attendance', icon: '✅' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 w-64 bg-slate-950 border-r border-slate-800 flex flex-col`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Evalify
          </h1>
          <p className="text-xs text-slate-500 mt-1">Evaluation Driven Learning & Assessment Platform</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
            >
              <span className="mr-3 text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 p-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
              {user?.name ? user.name[0] : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Guest User'}</p>
              <p className="text-xs text-slate-500 truncate lowercase">{user?.role || 'Role'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-red-400/20"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-auto bg-slate-950/50 relative w-full">
        <header className="sticky top-0 z-10 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-400 hover:text-white focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-xl font-semibold capitalize truncate">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-mono rounded border border-green-500/20">
              Session Active
            </span>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;