import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Particle, MouseState, ParticleCanvasHandle } from '../types';

interface ParticleCanvasProps {
  imageSrc: string | null;
}

const ParticleCanvas = forwardRef<ParticleCanvasHandle, ParticleCanvasProps>(({ imageSrc }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Target represents the raw input (mouse or hand)
  const targetRef = useRef<{x: number | null, y: number | null}>({ x: null, y: null });
  // Current represents the smoothed position used for rendering
  const currentRef = useRef<{x: number | null, y: number | null}>({ x: null, y: null });
  // Interaction radius
  const radiusRef = useRef<number>(320); 

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    downloadSnapshot: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `particle-universe-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    setInteractionPoint: (x: number | null, y: number | null) => {
      targetRef.current.x = x;
      targetRef.current.y = y;
    }
  }));

  // Initialize Particles
  const initParticles = useCallback((img: HTMLImageElement, width: number, height: number) => {
    imageRef.current = img;
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Universe Dimensions (Sphere) for particle generation boundaries
    const centerX = width / 2;
    const centerY = height / 2;
    // Radius slightly larger to encompass more view
    const universeRadius = Math.min(width, height) * 0.45;

    // Draw image centered
    const aspectRatio = img.width / img.height;
    // Scale logic: 2.0x for significant magnification
    let drawWidth = width * 2.0; 
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > height * 2.0) {
      drawHeight = height * 2.0;
      drawWidth = drawHeight * aspectRatio;
    }

    const startX = (width - drawWidth) / 1.8;
    const startY = (height - drawHeight) / 2.5;

    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newParticles: Particle[] = [];

    // 1. Generate Ambient "Universe" Particles INSIDE the Sphere
    const sphereArea = Math.PI * universeRadius * universeRadius;
    const targetCount = Math.floor(sphereArea / 30); 
    const ambientCount = Math.min(targetCount, 20000);
    
    for (let i = 0; i < ambientCount; i++) {
        // Random polar coordinates for uniform sphere distribution
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * universeRadius;
        
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        // RELATIVE ORIGIN: Store offset from center
        const originX = x - centerX;
        const originY = y - centerY;
        
        // Logic: 99.5% Dark Matter, 0.5% Stars
        const isStar = Math.random() < 0.005;
        let color, size;

        if (isStar) {
            const val = Math.floor(Math.random() * 100 + 155); 
            color = `rgb(${val}, ${val}, ${val})`;
            size = Math.random() * 1.5 + 0.5;
        } else {
            const val = Math.floor(Math.random() * 30 + 10); 
            color = `rgb(${val}, ${val}, ${val})`;
            size = Math.random() * 2 + 0.5;
        }
        
        newParticles.push({
            x: x,
            y: y,
            originX: originX, // Storing relative offset!
            originY: originY,
            color: color,
            size: size,
            vx: 0,
            vy: 0,
            density: Math.random() * 20 + 1,
        });
    }

    // 2. Generate Image Particles (Pure White)
    const step = width < 768 ? 3 : 2; // Optimize density for performance with large scale

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const pX = Math.floor(x);
        const pY = Math.floor(y);
        
        const index = (pY * width + pX) * 4;
        
        if (index >= data.length) continue;

        const alpha = data[index + 3];

        if (alpha > 128) {
          const color = 'rgb(255, 255, 255)';
          
          // RELATIVE ORIGIN: Image particles also stored relative to center
          const originX = pX - centerX;
          const originY = pY - centerY;

          newParticles.push({
            x: Math.random() * width, // Start chaotic
            y: Math.random() * height,
            originX: originX,
            originY: originY,
            color: color,
            size: Math.random() < 0.3 ? Math.random() * 0.8 + 0.6 : Math.random() * 0.4 + 0.2, 
            vx: 0,
            vy: 0,
            density: Math.random() * 30 + 1,
          });
        }
      }
    }

    setParticles(newParticles);
  }, []);

  // Handle Image Loading
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      if (canvasRef.current) {
        initParticles(img, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [imageSrc, initParticles]);

  // Handle Resize with Debounce
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Immediate canvas resize to avoid stretching
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;

        // Debounced particle regeneration
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        
        resizeTimeoutRef.current = setTimeout(() => {
          if (imageRef.current && canvasRef.current) {
             initParticles(imageRef.current, canvasRef.current.width, canvasRef.current.height);
          }
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [initParticles]);

  // Animation Loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamic Center Calculation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const universeRadius = Math.min(canvas.width, canvas.height) * 0.45;

    // Linear Interpolation for smoothness
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    const smoothFactor = 0.15;

    if (targetRef.current.x !== null && targetRef.current.y !== null) {
        if (currentRef.current.x === null) {
            currentRef.current.x = targetRef.current.x;
            currentRef.current.y = targetRef.current.y;
        } else {
            currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, smoothFactor);
            currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, smoothFactor);
        }
    } else {
        currentRef.current.x = null;
        currentRef.current.y = null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- DRAW SPHERICAL UNIVERSE BACKGROUND ---
    
    // Draw the Black Sphere Base
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, universeRadius, 0, Math.PI * 2);
    ctx.fill();

    // --- PHYSICS & PARTICLES ---

    // Physics Phase
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      const dx = (currentRef.current.x || -1000) - p.x;
      const dy = (currentRef.current.y || -1000) - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const maxDistance = radiusRef.current;
      
      // Calculate dynamic home position based on relative origin + current center
      const homeX = centerX + p.originX;
      const homeY = centerY + p.originY;
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const directionX = forceDirectionX * force * p.density * 2.0; 
        const directionY = forceDirectionY * force * p.density * 2.0;
        
        p.vx -= directionX;
        p.vy -= directionY;
      } else {
        if (p.x !== homeX) {
          const dxHome = p.x - homeX;
          p.vx -= dxHome / 25; 
        }
        if (p.y !== homeY) {
          const dyHome = p.y - homeY;
          p.vy -= dyHome / 25;
        }
      }

      p.vx *= 0.90; // Friction
      p.vy *= 0.90;

      p.x += p.vx;
      p.y += p.vy;
    }

    // Drawing Phase
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Render
        ctx.fillStyle = p.color;
        if (p.size < 2) {
            ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw Visual Cursor/Pointer
    if (currentRef.current.x !== null && currentRef.current.y !== null) {
        const gradient = ctx.createRadialGradient(
            currentRef.current.x, currentRef.current.y, 10,
            currentRef.current.x, currentRef.current.y, 80
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentRef.current.x, currentRef.current.y, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [particles]);

  useEffect(() => {
    if (particles.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate, particles]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      targetRef.current.x = e.clientX - rect.left;
      targetRef.current.y = e.clientY - rect.top;
    }
  };

  const handleMouseLeave = () => {
    targetRef.current.x = null;
    targetRef.current.y = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="block w-full h-full bg-transparent cursor-crosshair touch-none"
    />
  );
});

export default ParticleCanvas;