import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';


const CodingIDE = ({ student }) => {
  const [code, setCode] = useState('// Evalify Web-IDE\n// Select an assignment from the dropdown above to begin.\n\nfunction solve() {\n  console.log("Ready for assessment...");\n}');
  const [language, setLanguage] = useState('javascript');
  const [stdin, setStdin] = useState('');
  const [switchCount, setSwitchCount] = useState(0);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, submissionsRes] = await Promise.all([
          fetch(`${API_URL}/assignments/user/${student.id}`).then(res => res.json()),
          fetch(`${API_URL}/assignments/submissions?studentId=${student.id}`).then(res => res.json())
        ]);
        setAssignments(assignmentsRes);
        setUserSubmissions(submissionsRes);
      } catch (error) {
        console.error("Error fetching IDE data:", error);
      }
    };
    fetchData();
  }, [student.id]);

  // Derived state for the currently selected assignment
  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const hasSubmitted = selectedAssignment
    ? userSubmissions.some(s => s.assignment_id === selectedAssignment.id)
    : false;

  // Check if deadline is past (comparing midnight local time dates is safest for basic `<input type="date">` usage)
  const isPastDeadline = selectedAssignment
    ? new Date(selectedAssignment.deadline).setHours(23, 59, 59, 999) < Date.now()
    : false;

  useEffect(() => {
    if (!selectedAssignment || !(selectedAssignment.durationValue || selectedAssignment.duration)) {
      setTimeLeft(null);
      return;
    }

    let timerInterval;

    const startTimer = async () => {
      let startTime;
      try {
        // Sync with backend attempt
        const res = await fetch(`${API_URL}/assignments/attempts?studentId=${student.id}&assignmentId=${selectedAssignment.id}`);
        const attempts = await res.json();

        if (attempts && attempts.length > 0) {
          startTime = new Date(attempts[0].start_time).getTime();
        } else {
          // If no backend attempt exists, create one
          const postRes = await fetch(`${API_URL}/assignments/attempts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student.id, assignmentId: selectedAssignment.id })
          });
          const newAttempt = await postRes.json();
          startTime = new Date(newAttempt.start_time || Date.now()).getTime();
        }
      } catch (err) {
        console.error("Error syncing attempt timer:", err);
        startTime = Date.now();
      }

      const value = parseInt(selectedAssignment.durationValue || selectedAssignment.duration, 10);
      if (isNaN(value) || value <= 0) {
        setTimeLeft(null);
        return;
      }

      let totalSeconds = 0;
      const unit = selectedAssignment.durationUnit || selectedAssignment.duration_unit;
      if (unit === 'Minutes' || unit === 'minutes') totalSeconds = value * 60;
      else if (unit === 'Hours' || unit === 'hours') totalSeconds = value * 3600;
      else if (unit === 'Days' || unit === 'days') totalSeconds = value * 86400;

      const tick = () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const remaining = totalSeconds - elapsedSeconds;

        if (remaining <= 0) {
          setTimeLeft(0);
          if (timerInterval) clearInterval(timerInterval);
        } else {
          setTimeLeft(remaining);
        }
      };

      tick();
      timerInterval = setInterval(tick, 1000);
    };

    startTimer();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [selectedAssignment, student.id, API_URL]);

  const formatTime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle selected assignment starter code
  const handleAssignmentSelect = (id) => {
    setSelectedAssignmentId(id);
    const assignment = assignments.find(a => a.id === id);
    if (assignment?.starter_code) {
      setCode(assignment.starter_code);
    }
    if (assignment?.language) {
      setLanguage(assignment.language);
    }
  };

  // Integrity logic switching detection
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only log if the assignment is selected and NOT yet submitted
      if (document.hidden && selectedAssignmentId && !hasSubmitted) {
        // Show a warning popup immediately
        alert("WARNING: Navigating away from the assessment tab is strictly prohibited! Your action has been flagged and reported to your instructor.");

        // 1. Update UI state (React might call this multiple times in Strict Mode, but it's pure)
        setSwitchCount(prev => prev + 1);

        // 2. Call backend once (Outside of the state setter)
        fetch(`${API_URL}/integrity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            assignmentId: selectedAssignmentId,
            type: 'TAB_SWITCH',
            description: `Student switched tabs during active assessment.`
          })
        }).catch(err => console.error("Integrity log failed:", err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [student.id, selectedAssignmentId, hasSubmitted]);

  const handleRun = async () => {
    setIsExecuting(true);
    setOutput('');
    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language,
          stdin: stdin
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOutput(`[Error] ${data.error || 'Failed to execute code'}\n`);
        return;
      }

      let resultText = '';
      if (data.stdout) resultText += `${data.stdout}`;
      if (data.stderr) resultText += `[RUNTIME ERROR]\n${data.stderr}`;
      if (data.error) resultText += `[SYSTEM ERROR]\n${data.error}`;

      if (!resultText) resultText = '(No output returned)';

      setOutput(resultText);
      setHasRun(true);

    } catch (err) {
      setOutput(`[NETWORK ERROR] Could not connect to the execution server.\nMake sure the backend is running.\n${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedAssignmentId) {
      alert("Choose a valid lab assignment before submitting.");
      return;
    }

    const assignment = assignments.find(a => a.id === selectedAssignmentId);
    if (!assignment) return;

    if (hasSubmitted) {
      alert("You have already submitted this assignment.");
      return;
    }

    if (isPastDeadline) {
      alert("The deadline for this assignment has passed. Submissions are no longer accepted.");
      return;
    }

    if (timeLeft === 0) {
      alert("Time is up! You can no longer submit this assignment.");
      return;
    }

    if (!hasRun) {
      alert("Please run your code to verify the output before submitting!");
      return;
    }

    if (window.confirm("Are you sure you want to finalize your submission? You cannot resubmit after this.")) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/assignments/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: selectedAssignmentId,
            studentId: student.id,
            code: code,
            language: language,
            status: 'SUBMITTED',
            output: output // Optional metadata or score?
          })
        });

        if (!response.ok) throw new Error("Submission failed");

        const newSubmission = await response.json();
        setUserSubmissions([...userSubmissions, newSubmission]);
        alert("Success! Your code has been delivered to your instructor.");
      } catch (e) {
        alert("Submission system is currently unavailable.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative max-w-[1600px] mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/5 backdrop-blur-xl p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-white/10 shadow-2xl relative z-20">
        <div className="flex flex-wrap items-center gap-3 lg:gap-4 w-full xl:w-auto">
          <div className="relative group w-full sm:w-auto flex-1">
            <select
              value={selectedAssignmentId}
              onChange={(e) => handleAssignmentSelect(e.target.value)}
              className="w-full bg-slate-950/80 text-sm border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer text-white shadow-inner transition-all hover:bg-slate-900"
            >
              <option value="">-- Active Lab Selection --</option>
              {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full sm:w-[160px] bg-slate-950/80 text-sm border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer text-white shadow-inner transition-all hover:bg-slate-900 font-mono"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:from-slate-700 disabled:to-slate-800 text-white text-sm px-6 lg:px-8 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-3"
          >
            {isExecuting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
            )}
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>
        </div>

        <div className="flex flex-col items-center xl:items-end w-full xl:w-auto space-y-3">
          <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3 w-full">
            {timeLeft !== null && (
              <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-black uppercase tracking-widest text-xs shadow-inner backdrop-blur-md ${timeLeft < 300 && timeLeft > 0 ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' : 'bg-slate-900 text-emerald-400 border-emerald-500/30'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {timeLeft > 0 ? formatTime(timeLeft) : 'TIME UP!'}
              </div>
            )}
            {switchCount > 0 && (
              <div title="Tab switches tracked" className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 shadow-inner">
                <span className="text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Flags: {switchCount}
                </span>
              </div>
            )}
            <button
              onClick={handleSubmitCode}
              disabled={isSubmitting || !selectedAssignmentId || hasSubmitted || isPastDeadline || timeLeft === 0}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm px-6 py-3 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative">
                {isSubmitting ? 'Delivering...' : hasSubmitted ? 'Submitted ✓' : isPastDeadline ? 'Deadline Passed' : timeLeft === 0 ? 'Time Up' : 'Submit Lab'}
              </span>
            </button>
          </div>
          {selectedAssignment && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span>Due Date:</span>
              <span className={isPastDeadline ? 'text-red-400' : 'text-blue-300'}>{new Date(selectedAssignment.deadline).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main IDE Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px] lg:h-[calc(100vh-220px)] min-h-[600px]">

        {/* Left Column: Question & Monaco Editor (7/12 width) */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full text-left">

          {/* Question Display Area */}
          {selectedAssignment && selectedAssignment.description && (
            <div
              className="h-[30%] bg-slate-900 border border-white/5 rounded-[32px] shadow-lg p-6 overflow-auto custom-scrollbar select-none relative group"
              style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              onCopy={(e) => {
                e.preventDefault();
                alert("Copying questions is disabled for integrity.");
                fetch(`${API_URL}/integrity`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentId: student.id,
                    assignmentId: selectedAssignmentId,
                    type: 'COPY_PASTE',
                    description: `Student attempted to copy the assignment question.`
                  })
                }).catch(err => console.error("Integrity log failed:", err));
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="absolute top-0 w-full left-0 h-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50"></div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Problem Statement (Do not copy)
              </h3>
              <div className="text-slate-200 text-[14px] leading-relaxed whitespace-pre-wrap font-medium">
                {selectedAssignment.description}
              </div>
            </div>
          )}

          {/* Monaco Editor Component */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group min-h-[300px]">
            <div className="absolute top-0 w-full h-10 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none flex items-center px-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30">src/main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}</div>
            </div>
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(val) => {
                setCode(val || '');
                setHasRun(false);
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
                padding: { top: 24, bottom: 24 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                lineHeight: 24,
                formatOnPaste: true,
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                renderLineHighlight: "all",
              }}
            />
          </div>
        </div>

        {/* Right Column: Input & Output (5/12 width) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">

          {/* STDIN Area (30% height) */}
          <div className="h-[30%] bg-slate-900 flex flex-col border border-white/5 rounded-[32px] shadow-lg overflow-hidden transition-all focus-within:border-blue-500/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-white/5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Standard Input (STDIN)
              </h3>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter inputs here (e.g., numbers, strings) before running your code. Each value should be separated by a newline or space depending on how your code reads it..."
              className="flex-1 w-full bg-transparent text-slate-300 font-mono text-[13px] p-6 outline-none resize-none placeholder:text-slate-600 leading-relaxed custom-scrollbar"
              spellCheck="false"
            />
          </div>

          {/* STDOUT/Terminal Area (70% height) */}
          <div className="h-[70%] bg-[#0B0F19] flex flex-col border border-white/5 rounded-[32px] shadow-2xl overflow-hidden relative group">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B0F19] border-b border-white/5 backdrop-blur-md">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Console / Output
              </h3>
              {output && (
                <button
                  onClick={() => setOutput('')}
                  className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-wider transition-colors"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-6 overflow-auto custom-scrollbar font-mono text-[13px] leading-relaxed">
              {isExecuting ? (
                <div className="flex items-center gap-3 text-blue-400 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Building and executing code...
                </div>
              ) : output ? (
                <pre className={`whitespace-pre-wrap ${output.includes('ERROR]') ? 'text-red-400' : 'text-emerald-400'} font-medium`}>
                  {output}
                </pre>
              ) : (
                <div className="text-slate-600 flex flex-col gap-2 h-full justify-center">
                  <div>$ System initialized.</div>
                  <div>$ Waiting for execution...</div>
                  <div className="animate-pulse">_</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Global minimal scrollbar injection just for this component if needed, though Tailwind might cover it */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
};

export default CodingIDE;