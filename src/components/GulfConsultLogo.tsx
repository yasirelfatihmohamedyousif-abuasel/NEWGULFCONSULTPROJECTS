import React from 'react';

interface LogoProps {
  className?: string;
  classNameWedges?: string;
}

export default function GulfConsultLogo({ className = "w-11 h-11", classNameWedges = "" }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none shrink-0 ${classNameWedges}`}>
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition-transform duration-200 hover:scale-105`}
      >
        {/* Top 3 Horizontal Trapezoidal Wedges */}
        {/* Topmost Wedge (Blue) */}
        <polygon points="12,10 188,10 168,24 32,24" fill="#23357a" />
        
        {/* Middle Wedge (Gold) */}
        <polygon points="34,31 166,31 150,43 50,43" fill="#cca43b" />
        
        {/* Bottommost Wedge (Blue) */}
        <polygon points="54,50 146,50 134,60 66,60" fill="#23357a" />

        {/* Main Shield Inverted Triangle Base */}
        {/* Top-left (15, 75), Top-right (185, 75), Bottom Apex (100, 225) */}
        
        {/* Left Side Partition (Deep Royal Blue) */}
        <polygon points="15,75 100,75 100,225" fill="#23357a" />
        
        {/* Right Side Partition (White background behind C) */}
        <polygon points="100,75 185,75 100,225" fill="#ffffff" />

        {/* --- STYLIZED GEOMETRIC LETTER 'G' (Gold) on Left Section --- */}
        {/* This path outlines the letter G, fitting flush in the left triangle half */}
        <path
          d="M 33,85 
             L 90,85 
             L 90,97 
             L 47,97 
             L 78,154 
             L 90,154 
             L 90,132 
             L 68,132 
             L 68,120 
             L 90,120 
             L 90,166 
             L 65,166 
             Z"
          fill="#cca43b"
        />

        {/* --- STYLIZED GEOMETRIC LETTER 'C' (Blue) on Right Section --- */}
        {/* This path outlines the letter C, fitting flush inside the right triangle half */}
        <path
          d="M 110,85 
             L 167,85 
             L 135,142 
             L 110,142 
             L 118,154 
             L 110,154 
             L 110,97 
             L 128,97 
             L 128,110 
             L 110,110 
             Z"
          fill="#23357a"
        />

        {/* Outer Triangular Crest Frame (Blue Outline) */}
        <polygon 
          points="15,75 185,75 100,225" 
          stroke="#23357a" 
          strokeWidth="7" 
          strokeLinejoin="miter" 
          fill="none" 
        />
      </svg>
    </div>
  );
}
