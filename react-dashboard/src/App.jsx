import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Terminal, Trash2, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

// ==========================================
// 1. THE DYNAMIC 3D ROBOT COMPONENT
// ==========================================
export function DynamicRobot() {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const rotateX = ((e.clientY - centerY) / (window.innerHeight / 2)) * -20;
      const rotateY = ((e.clientX - centerX) / (window.innerWidth / 2)) * 20;
      
      setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-10 h-10 shrink-0 mb-2">
      {/* Red Glowing Aura */}
      <div className="absolute inset-0 rounded-full bg-[#e50914] opacity-40 blur-[10px] animate-pulse"></div>
      
      {/* 3D Rotating Head */}
      <div 
        ref={containerRef}
        className="w-full h-full rounded-full overflow-hidden border border-[#e50914]/50 relative z-10 bg-neutral-900 transition-transform duration-75 ease-out shadow-[0_0_15px_rgba(229,9,20,0.3)]"
        style={{ transform }}
      >
        <img 
          src="/robot.jpg" 
          alt="AI" 
          className="w-full h-full object-cover" 
          onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='🤖'; }} 
        />
      </div>
    </div>
  );
}

// ==========================================
// 2. MAIN APP DASHBOARD
// ==========================================
export default function App() {
  // Splash Screen Logic
  const [showSplash, setShowSplash] = useState(true);
  const [splashText, setSplashText] = useState('');
  const fullText = "Welcome Jay, have a great learning";

  // Sidebar Logic
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setSplashText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) {
        clearInterval(timer);
        setTimeout(() => setShowSplash(false), 1500); 
      }
    }, 60); 
    return () => clearInterval(timer);
  }, []);

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('oasis_sessions');
    return saved ? JSON.parse(saved) : [{ id: `chat_${Date.now()}`, title: "New Session" }];
  });
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('oasis_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/history/${activeSessionId}`);
        const formattedMessages = res.data.history.map(msg => ({
          role: msg.role === 'User' ? 'user' : 'ai',
          content: msg.content
        }));
        setMessages(formattedMessages);
      } catch (error) {
        setMessages([]); 
      }
    };
    if (!showSplash) loadHistory(); 
  }, [activeSessionId, showSplash]);

  const startNewSession = () => {
    const newSession = { id: `chat_${Date.now()}`, title: "New Session" };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Mobile auto-close
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const fresh = { id: `chat_${Date.now()}`, title: "New Session" };
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionId === id) setActiveSessionId(updated[0].id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    if (messages.length === 0) {
      const updatedSessions = sessions.map(s => 
        s.id === activeSessionId ? { ...s, title: userMsg.substring(0, 25) + "..." } : s
      );
      setSessions(updatedSessions);
    }

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/chat', { 
        session_id: activeSessionId, 
        message: userMsg 
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Error: Backend unreachable." }]);
    }
    setIsTyping(false);
  };

  if (showSplash) {
    return (
      <div className="flex h-screen w-screen bg-[#050505] items-center justify-center transition-opacity duration-1000">
        <h1 className="text-white text-3xl md:text-5xl font-bold tracking-tight border-r-4 border-[#e50914] pr-2 animate-pulse">
          {splashText}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-gray-200 font-sans overflow-hidden animate-fade-in relative">
      
      {/* ANIMATED SLIDING SIDEBAR */}
      <div className={`bg-[#0a0a0a] border-r border-neutral-800 flex flex-col relative transition-all duration-300 ease-in-out z-20 overflow-hidden ${isSidebarOpen ? 'w-72' : 'w-0 border-r-0'}`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar mb-20 min-w-[18rem]">
          <div className="flex justify-between items-center mb-4 mt-2">
            <h3 className="text-xs font-bold text-neutral-500 tracking-widest">CHAT HISTORY</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white transition">
              <X size={16} />
            </button>
          </div>
          {sessions.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveSessionId(chat.id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === chat.id ? 'bg-[#1a1a1a] border-[#e50914]/50 text-white shadow-[0_0_15px_rgba(229,9,20,0.1)]' : 'border-transparent hover:bg-[#111] text-gray-400'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={`${activeSessionId === chat.id ? 'text-[#e50914]' : 'text-neutral-500'} shrink-0`} />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </div>
              <button onClick={(e) => deleteSession(e, chat.id)} className="text-gray-600 hover:text-[#e50914] transition-colors cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent min-w-[18rem]">
          <button 
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 bg-[#e50914] hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:shadow-[0_0_25px_rgba(229,9,20,0.5)] active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} /> NEW CHAT
          </button>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#050505] w-full">
        
        {/* Header */}
        <header className="p-6 flex items-center gap-4 bg-[#0a0a0a]/50 backdrop-blur border-b border-neutral-900">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white transition cursor-pointer">
             <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-extrabold tracking-widest text-xl text-white flex items-center gap-2">
              OASIS<span className="text-[#e50914]">_NODE</span>
            </h1>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col text-white">
               {/* 🤖 CENTER DYNAMIC ROBOT ADDED HERE */}
               <div className="scale-[2.5] mb-12">
                 <DynamicRobot />
               </div>
               
               <h2 className="text-4xl font-black tracking-tighter opacity-80 animate-pulse">
                 Welcome Jay
               </h2>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-4 items-end`}>
                
                {/* AI ROBOT AVATAR */}
                {msg.role === 'ai' && <DynamicRobot />}

                <div className={`max-w-[75%] rounded-3xl p-5 shadow-2xl ${msg.role === 'user' ? 'bg-[#e50914] text-white rounded-br-sm font-medium' : 'bg-[#111] border border-neutral-800 text-gray-200 rounded-bl-sm'}`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-invert max-w-none prose-pre:bg-black prose-pre:border prose-pre:border-neutral-800 text-gray-200">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {/* USER 'J' AVATAR */}
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 mb-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <span className="font-black text-black text-lg">J</span>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isTyping && (
             <div className="flex justify-start gap-4 items-end">
               <DynamicRobot />
               <div className="bg-[#111] border border-[#e50914]/30 rounded-3xl rounded-bl-sm p-5 shadow-lg flex gap-2 items-center h-[60px]">
                 <div className="w-2.5 h-2.5 bg-[#e50914] rounded-full animate-bounce"></div>
                 <div className="w-2.5 h-2.5 bg-[#e50914] rounded-full animate-bounce delay-100"></div>
                 <div className="w-2.5 h-2.5 bg-[#e50914] rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </main>

        {/* Input Footer */}
        <footer className="p-6 bg-gradient-to-t from-[#050505] to-transparent">
          <div className="max-w-4xl mx-auto flex gap-4 bg-[#111] p-2 rounded-2xl border border-neutral-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] focus-within:border-[#e50914]/50 transition-colors">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Oasis Node..." 
              className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-white placeholder:text-neutral-600 font-medium"
            />
            <button 
              onClick={sendMessage} 
              disabled={isTyping || !input.trim()}
              className="bg-white hover:bg-gray-200 disabled:bg-[#1a1a1a] disabled:text-neutral-600 text-black p-4 rounded-xl transition-all cursor-pointer font-bold"
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>

    </div>
  );
}