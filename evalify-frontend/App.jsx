import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CodingIDE from './components/CodingIDE';
import Materials from './components/Materials';
import AuthPortal from './components/AuthPortal';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import HomePage from './components/HomePage';
import EmailConfirmation from './components/EmailConfirmation';
import AssessmentBuilder from './components/AssessmentBuilder';
import AttendanceTable from './components/AttendanceTable';
import UpdatePassword from './components/UpdatePassword';
import { supabase } from './services/supabase';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Teacher Attendance View Component ---
const TeacherAttendanceView = ({ user, attendance, classes, allStudents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Filter
  const filteredRecords = attendance.filter(record => {
    // Class Filter
    if (filterClass !== 'ALL' && record.class_id !== filterClass) return false;

    // Date Filter (compare local date strings)
    if (filterDate) {
      const d = new Date(record.timestamp);
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (localDate !== filterDate) return false;
    }

    // Search Filter
    if (searchQuery) {
      const student = allStudents.find(s => s.id === record.student_id);
      const query = searchQuery.toLowerCase();
      const nameMatch = student?.name?.toLowerCase().includes(query);
      const regMatch = student?.regNo?.toLowerCase().includes(query);
      if (!nameMatch && !regMatch) return false;
    }

    return true;
  });

  // 2. Sort (Newest first)
  filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // 3. Paginate
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterClass, filterDate]);

  return (
    <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10 shadow-xl animate-fade-in text-white flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl shadow-inner">📋</span>
          Global Attendance
        </h3>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search name or reg no..."
            className="bg-slate-950 border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="bg-slate-950 border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="bg-slate-950 border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {(searchQuery.trim() || filterClass !== 'ALL' || filterDate) && (
            <button
              onClick={() => { setSearchQuery(''); setFilterClass('ALL'); setFilterDate(''); setCurrentPage(1); }}
              className="px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AttendanceTable
          attendance={paginatedRecords}
          students={allStudents}
          classes={classes}
        />
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6">
        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
          Showing {paginatedRecords.length} of {filteredRecords.length} records
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${currentPage === 1 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white shadow-md'}`}
          >
            Previous
          </button>
          <span className="text-xs font-bold text-slate-400">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${currentPage === totalPages ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
// ----------------------------------------

const App = () => {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [attendance, setAttendance] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attempts, setAttempts] = useState([]);

  // Handle Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        setView('updatePassword');
      }

      if (session) {
        try {
          // Fetch user profile from PostgreSQL DB
          const res = await axios.get(`${API_URL}/auth/${session.user.id}`);
          const storedUser = res.data;

          if (storedUser) {
            // In PostgreSQL, joining classes is handled by class_enrollments table.
            // We fetch the real, live classes the user is enrolled in (or teaching)
            const [classesRes, attendanceRes, rosterRes, assignmentsRes, submissionsRes, attemptsRes] = await Promise.all([
              axios.get(`${API_URL}/classes/user/${session.user.id}`),
              axios.get(`${API_URL}/attendance?${storedUser.role === 'STUDENT' ? `studentId=${session.user.id}` : `teacherId=${session.user.id}`}`),
              storedUser.role === 'TEACHER' ? axios.get(`${API_URL}/classes/teacher/${session.user.id}/roster`) : Promise.resolve({ data: [] }),
              axios.get(`${API_URL}/assignments/user/${session.user.id}`),
              axios.get(`${API_URL}/assignments/submissions?${storedUser.role === 'STUDENT' ? `studentId=${session.user.id}` : `teacherId=${session.user.id}`}`),
              storedUser.role === 'STUDENT' ? axios.get(`${API_URL}/assignments/attempts?studentId=${session.user.id}`) : Promise.resolve({ data: [] })
            ]);
            const fetchedClasses = classesRes.data;
            const fetchedAttendance = attendanceRes.data;
            const fetchedRoster = rosterRes.data;
            const fetchedAssignments = assignmentsRes.data;
            const fetchedSubmissions = submissionsRes.data;
            const fetchedAttempts = attemptsRes.data;

            setUserClasses(fetchedClasses);
            setAttendance(fetchedAttendance);
            setAllStudents(fetchedRoster);
            setAssignments(fetchedAssignments);
            setSubmissions(fetchedSubmissions);
            setAttempts(fetchedAttempts);
            storedUser.joinedClasses = fetchedClasses.map(c => c.code);

            setUser((prevUser) => {
              if (!prevUser) {
                if (session.user.email_confirmed_at && event !== 'PASSWORD_RECOVERY') {
                  setView('app');
                }
                return storedUser;
              }
              // Merge the fetched class data into the existing user state
              // rather than discarding the fresh data if IDs match.
              return { ...prevUser, ...storedUser, joinedClasses: storedUser.joinedClasses };
            });
          }
        } catch (err) {
          console.error("Error fetching user or classes on state change:", err);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Polling for real-time integrity and attendance updates
  useEffect(() => {
    if (view === 'app') {
      // Functional polling re-added via backend if needed later
    }
  }, [view]);

  const handleLogin = (newUser) => {
    setUser(newUser);
    // Assume fetching happens via onAuthStateChange automatically
    setView('app');
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserClasses([]);
    setView('home');
  };

  if (view === 'home') return <HomePage onStart={() => setView('auth')} />;
  if (view === 'auth') return <AuthPortal onLogin={handleLogin} onSignupSuccess={() => setView('emailConfirmation')} onBack={() => setView('home')} />;
  if (view === 'emailConfirmation') return <EmailConfirmation onBack={() => setView('home')} />;
  if (view === 'updatePassword') return <UpdatePassword onPasswordUpdated={() => setView('app')} />;
  if (view === 'app' && user) {

    const userAssignments = assignments.filter(a => userClasses.some(c => c.id === a.class_id));
    const pendingAssignments = userAssignments.filter(a => {
      const isPastDeadline = new Date(a.deadline).setHours(23, 59, 59, 999) < Date.now();
      const hasSubmitted = submissions.some(s => s.assignment_id === a.id);

      let isTimerExpired = false;
      const attempt = attempts.find(att => att.assignment_id === a.id);
      if (attempt && (a.durationValue || a.duration)) {
        const value = parseInt(a.durationValue || a.duration, 10);
        let totalSeconds = 0;
        const unit = a.durationUnit || a.duration_unit;
        if (unit === 'Minutes' || unit === 'minutes') totalSeconds = value * 60;
        else if (unit === 'Hours' || unit === 'hours') totalSeconds = value * 3600;
        else if (unit === 'Days' || unit === 'days') totalSeconds = value * 86400;

        const startTime = new Date(attempt.start_time).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedSeconds >= totalSeconds) {
          isTimerExpired = true;
        }
      }

      return !hasSubmitted && !isPastDeadline && !isTimerExpired;
    });


    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard':
          if (user.role === 'TEACHER') return <TeacherDashboard teacher={user} />;
          if (user.role === 'STUDENT') return <StudentDashboard student={user} onJoinClass={(updatedUser) => setUser(updatedUser)} onNavigate={(tab) => setActiveTab(tab)} />;
          return null;

        case 'materials':
          return <Materials user={user} />;
        case 'assessment-builder':
          return <AssessmentBuilder teacher={user} />;
        case 'ide':
          return <CodingIDE student={user} />;
        case 'assignments':
          const pendingByClass = pendingAssignments.reduce((acc, assignment) => {
            const cls = userClasses.find(c => c.id === assignment.class_id);
            const className = cls ? cls.name : 'Unknown Class';
            if (!acc[className]) acc[className] = [];
            acc[className].push(assignment);
            return acc;
          }, {});

          return (
            <div className="space-y-10 animate-fade-in">
              <h3 className="text-3xl font-black flex items-center gap-4 text-white">
                <span className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shadow-inner">📝</span>
                Active Assessments
              </h3>

              {Object.keys(pendingByClass).length === 0 ? (
                <div className="py-32 text-center bg-slate-900 rounded-[40px] border border-dashed border-white/5 text-slate-500 font-medium">
                  You have no pending assessments. Great job!
                </div>
              ) : (
                Object.entries(pendingByClass).map(([className, classAssignments]) => (
                  <div key={className} className="space-y-6">
                    <h4 className="text-xl font-bold text-slate-300 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm">🏫</span>
                      {className}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {classAssignments.map(a => (
                        <div key={a.id} className="bg-slate-900 p-8 rounded-[40px] border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col h-full shadow-lg">
                          <div className="flex justify-between items-start mb-6">
                            <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${a.type === 'CODING' ? 'bg-green-500/10 text-green-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                              {a.type || 'ASSESSMENT'}
                            </span>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Deadline</p>
                              <p className="text-xs text-white font-mono">{new Date(a.deadline).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="select-none" onCopy={e => { e.preventDefault(); return false; }} onDragStart={e => e.preventDefault()}>
                            <h5 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors pointer-events-none">{a.title}</h5>
                            <p className="text-sm text-slate-500 mb-10 leading-relaxed line-clamp-3 pointer-events-none">{a.description}</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('ide')}
                            className="mt-auto w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 border border-white/5"
                          >
                            {a.type === 'CODING' ? 'Open Smart IDE' : 'Open Assessment'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );

        case 'attendance':
          if (user.role === 'TEACHER') {
            const teacherClassIds = userClasses.map(c => c.id);

            // Get attendance records only for classes taught by this teacher
            const teacherAttendance = attendance.filter(a => teacherClassIds.includes(a.class_id));

            return <TeacherAttendanceView user={user} attendance={teacherAttendance} classes={userClasses} allStudents={allStudents} />;
          }

          return (
            <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10 shadow-xl animate-fade-in text-white">
              <h3 className="text-xl font-bold mb-8">Personal Attendance History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500 border-b border-white/5 font-black uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="pb-6">Resource Accessed</th>
                      <th className="pb-6">Access Timestamp</th>
                      <th className="pb-6">Verification</th>
                      <th className="pb-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendance.filter(a => a.student_id === user.id).map(r => (
                      <tr key={r.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-6 font-bold text-slate-200">{r.material_title}</td>
                        <td className="py-6 text-slate-400 text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="py-6">
                          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded">PLATFORM SIGNED ✓</span>
                        </td>
                        <td className="py-6 text-right">
                          <span className="text-green-400 font-black text-[10px] uppercase">Present</span>
                        </td>
                      </tr>
                    ))}
                    {attendance.filter(a => a.student_id === user.id).length === 0 && (
                      <tr><td colSpan={4} className="py-16 text-center text-slate-500 italic">Open classroom resources to mark your attendance.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <Layout
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        {renderContent()}
      </Layout>
    );
  }

};

export default App;