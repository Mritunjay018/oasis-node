import React, { useState, useEffect, useRef } from 'react';

// Place this right above "export default function App() {"
export function DynamicRobot() {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      // Get the robot's exact position on the screen
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      // Calculate the distance between the mouse and the robot
      // Max rotation is 20 degrees for a realistic tilt
      const rotateX = ((e.clientY - centerY) / (window.innerHeight / 2)) * -20;
      const rotateY = ((e.clientX - centerX) / (window.innerWidth / 2)) * 20;
      
      // Apply the 3D CSS math
      setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-10 h-10 shrink-0 mb-2">
      {/* 1. The Glowing Aura (Pulse effect) */}
      <div className="absolute inset-0 rounded-full bg-[#e50914] opacity-40 blur-[10px] animate-pulse"></div>
      
      {/* 2. The Interactive Robot Head */}
      <div 
        ref={containerRef}
        className="w-full h-full rounded-full overflow-hidden border border-[#e50914]/50 relative z-10 bg-neutral-900 transition-transform duration-75 ease-out shadow-[0_0_15px_rgba(229,9,20,0.3)]"
        style={{ transform }}
      >
        <img src="/robot.png" alt="AI" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}