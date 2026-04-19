import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StudentDashboard = ({ student, onJoinClass, onNavigate }) => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [logs, setLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classViewMode, setClassViewMode] = useState('overview');
  const [unreadAnnouncements, setUnreadAnnouncements] = useState([]);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!student) return;
      try {
        const [classRes, annRes, matRes, attendanceRes, assignmentsRes, submissionsRes, logsRes] = await Promise.all([
          axios.get(`${API_URL}/classes/user/${student.id}`),
          axios.get(`${API_URL}/announcements/user/${student.id}`),
          axios.get(`${API_URL}/materials/user/${student.id}`),
          axios.get(`${API_URL}/attendance?studentId=${student.id}`),
          axios.get(`${API_URL}/assignments/user/${student.id}`),
          axios.get(`${API_URL}/assignments/submissions?studentId=${student.id}`),
          axios.get(`${API_URL}/integrity?studentId=${student.id}`)
        ]);
        setClasses(classRes.data);
        setAnnouncements(annRes.data);
        setMaterials(matRes.data);
        setAttendance(attendanceRes.data);
        setAssignments(assignmentsRes.data);
        setSubmissions(submissionsRes.data);
        setLogs(logsRes.data);

        // Check for unread announcements from today
        const readIds = JSON.parse(localStorage.getItem(`read_announcements_${student.id}`) || '[]');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const unread = annRes.data.filter(a => {
          if (readIds.includes(a.id)) return false;
          
          const annDate = new Date(a.created_at || a.timestamp);
          annDate.setHours(0, 0, 0, 0);
          
          return annDate.getTime() === today.getTime();
        });
        if (unread.length > 0) {
          setUnreadAnnouncements(unread);
          setShowAnnouncementPopup(true);
        }
      } catch (error) {
        console.error("Failed to fetch student dashboard data:", error);
      }
    };
    fetchData();

  }, [student]);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!student) return;

    if ((student.joinedClasses || []).includes(joinCode)) {
      alert("You are already in this class!");
      return;
    }

    try {
      await axios.post(`${API_URL}/classes/join`, {
        studentId: student.id,
        classCode: joinCode
      });

      const updatedStudent = {
        ...student,
        joinedClasses: [...(student.joinedClasses || []), joinCode]
      };

      onJoinClass(updatedStudent);

      // Update Supabase user metadata to persist across sessions
      import('./../services/supabase').then(({ supabase }) => {
        supabase.auth.updateUser({ data: { joinedClasses: updatedStudent.joinedClasses } });
      });

      // Refetch classes to show the new one
      const classRes = await axios.get(`${API_URL}/classes/user/${student.id}`);
      setClasses(classRes.data);

      alert(`Successfully joined class!`);
      setJoinCode('');
    } catch (err) {
      alert(err.response?.data?.error || "Failed to join class. Please check the code.");
    }
  };

  const dismissAnnouncements = () => {
    const readIds = JSON.parse(localStorage.getItem(`read_announcements_${student.id}`) || '[]');
    const newReadIds = [...readIds, ...unreadAnnouncements.map(a => a.id)];
    localStorage.setItem(`read_announcements_${student.id}`, JSON.stringify(newReadIds));
    setShowAnnouncementPopup(false);
    setUnreadAnnouncements([]);
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const getClassDetails = (classCode) => {
    return classes.find(c => c.code === classCode);
  };

  const getClassAnnouncements = (classId) => {
    return announcements.filter(a => a.class_id === classId);
  };

  const getClassAssignments = (classId) => {
    return assignments.filter(a => a.class_id === classId);
  };

  const getClassMaterials = (classId) => {
    return materials.filter(m => m.class_id === classId);
  };

  const handleView = async (m) => {
    try {
      await axios.post(`${API_URL}/attendance`, {
        studentId: student.id,
        classId: m.class_id,
        materialId: m.id,
        materialTitle: m.title
      });
    } catch (err) {
      console.error("Failed to mark attendance", err);
    }

    const isOfficeDoc = m.type === 'SLIDES' || m.type === 'WORD' || m.file_url.match(/\.(docx|pptx|xlsx|doc|ppt|xls)$/i);
    const viewerUrl = isOfficeDoc
      ? `https://docs.google.com/gview?url=${encodeURIComponent(m.file_url)}&embedded=true`
      : m.file_url;

    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Evalify Viewer - ${m.title}</title>
            <style>
              body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #0f172a; }
              iframe { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${viewerUrl}" allowfullscreen></iframe>
          </body>
        </html>
      `);
      newTab.document.close();
    } else {
      alert("Popup blocked! Enable popups to access class resources.");
    }
  };

  const handleDownload = (m) => {
    const link = document.createElement('a');
    link.href = m.file_url;
    link.download = m.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Unread Announcements Popup */}
      {showAnnouncementPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-slide-down">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">📢</span>
              <h3 className="text-xl font-bold text-white">New Announcements!</h3>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {unreadAnnouncements.map(ann => {
                const c = classes.find(cls => cls.id === ann.class_id);
                return (
                  <div key={ann.id} className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-md">{ann.title}</h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ann.type}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{ann.content}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {c ? c.name : 'Unknown Class'} • {new Date(ann.created_at || ann.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={dismissAnnouncements}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              Dismiss All
            </button>
          </div>
        </div>
      )}
      {/* --- DASHBOARD VIEW --- */}
      {!selectedClass ? (
        <>
          {/* Join Class Section */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">🏛️</span>
              <h3 className="text-xl font-bold text-white">Classroom Enrollment</h3>
            </div>
            <form onSubmit={handleJoinClass} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
              <input
                type="text"
                placeholder="Enter unique teacher code (e.g. F7A2B9)"
                className="flex-1 bg-slate-950 border border-white/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-white tracking-widest placeholder-slate-600"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                required
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-widest text-sm">Join Class</button>
            </form>
          </div>

          {/* Welcome Section */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome back, {student.name}!</h2>
            <p className="text-slate-400">Here's your learning dashboard</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Enrolled Classes", value: classes.length, icon: "🏫" },
              { label: "Assessments", value: assignments.length, icon: "📝" },
              { label: "Submitted", value: submissions.length, icon: "✅" },
              { label: "Materials", value: materials.length, icon: "📚" }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900 p-6 rounded-[24px] border border-white/10 shadow-lg">
                <div className="text-3xl mb-3">{stat.icon}</div>
                <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h4>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* My Classes Section */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">📚</span>
              <h3 className="text-xl font-bold text-white">My Classes</h3>
            </div>
            {student.joinedClasses && student.joinedClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(student.joinedClasses || []).map(classCode => {
                  const classDetails = getClassDetails(classCode);
                  if (!classDetails) return null;

                  const classAnnouncements = getClassAnnouncements(classDetails.id);
                  const classAssignments = getClassAssignments(classDetails.id);
                  const classMaterials = getClassMaterials(classDetails.id);

                  return (
                    <button
                      key={classCode}
                      onClick={() => {
                        setSelectedClass(classDetails);
                        setClassViewMode('overview');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-6 rounded-[24px] border border-white/5 bg-slate-950 hover:border-blue-500/40 shadow-xl transition-all duration-300 text-left relative overflow-hidden group"
                    >
                      <h4 className="font-black text-xl mb-3 text-slate-100 group-hover:text-blue-400 transition-colors">
                        {classDetails.name}
                      </h4>
                      <div className="inline-block px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest mb-4 bg-blue-500/10 text-blue-400">
                        Code: {classCode}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-xs font-bold text-slate-400">
                          <span className="font-black">{classAnnouncements.length}</span> Announcements
                        </div>
                        <div className="text-xs font-bold text-slate-400">
                          <span className="font-black">{classAssignments.length}</span> Assignments
                        </div>
                        <div className="text-xs font-bold text-slate-400">
                          <span className="font-black">{classMaterials.length}</span> Materials
                        </div>
                        <div className="text-xs font-bold text-slate-400">
                          <span className="font-black">{attendance.filter(a => a.class_id === classDetails.id).length}</span> Activities
                        </div>
                      </div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-400 transition-all">
                        Open Class Page →
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 italic">
                No classes joined yet. Use the enrollment form above to join your first class!
              </div>
            )}
          </div>
        </>
      ) : (
        /* --- SELECTED CLASS VIEW (PAGE) --- */
        <div className="animate-slide-up space-y-6">
          <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 rounded-[20px] bg-blue-600/20 text-blue-400 flex items-center justify-center text-3xl shadow-inner border border-blue-500/20">
                  🏫
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-white mb-1">{selectedClass.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                      Code: {selectedClass.code}
                    </span>
                    {classViewMode !== 'overview' && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest animate-pulse">
                          {classViewMode}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {classViewMode !== 'overview' && (
                  <button
                    onClick={() => {
                      setClassViewMode('overview');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-4 rounded-2xl bg-slate-950 text-xs font-black text-blue-400 uppercase border border-blue-500/20 hover:bg-blue-600/10 hover:border-blue-500/40 tracking-widest transition-all group flex items-center gap-3 active:scale-95"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Class Hub
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-4 rounded-2xl bg-slate-950 text-xs font-black text-white uppercase border border-white/10 hover:bg-slate-800 hover:border-white/20 tracking-widest transition-all group flex items-center justify-center gap-3 active:scale-95 w-full sm:w-auto"
                >
                  Dashboard
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs (Only shown when inside a section for quick switching) */}
            {classViewMode !== 'overview' && (
              <div className="flex flex-wrap bg-slate-950/50 p-2 rounded-3xl border border-white/5 w-fit shadow-lg backdrop-blur-md animate-fade-in">
                {[
                  { id: 'overview', label: 'Hub', icon: '🏠' },
                  { id: 'announcements', label: 'Announcements', icon: '📢' },
                  { id: 'assignments', label: 'Assessments', icon: '📝' },
                  { id: 'materials', label: 'Materials', icon: '📚' },
                  { id: 'activity', label: 'Activity', icon: '📈' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setClassViewMode(mode.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 px-6 py-2 rounded-[16px] text-[10px] font-black transition-all uppercase tracking-widest ${classViewMode === mode.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-white/10'
                      : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    <span>{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class Content */}
          <div className="space-y-6 min-h-[500px]">
            {classViewMode === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                {[
                  { id: 'announcements', label: "Announcements", value: getClassAnnouncements(selectedClass.id).length, icon: "📢", desc: "View class updates" },
                  { id: 'assignments', label: "Assessments", value: getClassAssignments(selectedClass.id).length, icon: "📝", desc: "Tasks & Exams" },
                  { id: 'materials', label: "Materials", value: getClassMaterials(selectedClass.id).length, icon: "📚", desc: "Study resources" },
                  { id: 'activity', label: "My Activity", value: attendance.filter(a => a.class_id === selectedClass.id).length, icon: "📈", desc: "Learning progress" }
                ].map((stat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setClassViewMode(stat.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-lg hover:border-blue-500/40 hover:bg-slate-800/50 transition-all duration-300 group text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="text-8xl">{stat.icon}</span>
                    </div>
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
                    <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">{stat.label}</h4>
                    <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      View Section →
                    </p>
                  </button>
                ))}
              </div>
            )}

            {classViewMode === 'announcements' && (
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-6">Class Announcements</h3>
                <div className="space-y-4">
                  {getClassAnnouncements(selectedClass.id)
                    .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
                    .map(announcement => (
                      <div key={announcement.id} className="p-4 sm:p-6 bg-slate-950 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg text-white">{announcement.title}</h4>
                          <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest ${announcement.type === 'IMPORTANT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            announcement.type === 'QUIZ' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              announcement.type === 'EXAM' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                announcement.type === 'ASSIGNMENT' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                            {announcement.type}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-medium whitespace-pre-wrap mb-3">{announcement.content}</p>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Posted by {announcement.author}</span>
                          <span>{new Date(announcement.created_at || announcement.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  {getClassAnnouncements(selectedClass.id).length === 0 && (
                    <div className="py-12 text-center text-slate-500 italic">
                      No announcements posted yet for this class.
                    </div>
                  )}
                </div>
              </div>
            )}

            {classViewMode === 'assignments' && (
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-6">Class Assignments</h3>
                <div className="space-y-4">
                  {getClassAssignments(selectedClass.id).map(assignment => {
                    const submission = getSubmissionForAssignment(assignment.id);
                    return (
                      <div key={assignment.id} className="p-4 sm:p-6 bg-slate-950 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="select-none group" onCopy={e => { e.preventDefault(); return false; }} onDragStart={e => e.preventDefault()}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">📝</span>
                            <h4 className="font-bold text-lg text-white pointer-events-none">{assignment.title}</h4>
                          </div>
                          <p className="text-slate-400 text-sm pointer-events-none mb-3 max-w-2xl">{assignment.description}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
                              Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-3 min-w-[150px]">
                          {submission ? (
                            <div className="flex flex-col items-end gap-2">
                              <span className={submission.status === 'GRADED' ? "bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20" : "bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20"}>
                                {submission.status === 'GRADED' ? 'Results Published ✓' : 'Submitted'}
                              </span>
                              {submission.status === 'GRADED' && (
                                <div className="text-right mt-1">
                                  <div className="text-2xl font-black text-white leading-none mb-1">
                                    {submission.score}
                                    <span className="text-slate-500 text-[10px] ml-1 uppercase tracking-tighter">/ {submission.total_marks || 100}</span>
                                  </div>
                                  {submission.feedback && (
                                    <p className="text-[10px] text-slate-400 italic max-w-[250px] leading-relaxed bg-slate-900/50 p-2 rounded-xl border border-white/5">
                                      "{submission.feedback}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">Pending</span>
                              {onNavigate && (
                                <button
                                  onClick={() => onNavigate('ide', assignment.id)}
                                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 border border-white/10"
                                >
                                  {assignment.type === 'CODING' ? 'Open Smart IDE' : 'Open Assessment'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {getClassAssignments(selectedClass.id).length === 0 && (
                    <div className="py-12 text-center text-slate-500 italic">
                      No assignments posted yet for this class.
                    </div>
                  )}
                </div>
              </div>
            )}

            {classViewMode === 'materials' && (
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-6">Class Materials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getClassMaterials(selectedClass.id).map(material => (
                    <div key={material.id} className="p-4 sm:p-6 bg-slate-950 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all flex flex-col justify-between">
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
                            {material.type === 'PDF' ? '📄' : material.type === 'SLIDES' ? '📊' : material.type === 'VIDEO' ? '🎥' : '📝'}
                          </span>
                          <div>
                            <h4 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{material.title}</h4>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{material.type} Resource</p>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{material.description || 'No description provided.'}</p>
                      </div>
                      <div className="flex justify-between items-center gap-3 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {new Date(material.created_at || material.timestamp).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(material)}
                            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-white/5 flex items-center gap-2"
                            title="View Material"
                          >
                            👁️ <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleDownload(material)}
                            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                            title="Download Material"
                          >
                            📥 <span className="hidden sm:inline">Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getClassMaterials(selectedClass.id).length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 italic">
                      No materials uploaded yet for this class.
                    </div>
                  )}
                </div>
              </div>
            )}

            {classViewMode === 'activity' && (
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/10 shadow-xl animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-6">My Activity in {selectedClass.name}</h3>
                <div className="space-y-4">
                  {attendance
                    .filter(a => a.class_id === selectedClass.id)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(record => (
                      <div key={record.id} className="p-4 sm:p-6 bg-slate-950 rounded-2xl border border-white/5 hover:border-blue-500/10 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-sm font-black border border-green-500/20">
                              ✓
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg">Viewed: {record.materialTitle}</h4>
                              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Access Protocol Verified</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-green-400 font-black text-xs uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Present</span>
                            <p className="text-[10px] text-slate-500 font-mono mt-2">{new Date(record.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {attendance.filter(a => a.class_id === selectedClass.id).length === 0 && (
                    <div className="py-12 text-center text-slate-500 italic">
                      No activity recorded yet for this class.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}





      {/* Assignments Section */}
      {/* <div className="bg-slate-900 p-8 rounded-[32px] border border-white/10 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">Your Assignments</h3>
        <div className="space-y-4">
          {assignments.map(assignment => {
            const submission = getSubmissionForAssignment(assignment.id);
            return (
              <div key={assignment.id} className="p-6 bg-slate-950 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg text-white">{assignment.title}</h4>
                  <p className="text-slate-400 text-sm">{assignment.description}</p>
                  <p className="text-xs text-slate-500 mt-1">Deadline: {new Date(assignment.deadline).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {submission ? (
                    <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">Submitted</span>
                  ) : (
                    <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="py-12 text-center text-slate-500 italic">
              No assignments yet. Join a class to get started!
            </div>
          )}
        </div>
      </div> */}

      {/* Materials Section */}
      {/* <div className="bg-slate-900 p-8 rounded-[32px] border border-white/10 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">Learning Materials</h3>
        <div className="space-y-4">
          {materials.map(material => (
            <div key={material.id} className="p-6 bg-slate-950 rounded-2xl border border-white/5">
              <h4 className="font-bold text-lg text-white">{material.title}</h4>
              <p className="text-slate-400 text-sm">{material.description}</p>
              <p className="text-xs text-slate-500 mt-1">Posted: {new Date(material.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="py-12 text-center text-slate-500 italic">
              No materials available yet.
            </div>
          )}
        </div>
      </div> */}

    </div>
  );
};

export default StudentDashboard;