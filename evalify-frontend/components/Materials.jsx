import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Materials = ({ user }) => {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    type: '',
    classId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, matRes] = await Promise.all([
          axios.get(`${API_URL}/classes/user/${user.id}`),
          axios.get(`${API_URL}/materials/user/${user.id}`)
        ]);
        setClasses(classRes.data);
        setMaterials(matRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, [user.id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large (Max 5MB).");
        return;
      }
      setSelectedFile(file);

      let detectedType = 'DOCUMENT';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        detectedType = 'PDF';
      } else if (file.type.includes('presentation') || file.name.match(/\.(ppt|pptx|key)$/i)) {
        detectedType = 'SLIDES';
      } else if (file.type.includes('video') || file.name.match(/\.(mp4|mov|avi)$/i)) {
        detectedType = 'VIDEO';
      }

      setNewMaterial(prev => ({ ...prev, type: detectedType }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (newMaterial.type === 'VIDEO') {
      alert("Note tutorial hosting is planned for Version 2.0. Please use PDF or Slides for current assessments.");
      return;
    }
    if (!newMaterial.title || !selectedFile || !newMaterial.classId) {
      alert("All fields are mandatory for resource publishing.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Upload file to Supabase Storage
      const fileName = `${Date.now()}_${selectedFile.name.replace(/\s/g, '_')}`;
      const { data, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(fileName);

      // 3. Save the record to PostgreSQL via our backend
      const res = await axios.post(`${API_URL}/materials`, {
        title: newMaterial.title,
        description: newMaterial.description,
        classId: newMaterial.classId,
        fileUrl: publicUrl,
        type: newMaterial.type
      });

      const material = res.data;
      setMaterials([material, ...materials]);
      setIsUploading(false);
      setNewMaterial({ title: '', description: '', type: '', classId: '' });
      setSelectedFile(null);
      setIsProcessing(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload material: " + (error.message || "Connection error"));
      setIsProcessing(false);
    }
  };

  const handleView = async (m) => {
    if (user.role === 'STUDENT') {
      try {
        await axios.post(`${API_URL}/attendance`, {
          studentId: user.id,
          classId: m.class_id,
          materialId: m.id,
          materialTitle: m.title
        });
      } catch (err) {
        console.error("Failed to mark attendance", err);
      }
    }

    // Determine if we need a viewer for Office docs
    const isOfficeDoc = m.file_url.match(/\.(docx|pptx|xlsx|doc|ppt|xls)$/i);
    const viewerUrl = isOfficeDoc
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(m.file_url)}&embedded=true`
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

  const handleDelete = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/materials/${materialId}`);
        setMaterials(materials.filter(m => m.id !== materialId));
      } catch (err) {
        console.error("Error deleting material", err);
        alert("Failed to delete material.");
      }
    }
  };

  const filteredMaterials = selectedClassFilter === 'all'
    ? materials
    : materials.filter(m => m.class_id === selectedClassFilter);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-2xl border border-white/5">
          <span className="text-xs font-black uppercase text-slate-500 ml-4">View By Class</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-slate-950 text-white text-sm border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="all">All Classrooms</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {user.role === 'TEACHER' && (
          <button
            onClick={() => setIsUploading(!isUploading)}
            className={`px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-xl uppercase tracking-widest ${isUploading ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'}`}
          >
            {isUploading ? 'Cancel Upload' : '+ Add New Material'}
          </button>
        )}
      </div>

      {user.role === 'TEACHER' && isUploading && (
        <div className="bg-slate-900 p-10 rounded-[48px] border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">📂</span>
            Upload Resource
          </h3>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-950/50 rounded-[32px] border border-white/5 animate-slide-down">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Target Classroom</label>
              <select
                className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                value={newMaterial.classId}
                onChange={e => setNewMaterial({ ...newMaterial, classId: e.target.value })}
                required
              >
                <option value="">Select Target Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Resource Title</label>
              <input
                type="text" placeholder="e.g. Lecture 04 React Hooks" required
                className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                value={newMaterial.title}
                onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-3 mr-3 mb-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource File</label>
                {newMaterial.type && selectedFile && (
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                    Auto-detected: {newMaterial.type}
                  </span>
                )}
              </div>
              <div className="relative group">
                <input type="file" onChange={handleFileChange} className="w-full bg-slate-800 p-3 rounded-2xl text-xs text-slate-400 border border-dashed border-white/10 group-hover:border-blue-500/50 transition-all" required />
              </div>
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="bg-blue-600 text-white p-5 rounded-[24px] font-black uppercase tracking-widest md:col-span-2 disabled:opacity-50 transition-all hover:bg-blue-500 shadow-2xl shadow-blue-600/30 active:scale-95"
            >
              {isProcessing ? 'Verifying & Encrypting...' : 'Deploy to Students'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredMaterials.map(m => {
          const cls = classes.find(c => c.id === m.class_id);
          return (
            <div key={m.id} className="group bg-slate-900 border border-white/5 rounded-[48px] overflow-hidden hover:border-blue-500/30 transition-all duration-500 flex flex-col h-full shadow-2xl">
              <div className="h-48 bg-slate-800 flex items-center justify-center text-6xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="relative z-10 group-hover:scale-125 transition-transform duration-700">
                  {m.type === 'PDF' ? '📄' : m.type === 'SLIDES' ? '📊' : m.type === 'VIDEO' ? '🎥' : '📝'}
                </span>
                {m.type === 'VIDEO' && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-yellow-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg transform -rotate-12">Next Version</span>
                  </div>
                )}
              </div>
              <div className="p-10 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/10">
                    Class: {cls?.name || 'Classroom'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    {new Date(m.created_at || m.timestamp || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-black text-2xl mb-4 text-white group-hover:text-blue-400 transition-colors leading-tight">
                  {m.title}
                </h4>
                <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-10 leading-relaxed">
                  {m.description || 'This resource contains verified educational content uploaded by your instructor for the current semester.'}
                </p>
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => m.type !== 'VIDEO' && handleView(m)}
                    className={`flex-1 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all shadow-lg ${m.type === 'VIDEO' ? 'bg-slate-800 text-slate-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'}`}
                  >
                    {m.type === 'VIDEO' ? 'Inactive' : '👁️ View'}
                  </button>
                  {user.role === 'STUDENT' && (
                    <button
                      onClick={() => handleDownload(m)}
                      className="flex-1 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all shadow-lg bg-green-600 text-white hover:bg-green-500 active:scale-95"
                    >
                      📥 Download
                    </button>
                  )}
                  {user.role === 'TEACHER' && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="flex-1 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all shadow-lg bg-red-600 text-white hover:bg-red-500 active:scale-95"
                      title="Delete Material"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-40 text-center rounded-[60px] border-2 border-dashed border-white/5 bg-slate-900/50">
            <div className="text-6xl mb-6 grayscale opacity-30">📂</div>
            <p className="text-slate-500 font-bold text-xl">Resource list is currently empty.</p>
            <p className="text-slate-600 text-sm mt-2">Check your selected class filter or join a new class.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;