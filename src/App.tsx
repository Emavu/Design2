import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Plus, Trash2, Edit2, X, Image as ImageIcon, ExternalLink, Calendar, MapPin, Box, LogOut } from 'lucide-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center, View, Preload } from '@react-three/drei';
import { GLTFLoader, FBXLoader, STLLoader } from 'three-stdlib';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { 
  ref as sRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { auth, db, storage, signInWithGoogle, logout } from './lib/firebase';
import { PortfolioData, PortfolioItem } from './types';
import { DEFAULT_PORTFOLIO_DATA } from './constants';

// --- Global helper to generate stable random size with varied formats ---
const getRandomSize = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const type = hash % 3; // 0: Portrait, 1: Landscape, 2: Square
  
  if (type === 0) { // Portrait
    return { width: 120 + (hash % 30), height: 180 + (hash % 40) };
  } else if (type === 1) { // Landscape
    return { width: 200 + (hash % 40), height: 130 + (hash % 30) };
  } else { // Square
    const s = 150 + (hash % 30);
    return { width: s, height: s };
  }
};

// --- Multi-Format Model Viewer ---
const Model = ({ url }: { url: string }) => {
  const isStl = url.toLowerCase().endsWith('.stl');
  const isGltf = url.toLowerCase().endsWith('.gltf') || url.toLowerCase().endsWith('.glb');
  const isFbx = url.toLowerCase().endsWith('.fbx');

  if (isStl) {
    const geom = useLoader(STLLoader, url);
    return <mesh geometry={geom}><meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} /></mesh>;
  }

  if (isGltf) {
    const { scene } = useLoader(GLTFLoader, url);
    return <primitive object={scene} />;
  }

  if (isFbx) {
    const fbx = useLoader(FBXLoader, url);
    return <primitive object={fbx} />;
  }

  return null;
};

const StlViewer = ({ url, isThumbnail = false }: { url: string, isThumbnail?: boolean }) => {
  return (
    <div className={`w-full h-full bg-zinc-50 overflow-hidden relative border border-black/5 ${isThumbnail ? 'pointer-events-none' : ''}`}>
      <Canvas shadows={!isThumbnail} gl={{ antialias: true }} camera={{ position: [0, 0, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} shadows={isThumbnail ? false : "contact"}>
            <Center>
              <Model url={url} />
            </Center>
          </Stage>
        </Suspense>
        {!isThumbnail && <OrbitControls makeDefault />}
      </Canvas>
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">{isThumbnail ? '3D' : 'Interactive 3D View'}</span>
      </div>
    </div>
  );
};

// --- Custom Hook for Firebase Data ---
function usePortfolioData() {
  const [data, setData] = useState<PortfolioData>(DEFAULT_PORTFOLIO_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sync Settings
    const settingsDoc = doc(db, 'settings', 'portfolio');
    const unsubSettings = onSnapshot(settingsDoc, (snap) => {
      if (snap.exists()) {
        setData(prev => ({ ...prev, ownerName: snap.data().ownerName }));
      } else {
        // Initialize settings if empty
        setDoc(settingsDoc, { ownerName: DEFAULT_PORTFOLIO_DATA.ownerName });
      }
    });

    // 2. Sync Projects
    const projectsCol = collection(db, 'projects');
    const q = query(projectsCol, orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioItem[];
      setData(prev => ({ ...prev, items }));
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubProjects();
    };
  }, []);

  return { data, loading };
}

type ViewState = 'work' | 'about';

// --- Sound Engine Helper ---
const SoundManager = {
  ctx: null as AudioContext | null,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  },

  playSwoosh() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    // Create white noise for a more natural wind/swoosh sound
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.5);
    filter.Q.value = 1;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.1); // Slightly quieter, more natural
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
    noise.stop(this.ctx.currentTime + 0.5);
  },

  playClick() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
};

// --- Custom Cursor Component ---
const CustomCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) {
        setIsVisible(true);
        document.body.style.cursor = 'none';
      }
      
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const computedStyle = window.getComputedStyle(target);
      setIsPointer(
        computedStyle.cursor === 'pointer' || 
        ['BUTTON', 'A', 'INPUT'].includes(target.tagName) ||
        target.closest('button') !== null ||
        target.closest('a') !== null
      );
    };
    
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.body.style.cursor = 'auto';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Red dot for debugging - will remove once verified */}
      <motion.div 
        className="custom-cursor transition-none" 
        animate={{ 
          x: pos.x - 6, 
          y: pos.y - 6,
          scale: isPointer ? 1.5 : 1
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 500, mass: 0.5 }}
      />
      <motion.div 
        className="custom-cursor-follower transition-none" 
        animate={{ 
          x: pos.x - 20, 
          y: pos.y - 20,
          scale: isPointer ? 1.5 : 1
        }}
        transition={{ type: 'spring', damping: 35, stiffness: 250, mass: 0.8 }}
      />
    </>
  );
};

const Logo = ({ className = "w-16 h-32" }: { className?: string }) => (
  <img 
    src="/logo.png" 
    alt="Logo" 
    className={`${className} object-contain`} 
    referrerPolicy="no-referrer"
  />
);

const LoopingGallery = ({ images, interval = 3000 }: { images: string[], interval?: number }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images || images.length === 0) return null;

  // Dynamic Pagination for Gallery
  const n = images.length;
  const targetW = 40; // smaller for internal gallery
  const avail = targetW / n;
  const gap = Math.max(2, avail * 0.3); 
  const size = Math.min(4, Math.max(2, avail - gap));

  return (
    <div className="w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={images[index]}
          src={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }} // 3x slower transition duration
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 flex" style={{ gap: `${gap}px` }}>
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`rounded-full transition-all duration-300 ${i === index ? 'bg-orange-500 scale-125' : 'bg-orange-200/20'} backdrop-blur-sm border border-white/10`} 
              style={{ width: `${size}px`, height: `${size}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AboutPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-10 bg-white overflow-y-auto px-6 pt-32 pb-20 md:px-20 md:pt-40"
    >
      <div className="max-w-4xl mx-auto space-y-16">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400">Spec / Objective</h2>
            <p className="text-2xl md:text-3xl font-display font-medium leading-tight">
              Bridging the gap between raw material intelligence and human-centric utility through intentional industrial geometry.
            </p>
          </div>
          <div className="text-zinc-500 font-mono text-[11px] leading-relaxed space-y-4">
            <p>
              Based in the intersection of digital craft and physical manufacturing, my practice focuses on high-performance product development and speculative industrial design.
            </p>
            <p>
              Every project is an exploration of technical constraints as creative opportunities—utilizing STL precision and FBX versatility to define the next generation of studio-grade hardware.
            </p>
          </div>
        </section>

        <section className="border-t border-black/5 pt-12">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400 mb-8">Technical Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Modeling</span>
              <span className="block text-sm opacity-60">Rhino / Grasshopper</span>
            </div>
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Surfacing</span>
              <span className="block text-sm opacity-60">Alias / Fusion 360</span>
            </div>
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Visualization</span>
              <span className="block text-sm opacity-60">KeyShot / Octane</span>
            </div>
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Prototyping</span>
              <span className="block text-sm opacity-60">SLA / FDM Printing</span>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 pt-12 pb-20">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-8 max-w-sm">
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400">Contact / HQ</h2>
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-tight">Studio Archive 04</p>
                <p className="text-sm opacity-60">Industrial Product Design Office</p>
                <p className="text-sm opacity-60">ema.uleckaite@gmail.com</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-end items-end">
              <div className="w-full h-px bg-black opacity-10 mb-8" />
              <p className="text-[60px] md:text-[100px] font-display font-black uppercase leading-none opacity-[0.03] select-none text-right">
                INDUSTRIAL<br />STANDARDS
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const Header = ({ 
  data, 
  user, 
  onToggleAdmin, 
  isAdmin, 
  activeView, 
  onChangeView,
  showAdminInterface
}: { 
  data: PortfolioData, 
  user: User | null, 
  onToggleAdmin: () => void,
  isAdmin: boolean,
  activeView: ViewState,
  onChangeView: (view: ViewState) => void,
  showAdminInterface: boolean
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 p-6 md:p-10 flex justify-between items-start pointer-events-none">
      <div className="flex gap-8 pointer-events-auto items-center">
        <button 
          onClick={() => onChangeView('work')}
          className="flex gap-4 items-center text-left group"
        >
          <Logo className="w-8 h-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold tracking-tighter uppercase group-hover:opacity-60 transition-opacity">{data.ownerName}</span>
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-mono italic">Studio V.04</span>
          </div>
        </button>
      </div>

      <div className="flex gap-8 pointer-events-auto items-end flex-col md:flex-row">
        <nav className="flex gap-8 text-black">
          <button 
            onClick={() => onChangeView('work')}
            className={`text-sm font-bold uppercase tracking-tight transition-all pb-1 border-b-2 ${activeView === 'work' ? 'border-black opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            Work
          </button>
          <button 
            onClick={() => onChangeView('about')}
            className={`text-sm font-bold uppercase tracking-tight transition-all pb-1 border-b-2 ${activeView === 'about' ? 'border-black opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            About
          </button>
        </nav>
        
        {showAdminInterface && (
          <div className="flex items-center gap-4">
            {user && (
               <span className="text-[9px] uppercase font-mono bg-black/5 px-2 py-1 hidden md:block">Connected: {user.email}</span>
            )}
            <button 
              onClick={onToggleAdmin}
              className={`px-3 py-1 text-[10px] uppercase tracking-widest border transition-all ${isAdmin ? 'bg-black text-white border-black' : 'border-black/20 hover:border-black text-black'}`}
            >
              {isAdmin ? 'Exit Admin' : 'Admin'}
            </button>
            {user && (
              <button onClick={() => logout()} className="text-black/30 hover:text-black transition-colors" title="Logout">
                 <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const ThreeDCarousel = ({ items, onSelectItem }: { items: PortfolioItem[], onSelectItem: (item: PortfolioItem) => void }) => {
  const dragContainer = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: -10, y: 0, autoY: 0 });
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isHoveredRef = useRef(false);
  const itemsRef = useRef(items);
  const [radius, setRadius] = useState(480);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const focusedIndexRef = useRef(0);

  // Sync ref for animation loop to avoid stale closures
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Pre-calculate random sizes for items
  const itemSizes = useMemo(() => items.map(item => getRandomSize(item.id)), [items]);

  // Inertia and Drag Logic + Unified Animation Loop
  useEffect(() => {
    let tX = rotationRef.current.y;
    let tY = -rotationRef.current.x; 
    let desX = 0;
    let desY = 0;
    let timer: any = null;
    let isDragging = false;
    let requestId: number;

    const applyTransform = (target: HTMLDivElement) => {
      if (tY > 180) tY = 180;
      if (tY < 0) tY = 0;
      const rotY = tX + rotationRef.current.autoY;
      target.style.transform = `rotateX(${-tY}deg) rotateY(${rotY}deg)`;

      // Update active dot
      if (itemsRef.current.length > 0) {
        const step = 360 / itemsRef.current.length;
        const index = ((Math.round(-rotY / step) % itemsRef.current.length) + itemsRef.current.length) % itemsRef.current.length;
        if (index !== focusedIndexRef.current) {
          focusedIndexRef.current = index;
          setFocusedIndex(index);
        }
      }
    };

    const animate = () => {
      if (!isDragging && !isHoveredRef.current && itemsRef.current.length > 0) {
        // Speed up near corners
        const margin = 150;
        const isNearEdge = 
          mouseRef.current.x < margin || 
          mouseRef.current.x > window.innerWidth - margin ||
          mouseRef.current.y < margin ||
          mouseRef.current.y > window.innerHeight - margin;
        
        const speedMultiplier = isNearEdge ? 4.0 : 1.0;
        rotationRef.current.autoY += 0.05 * speedMultiplier; 
        
        if (dragContainer.current) applyTransform(dragContainer.current);
      }
      requestId = requestAnimationFrame(animate);
    };

    const handlePointerDown = (e: PointerEvent) => {
      SoundManager.init();
      SoundManager.playClick();
      isDragging = true;
      if (timer) clearInterval(timer);
      
      let sX = e.clientX;
      let sY = e.clientY;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nX = moveEvent.clientX;
        const nY = moveEvent.clientY;
        
        desX = nX - sX;
        desY = nY - sY;
        
        if (Math.abs(desX) > 10) SoundManager.playSwoosh();
        
        tX += desX * 0.15;
        tY += desY * 0.15;
        
        if (dragContainer.current) applyTransform(dragContainer.current);
        
        sX = nX;
        sY = nY;
      };

      const handlePointerUp = () => {
        isDragging = false;
        timer = setInterval(() => {
          desX *= 0.95;
          desY *= 0.95;
          tX += desX * 0.1;
          tY += desY * 0.1;
          
          if (dragContainer.current) applyTransform(dragContainer.current);
          
          if (Math.abs(desX) < 0.1 && Math.abs(desY) < 0.1) {
            clearInterval(timer);
          }
        }, 16);
        
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    };

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      tX += delta * 0.05;
      if (dragContainer.current) applyTransform(dragContainer.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const container = dragContainer.current;
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('wheel', handleWheel);
      window.addEventListener('mousemove', handleMouseMove);
    }

    animate();

    return () => {
      if (container) container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      if (timer) clearInterval(timer);
      cancelAnimationFrame(requestId);
    };
  }, []);

  // Update radius on resize and based on item count to maintain visual gaps (20px to 200px)
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const n = items.length;
      if (n === 0) return;

      // We calculate radius based on desired gap range
      // Gap = (2 * PI * R / N) - CardWidth
      // We want avg gap to be around 100px, but strictly bound by [20, 200]
      
      const avgCardWidth = 170; // Approximation based on getRandomSize
      const targetGap = 100;
      
      const idealR = (n * (avgCardWidth + targetGap)) / (2 * Math.PI);
      
      // Strict lower bound: No gap smaller than 20px even for the widest card (240px)
      const minRForGap = (n * (240 + 20)) / (2 * Math.PI);
      
      // Strict upper bound: No gap larger than 200px even for the narrowest card (120px)
      const maxRForGap = (n * (120 + 200)) / (2 * Math.PI);
      
      let finalRadius = Math.max(minRForGap, Math.min(maxRForGap, idealR));
      
      // Safety: Don't let it be too small for the viewport
      const minViewportRadius = Math.min(width, height) * 0.42;
      finalRadius = Math.max(finalRadius, minViewportRadius, 250);
      
      setRadius(finalRadius);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [items.length]);

  // Interface Hints with dynamic dots
  const Pagination = () => {
    const n = items.length;
    if (n === 0) return null;

    // Calculate size/gap based on constraints: max size 20, min gap 5
    // We target a reasonable total width for the indicator bar
    const targetTotalWidth = 180; // slightly smaller
    const availablePerItem = targetTotalWidth / n;
    
    // We specify the gap to be at least 5px, so size = available - gap
    const dotGap = Math.max(5, availablePerItem * 0.3);
    const dotSize = Math.min(12, Math.max(4, availablePerItem - dotGap)); // smaller dots

    return (
      <div className="fixed sm:bottom-10 bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none text-black transition-all duration-500">
         <div className="flex items-center justify-center transition-all duration-500" style={{ gap: `${dotGap}px` }}>
           {items.map((_, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0 }}
               animate={{ 
                 opacity: i === focusedIndex ? 1 : 0.3, 
                 scale: i === focusedIndex ? 1.2 : 1,
                 backgroundColor: i === focusedIndex ? '#f97316' : '#fdba744d' // Orange shades
               }}
               transition={{ type: 'spring', damping: 20, stiffness: 300 }}
               className="backdrop-blur-md border border-white/20 shadow-sm"
               style={{ 
                 width: `${dotSize}px`, 
                 height: `${dotSize}px`,
                 borderRadius: '50%'
               }}
             />
           ))}
         </div>
         <span className="text-[9px] uppercase tracking-[0.4em] font-mono opacity-20">Orbit Archive</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-white cursor-grab active:cursor-grabbing flex items-center justify-center">
      {items.length === 0 ? (
        <div className="text-center space-y-4">
           <p className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-30">Archive Empty</p>
           {!isHoveredRef.current && (
             <div className="w-12 h-[1px] bg-black/10 mx-auto" />
           )}
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: `${radius * 2.5}px` }}>
          <div 
            ref={dragContainer}
            onMouseEnter={() => { isHoveredRef.current = true; }}
            onMouseLeave={() => { isHoveredRef.current = false; }}
            style={{ 
              transformStyle: 'preserve-3d',
              transform: `rotateX(-10deg) rotateY(0deg)`,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s linear',
              pointerEvents: 'auto'
            }}
          >
            <div 
              className="relative pointer-events-none flex items-center justify-center"
              style={{ 
                width: '1px', 
                height: '1px', 
                transformStyle: 'preserve-3d',
              }}
            >
              {items.map((item, i) => {
                const { width, height } = itemSizes[i];
                return (
                  <div
                    key={item.id}
                    className="absolute pointer-events-auto cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                    style={{
                      width: `${width}px`,
                      height: `${height}px`,
                      transform: `rotateY(${i * (360 / items.length)}deg) translateZ(${radius}px)`,
                      transformStyle: 'preserve-3d',
                      left: `-${width / 2}px`,
                      top: `-${height / 2}px`,
                    }}
                  >
                    <div className={`w-full h-full shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 flex flex-col relative ${item.stlUrl ? '' : 'bg-zinc-50 border border-black/5'}`}>
                      {item.stlUrl ? (
                        <StlViewer url={item.stlUrl} isThumbnail />
                      ) : (
                        item.images && item.images.length > 1 ? (
                          <LoopingGallery images={item.images} interval={12000} />
                        ) : (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                        <div className="space-y-0.5">
                          <p className="text-white/60 text-[8px] uppercase tracking-widest font-mono">{item.category}</p>
                          <h3 className="text-white font-display font-medium uppercase text-[11px] tracking-widest">{item.title}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .perspective-center {
          perspective-origin: center center;
        }
      `}} />

      <Pagination />
    </div>
  );
};

const ProjectCard = ({ item, onClose, isAdmin }: { item: PortfolioItem, onClose: () => void, isAdmin?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(item.label || "Case Study 2026");

  const updateLabel = async () => {
    try {
      await updateDoc(doc(db, 'projects', item.id), { label: tempLabel });
      setIsEditingLabel(false);
      SoundManager.playClick();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 bg-white/5 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 80, opacity: 0, rotateX: 20 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        exit={{ y: 80, opacity: 0, rotateX: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[1100px] min-h-[600px] bg-white/40 backdrop-blur-3xl border border-white/50 shadow-[0_40px_100px_rgba(0,0,0,0.12)] flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div 
          className="w-full lg:w-[50%] h-[400px] lg:h-auto p-6 md:p-8 cursor-pointer relative group/photo"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <motion.div 
            className="w-full h-full relative z-10"
            animate={{ 
              y: isHovered ? (window.innerHeight * 0.25) : 0, // Deep swipe down towards screen center
              scale: isHovered ? 1.4 : 1, // Large scale for "whole view"
              zIndex: isHovered ? 50 : 10
            }}
            transition={{ 
              type: 'spring', 
              damping: 30, // "Casual" - more damped, less bouncy
              stiffness: 60, // Slower, relaxed motion
              mass: 2
            }}
          >
            {item.stlUrl ? (
              <StlViewer url={item.stlUrl} />
            ) : (
              item.images && item.images.length > 1 ? (
                <div className="w-full h-full shadow-2xl">
                  <LoopingGallery images={item.images} interval={15000} />
                </div>
              ) : (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className={`w-full h-full shadow-2xl transition-all duration-700 ${isHovered ? 'object-contain' : 'object-cover'}`}
                  referrerPolicy="no-referrer"
                />
              )
            )}
          </motion.div>
        </motion.div>
        
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   {isAdmin ? (
                     <div className="flex items-center gap-2 group/label">
                       <input 
                         type="text"
                         value={tempLabel}
                         onChange={(e) => setTempLabel(e.target.value)}
                         onBlur={updateLabel}
                         onKeyDown={(e) => e.key === 'Enter' && updateLabel()}
                         className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-black border-b border-black/10 focus:border-orange-500 outline-none bg-transparent"
                       />
                       <Edit2 size={10} className="text-orange-500 opacity-0 group-hover/label:opacity-100 transition-opacity" />
                     </div>
                   ) : (
                     <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-black/30">{item.label || "Case Study 2026"}</p>
                   )}
                   {item.stlUrl && <span className="bg-black text-white text-[8px] px-2 py-0.5 uppercase tracking-widest font-mono">3D Content</span>}
                </div>
                <h2 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-[0.85] text-black">{item.title}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-black/5 transition-colors flex-shrink-0"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex flex-wrap gap-8 mb-12 text-[10px] uppercase font-bold tracking-widest text-black/50">
              <div className="flex flex-col gap-1">
                <span className="opacity-40">Development</span>
                <span className="flex items-center gap-2 text-black"><Calendar size={12} /> {item.year}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="opacity-40">Discipline</span>
                <span className="flex items-center gap-2 text-black"><MapPin size={12} /> {item.category}</span>
              </div>
            </div>

            <div className="space-y-8 text-black/60 leading-relaxed text-sm max-w-[500px]">
              <p>{item.description || "The conceptualization of modern industrial objects requires a delicate balance between utility and aesthetic purity. This project explores the intersection of raw materiality and high-performance engineering."}</p>
              {item.stlUrl && <p className="opacity-40 text-xs italic">Use your mouse to orbit and scroll to zoom in the 3D viewer above.</p>}
              <div className="w-20 h-[1px] bg-black/10" />
            </div>
          </div>

          <div className="pt-12 flex gap-4">
             {/* <button className="h-16 flex-1 bg-black text-white font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
               Download Technical Specs <ExternalLink size={16} />
             </button> */}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DropZone = ({ onFileSelected, label, accept }: { onFileSelected: (file: File) => void, label: string, accept: string }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative h-24 border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-black bg-zinc-50 scale-[0.98]' : 'border-zinc-200 hover:border-black/20'}`}
    >
      <input 
        ref={inputRef}
        type="file" 
        accept={accept}
        className="hidden" 
        onChange={(e) => e.target.files && onFileSelected(e.target.files[0])}
      />
      <Plus size={16} className={`mb-1 opacity-20 ${isDragActive ? 'scale-125 opacity-100' : ''} transition-all`} />
      <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{label}</span>
      <span className="text-[8px] opacity-20 mt-1 uppercase">or tap to browse</span>
    </div>
  );
};

const AdminPanel = ({ data, onClose }: { data: PortfolioData, onClose: () => void }) => {
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const addItem = async () => {
    const id = Date.now().toString();
    const newItem: Partial<PortfolioItem> & { createdAt: any } = {
      id,
      title: "New Concept",
      category: "Industrial",
      imageUrl: "https://picsum.photos/seed/" + id + "/800/1200",
      images: ["https://picsum.photos/seed/" + id + "/800/1200"],
      year: new Date().getFullYear().toString(),
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'projects', id), newItem);
    setEditingItem(newItem as PortfolioItem);
  };

  const removeItem = (id: string) => {
    console.log("Requesting delete for project:", id);
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    console.log("Confirming delete for project:", id);
    try {
      const projectRef = doc(db, 'projects', id);
      await deleteDoc(projectRef);
      console.log("Deletion successful");
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Delete failed error details:", err);
      alert(`Delete failed: ${err.message || 'Unknown error'}. Check console for details.`);
    }
  };

  const updateItem = async (updated: PortfolioItem) => {
    const { id, ...rest } = updated;
    try {
      await updateDoc(doc(db, 'projects', id), rest);
    } catch (err: any) {
      console.error("Update failed:", err);
      alert(`Update failed: ${err.message}`);
    }
  };

  const updateSettings = async (name: string) => {
    await updateDoc(doc(db, 'settings', 'portfolio'), { ownerName: name });
  };

  const seedData = async () => {
    const samples = [
      { title: "Aeris Chair", category: "Furniture", imageUrl: "https://picsum.photos/seed/chair/800/1200" },
      { title: "Krypton Watch", category: "Wearable", imageUrl: "https://picsum.photos/seed/watch/800/1200" },
      { title: "Vortex Drone", category: "Robotics", imageUrl: "https://picsum.photos/seed/drone/800/1200" },
      { title: "Prism Speaker", category: "Audio", imageUrl: "https://picsum.photos/seed/speaker/800/1200" }
    ];
    for (const p of samples) {
      const id = "seed-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'projects', id), {
        ...p,
        id,
        images: [p.imageUrl],
        year: "2026",
        description: "An exploration into high-performance industrial semantics and material science.",
        createdAt: serverTimestamp()
      });
    }
    alert("4 Projects seeded!");
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File, type: 'image' | 'stl') => {
    if (!editingItem) return;
    
    setIsUploading(true);
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileRef = sRef(storage, `portfolio/${editingItem.id}/${type}_${uniqueSuffix}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);

      if (type === 'image') {
        const currentImages = editingItem.images || [];
        const updatedImages = [...currentImages, url];
        const updated = { 
          ...editingItem, 
          imageUrl: currentImages.length === 0 ? url : editingItem.imageUrl,
          images: updatedImages 
        };
        await updateItem(updated);
        setEditingItem(updated);
      } else {
        const updated = { ...editingItem, stlUrl: url };
        await updateItem(updated);
        setEditingItem(updated);
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      const msg = err?.message || "Unknown error";
      if (msg.includes("insufficient permissions")) {
        alert("UPLOAD PERMISSION ERROR:\n\nFirebase Storage rules are likely denying access. Since I can't auto-deploy Storage rules, please go to the Firebase Console -> Storage -> Rules and paste the rules I've prepared for you in the chat.");
      } else {
        alert(`Upload failed: ${msg}\n\nCheck if Firebase Storage is enabled in your console.`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white z-[150] shadow-2xl flex flex-col border-l border-black/10"
    >
      <div className="p-8 border-b border-black/5 flex justify-between items-center bg-zinc-50/50">
        <h2 className="text-2xl font-display font-bold uppercase tracking-tighter">Inventory Control</h2>
        <button onClick={onClose} className="p-2 hover:bg-black/5 transition-colors text-black">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 hide-scrollbar text-black">
        <section>
          <h3 className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-4 font-bold">Metadata</h3>
          <div className="space-y-4">
            <input 
              className="w-full border-b border-black text-xl font-display font-bold uppercase tracking-tighter p-2 outline-none focus:border-blue-500"
              value={data.ownerName}
              onChange={(e) => updateSettings(e.target.value)}
              placeholder="NAME"
            />
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Projects</h3>
            <div className="flex gap-2">
              <button 
                onClick={seedData}
                className="text-[10px] uppercase font-bold tracking-widest border border-black/10 px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
              >
                Seed 4
              </button>
              <button 
                onClick={addItem}
                className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black text-white px-3 py-1.5 hover:bg-zinc-800 transition-colors"
              >
                <Plus size={14} /> New Project
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {data.items.map(item => (
              <div key={item.id} className="group relative flex items-center gap-4 p-3 border border-black/5 hover:border-black/20 transition-all bg-zinc-50/50">
                <div className="w-12 h-12 flex-shrink-0 bg-zinc-200 overflow-hidden">
                  <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[10px] uppercase truncate tracking-tight">{item.title}</p>
                  <p className="text-[9px] opacity-40 uppercase font-mono">{item.category}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                  {deleteConfirmId === item.id ? (
                    <div className="flex gap-2">
                       <button 
                         onClick={() => confirmDelete(item.id)} 
                         className="px-2 py-1 bg-red-500 text-white text-[8px] uppercase font-bold tracking-widest hover:bg-red-600 transition-colors"
                       >
                         Confirm
                       </button>
                       <button 
                         onClick={() => setDeleteConfirmId(null)} 
                         className="px-2 py-1 bg-black text-white text-[8px] uppercase font-bold tracking-widest hover:opacity-60 transition-opacity"
                       >
                         Cancel
                       </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setEditingItem(item)} className="p-1.5 hover:bg-black hover:text-white transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-white z-[160] p-8 flex flex-col text-black font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-black uppercase tracking-tighter">Edit Project</h3>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-black/5"><X size={24} /></button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-4 hide-scrollbar pb-10">
              <div className="aspect-video w-full bg-zinc-100 relative group cursor-pointer overflow-hidden border border-black/5 mb-4">
                {editingItem.images && editingItem.images.length > 1 ? (
                  <LoopingGallery images={editingItem.images} />
                ) : (
                  <img src={editingItem.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>

              {editingItem.images && editingItem.images.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Gallery Photos ({editingItem.images.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {editingItem.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 border border-black/5 group">
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = editingItem.images?.filter((_, idx) => idx !== i) || [];
                            updateItem({ 
                              ...editingItem, 
                              images: newImages,
                              imageUrl: i === 0 && newImages.length > 0 ? newImages[0] : editingItem.imageUrl
                            }).then(() => setEditingItem(prev => prev ? {...prev, images: newImages} : null));
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {isUploading ? (
                  <div className="col-span-2 h-24 flex items-center justify-center border-2 border-dashed border-zinc-100">
                     <span className="text-[10px] font-mono animate-pulse uppercase tracking-widest">Uploading Media...</span>
                  </div>
                ) : (
                  <>
                    <DropZone 
                      label="Drop Image" 
                      accept="image/*" 
                      onFileSelected={(f) => handleFileUpload(f, 'image')} />
                    <DropZone 
                      label="Drop Model" 
                      accept=".stl,.glb,.gltf,.fbx" 
                      onFileSelected={(f) => handleFileUpload(f, 'stl')} />
                  </>
                )}
              </div>

              <div className="space-y-5 mt-8">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Project Name</label>
                  <input 
                    className="w-full border-b border-black p-2 outline-none focus:border-blue-500 font-bold uppercase transition-all"
                    value={editingItem.title}
                    onChange={(e) => updateItem({ ...editingItem, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Discipline</label>
                    <input 
                      className="w-full border-b border-zinc-200 p-2 outline-none focus:border-black text-sm uppercase"
                      value={editingItem.category}
                      onChange={(e) => updateItem({ ...editingItem, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Year</label>
                    <input 
                      className="w-full border-b border-zinc-200 p-2 outline-none focus:border-black text-sm"
                      value={editingItem.year || ''}
                      onChange={(e) => updateItem({ ...editingItem, year: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Mission Description</label>
                  <textarea 
                    className="w-full border border-zinc-100 p-4 outline-none focus:border-black text-sm min-h-[140px] resize-none bg-zinc-50/30"
                    value={editingItem.description || ''}
                    onChange={(e) => updateItem({ ...editingItem, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Source URLs (Advanced)</label>
                  <div className="space-y-2">
                    <input 
                      className="w-full border border-zinc-100 p-2 outline-none focus:border-black text-[9px] font-mono"
                      placeholder="Image URL"
                      value={editingItem.imageUrl}
                      onChange={(e) => updateItem({ ...editingItem, imageUrl: e.target.value })}
                    />
                    <input 
                      className="w-full border border-zinc-100 p-2 outline-none focus:border-black text-[9px] font-mono"
                      placeholder="Model URL (stl, glb, fbx)"
                      value={editingItem.stlUrl || ''}
                      onChange={(e) => updateItem({ ...editingItem, stlUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setEditingItem(null)}
              className="mt-4 h-16 w-full bg-black text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
            >
              Verify Changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function App() {
  const { data, loading } = usePortfolioData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('work');
  const [showAdminInterface, setShowAdminInterface] = useState(false);

  // URL listener for /admin
  useEffect(() => {
    const checkAdminUrl = () => {
      setShowAdminInterface(window.location.pathname.endsWith('/admin'));
    };
    checkAdminUrl();
    window.addEventListener('popstate', checkAdminUrl);
    return () => window.removeEventListener('popstate', checkAdminUrl);
  }, []);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsAdmin(false);
    });
  }, []);

  const handleToggleAdmin = async () => {
    if (!user) {
      try {
        const u = await signInWithGoogle();
        if (u && u.user) {
          if (u.user.email === 'ema.uleckaite@gmail.com') setIsAdmin(true);
          else alert("Access Denied: Admin privileges required.");
        }
      } catch (err) {
        console.error("Sign in failed", err);
      }
    } else {
      setIsAdmin(!isAdmin);
    }
  };

  // Layout states for blocking scroll
  useEffect(() => {
    if (isAdmin || selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isAdmin, selectedItem]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-10 left-10"
        >
          <Logo className="w-12 h-24 opacity-20" />
        </motion.div>

        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Logo className="w-24 h-48" />
          </motion.div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">Initializing Data Stream</span>
            <div className="w-16 h-[1px] bg-black/5 overflow-hidden">
              <motion.div 
                animate={{ x: [-64, 64] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-full bg-black/20" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white">
      <Header 
        data={data} 
        isAdmin={isAdmin} 
        user={user}
        onToggleAdmin={handleToggleAdmin} 
        activeView={activeView}
        onChangeView={setActiveView}
        showAdminInterface={showAdminInterface}
      />
      
      <main className="w-full h-screen">
        <AnimatePresence mode="wait">
          {activeView === 'work' ? (
            <motion.div
              key="work"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <ThreeDCarousel items={data.items} onSelectItem={setSelectedItem} />
            </motion.div>
          ) : (
            <AboutPage key="about" />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedItem && (
          <ProjectCard 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
      
      <CustomCursor />

      <AnimatePresence>
        {isAdmin && user && showAdminInterface && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdmin(false)}
              className="fixed inset-0 bg-black/40 z-[140] backdrop-blur-sm"
            />
            <AdminPanel 
              data={data} 
              onClose={() => setIsAdmin(false)} 
            />
          </>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-6 right-10 z-40 pointer-events-none">
        <div className="flex gap-10 items-end flex-col">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-30 text-black font-bold">
            © 2026 {data.ownerName} STUDIO
          </span>
          <div className="flex gap-4 opacity-10">
            <div className="w-1 h-1 bg-black rounded-full" />
            <div className="w-1 h-1 bg-black rounded-full" />
            <div className="w-1 h-1 bg-black rounded-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
