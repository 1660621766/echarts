import React, { useEffect, useRef } from 'react';

// Leaflet types are global when loaded via CDN
declare global {
  interface Window {
    L: any;
  }
}

// Coordinates
// Beijing area to simulate the map
const CENTER_LAT = 39.915;
const CENTER_LNG = 116.404;

// Map logical coordinates to real lat/lng offset
const POINTS_DATA = [
  { id: 1, lat: 39.9140, lng: 116.4020, status: 'completed', label: '' },
  { id: 2, lat: 39.9130, lng: 116.4020, status: 'completed', label: '' },
  { id: 3, lat: 39.9125, lng: 116.4040, status: 'active', label: '当前位置' },
  { id: 4, lat: 39.9140, lng: 116.4060, status: 'pending', label: '平安月亮' },
  { id: 5, lat: 39.9160, lng: 116.4055, status: 'pending', label: '' },
  { id: 6, lat: 39.9155, lng: 116.4035, status: 'pending', label: '' },
];

const WORKER_POS = { lat: 39.9145, lng: 116.4040 };

// Colors
const COLORS = {
  completed: '#4ade80', // green-400
  active: '#3b82f6',    // blue-500
  pending: '#9ca3af',   // gray-400
  worker: '#FCA555',    // orange
};

// Weather Particle Config - Tuned to match the reference image
const PARTICLE_COUNT = 600; 
const WIND_VECTOR = { lat: -0.00004, lng: 0.00006 }; // Strong unidirectional flow
const BASE_SPEED = 0.2;

interface Particle {
  lat: number;
  lng: number;
  age: number;
  maxAge: number;
  speed: number;
  // Store trail as Geo coordinates to prevent artifacts during map pan/zoom
  trail: { lat: number, lng: number }[]; 
  offset: number; 
}

export const PatrolRouteMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (!window.L) {
      console.error("Leaflet not loaded");
      return;
    }

    // Initialize Map
    const map = window.L.map(mapContainerRef.current, {
      center: [CENTER_LAT, CENTER_LNG],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add Tile Layer (OpenStreetMap CartoDB Positron for a clean look)
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    // --- Draw Routes ---

    // 1. Completed Path
    const completedPath = [
        [POINTS_DATA[0].lat, POINTS_DATA[0].lng],
        [POINTS_DATA[1].lat, POINTS_DATA[1].lng],
        [POINTS_DATA[2].lat, POINTS_DATA[2].lng],
    ];

    window.L.polyline(completedPath, {
      color: COLORS.active,
      weight: 6,
      opacity: 0.9,
      lineJoin: 'round'
    }).addTo(map);

    // 2. Pending Path
    const pendingPath = [
        [POINTS_DATA[2].lat, POINTS_DATA[2].lng],
        [POINTS_DATA[3].lat, POINTS_DATA[3].lng],
        [POINTS_DATA[4].lat, POINTS_DATA[4].lng],
        [POINTS_DATA[5].lat, POINTS_DATA[5].lng],
        [POINTS_DATA[0].lat, POINTS_DATA[0].lng],
    ];

    window.L.polyline(pendingPath, {
      color: COLORS.pending,
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 10',
      lineJoin: 'round'
    }).addTo(map);


    // --- Add Markers ---
    const createPinIcon = (color: string, number: number) => {
        const html = `
          <div style="
            position: relative;
            width: 30px; 
            height: 30px; 
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg viewBox="0 0 40 45" width="30" height="34" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">
               <path d="M20 0 C9 0 0 7 0 20 C0 35 20 45 20 45 C20 45 40 35 40 20 C40 7 31 0 20 0 Z" fill="${color}" stroke="white" stroke-width="2"/>
               <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">${number}</text>
            </svg>
          </div>
        `;
        return window.L.divIcon({
          className: 'custom-pin-icon',
          html: html,
          iconSize: [30, 34],
          iconAnchor: [15, 34],
        });
    };

    POINTS_DATA.forEach(p => {
        const color = COLORS[p.status as keyof typeof COLORS];
        const marker = window.L.marker([p.lat, p.lng], {
            icon: createPinIcon(color, p.id),
            zIndexOffset: 100 // Ensure markers are above generic overlays but checked against canvas z-index
        }).addTo(map);

        if (p.label) {
            marker.bindTooltip(p.label, {
                permanent: true,
                direction: 'top',
                className: 'bg-white px-2 py-1 rounded shadow text-xs font-bold border border-gray-200',
                offset: [0, -30]
            });
        }
    });

    // --- Worker Marker ---
    const workerHtml = `
      <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(252, 165, 85, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid #e5e7eb;">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${COLORS.worker}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
           </svg>
        </div>
      </div>
      <style>
        @keyframes ping {
            75%, 100% {
                transform: scale(2);
                opacity: 0;
            }
        }
      </style>
    `;

    const workerIcon = window.L.divIcon({
        className: 'worker-icon',
        html: workerHtml,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });

    window.L.marker([WORKER_POS.lat, WORKER_POS.lng], {
        icon: workerIcon,
        zIndexOffset: 1000 // Very high to be on top of particles
    }).addTo(map);

    // --- Weather Particle Effect Setup ---
    initWeatherEffect(map);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (particleCanvasRef.current) {
         particleCanvasRef.current.remove();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const initWeatherEffect = (map: any) => {
    // 1. Create Canvas Layer
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through to map
    // Z-INDEX: 550 puts it above tiles (200) and overlay vectors (400), but below Markers (600)
    canvas.style.zIndex = '550'; 
    
    mapContainerRef.current?.appendChild(canvas);
    particleCanvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 2. Initialize Particles
    let particles: Particle[] = [];
    
    const resetParticle = (p: Particle, bounds: any) => {
      // Spawn area logic: cover the view plus padding
      const latRange = bounds.getNorth() - bounds.getSouth();
      const lngRange = bounds.getEast() - bounds.getWest();
      
      p.lat = bounds.getSouth() + Math.random() * latRange;
      p.lng = bounds.getWest() + Math.random() * lngRange;
      
      p.age = 0;
      p.maxAge = 100 + Math.random() * 150; 
      p.speed = BASE_SPEED + Math.random() * 0.5;
      p.trail = [];
      p.offset = Math.random() * 100;
    };

    const initParticles = () => {
      const bounds = map.getBounds().pad(0.4); 
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = {} as Particle;
        resetParticle(p, bounds);
        p.age = Math.random() * p.maxAge;
        particles.push(p);
      }
    };
    
    initParticles();

    // 3. Animation Loop
    const render = () => {
      if (!ctx || !canvas) return;
      
      // Handle Resize
      const container = mapContainerRef.current;
      if (container && (canvas.width !== container.offsetWidth || canvas.height !== container.offsetHeight)) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        initParticles(); 
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bounds = map.getBounds().pad(0.4); 

      // -- DRAW PARTICLES --
      ctx.lineCap = 'round';
      
      particles.forEach(p => {
        p.age++;
        p.lat += WIND_VECTOR.lat * p.speed;
        p.lng += WIND_VECTOR.lng * p.speed;
        
        // Store GEO coordinates in trail, not screen coordinates
        p.trail.push({lat: p.lat, lng: p.lng});
        
        if (p.trail.length > 10) p.trail.shift();

        const isOutOfBounds = !bounds.contains([p.lat, p.lng]);
        
        if (p.age > p.maxAge || isOutOfBounds) {
          resetParticle(p, bounds);
          // Initial trail point
          p.trail = [{lat: p.lat, lng: p.lng}];
        }

        if (p.trail.length > 2) {
          ctx.beginPath();
          
          // Project ALL trail points to current screen space every frame
          // This fixes the "floating trail" artifact during pan/zoom
          const startPoint = map.latLngToContainerPoint([p.trail[0].lat, p.trail[0].lng]);
          const endPoint = map.latLngToContainerPoint([p.trail[p.trail.length - 1].lat, p.trail[p.trail.length - 1].lng]);
          
          ctx.moveTo(startPoint.x, startPoint.y);

          for (let i = 1; i < p.trail.length; i++) {
            const point = map.latLngToContainerPoint([p.trail[i].lat, p.trail[i].lng]);
            ctx.lineTo(point.x, point.y);
          }
          
          // Alpha Fade
          let alpha = 0.8;
          const lifePercent = p.age / p.maxAge;
          
          if (lifePercent < 0.2) alpha = lifePercent * 4;
          else if (lifePercent > 0.8) alpha = (1 - lifePercent) * 4;
          
          if (alpha < 0) alpha = 0;
          if (alpha > 0.8) alpha = 0.8;

          // BLUE GRADIENT for trail
          // Gradient from Tail (transparent) to Head (visible)
          const grad = ctx.createLinearGradient(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
          grad.addColorStop(0, `rgba(59, 130, 246, 0)`); // Blue transparent at tail
          grad.addColorStop(1, `rgba(96, 165, 250, ${alpha})`); // Lighter blue at head

          ctx.strokeStyle = grad; 
          ctx.lineWidth = p.speed > 1.2 ? 2.5 : 2.5; 
          ctx.stroke();
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  return (
    <div className="w-full h-full relative group">
      <div ref={mapContainerRef} className="w-full h-full bg-gray-100 z-0" />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-100 z-[600]">
        <h3 className="text-sm font-bold text-gray-700 mb-2">巡检状态 (Live Map)</h3>
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
            <span>已巡检</span>
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>进行中</span>
          </div>
        </div>
        
        <div className="mt-4 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-blue-600 font-medium">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
               <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
             </svg>
             东南风 4级
          </div>
        </div>
      </div>
    </div>
  );
};
