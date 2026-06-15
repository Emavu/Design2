import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Plus, Trash2, Edit2, X, Image as ImageIcon, ExternalLink, Calendar, MapPin, LogOut } from 'lucide-react';
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

// types.ts extension for global flags if needed, but we'll use a type cast
declare global {
  interface Window {
    swooshPlaying: boolean;
  }
}
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

// --- Custom Hook for Firebase Data ---
function usePortfolioData() {
  const [data, setData] = useState<PortfolioData>(DEFAULT_PORTFOLIO_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sync Settings
    const settingsDoc = doc(db, 'settings', 'portfolio');
    const unsubSettings = onSnapshot(settingsDoc, (snap) => {
      if (snap.exists()) {
        const s = snap.data();
        setData(prev => ({ 
          ...prev, 
          ownerName: s.ownerName,
          workExperience: s.workExperience,
          education: s.education,
          modeling: s.modeling,
          softSkill: s.softSkill,
          visualization: s.visualization,
          prototyping: s.prototyping
        }));
      } else {
        // Initialize settings if empty
        setDoc(settingsDoc, { 
          ownerName: DEFAULT_PORTFOLIO_DATA.ownerName,
          workExperience: DEFAULT_PORTFOLIO_DATA.workExperience,
          education: DEFAULT_PORTFOLIO_DATA.education,
          modeling: DEFAULT_PORTFOLIO_DATA.modeling,
          softSkill: DEFAULT_PORTFOLIO_DATA.softSkill,
          visualization: DEFAULT_PORTFOLIO_DATA.visualization,
          prototyping: DEFAULT_PORTFOLIO_DATA.prototyping
        });
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

const splitSkills = (skills: string | undefined, fallback: string) => {
  const value = (skills || fallback || '').trim();
  return value.split(/\s*[\/\,]\s*/).filter(Boolean);
};

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
        ['BUTTON', 'A', 'INPUT', 'TEXTAREA'].includes(target.tagName) ||
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

const LoopingGallery = ({ images, interval = 16000, isAdmin, onImagesChange, isHovered, trigger, alwaysCover = false, disableInteraction = false }: { images: string[], interval?: number, isAdmin?: boolean, onImagesChange?: (newImages: string[]) => void, isHovered?: boolean, trigger?: number, alwaysCover?: boolean, disableInteraction?: boolean }) => {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isManual, setIsManual] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerRef = useRef<number | null>(null);
  const indexRef = useRef(index);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const next = () => {
    setPrevIndex(indexRef.current);
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setPrevIndex(indexRef.current);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (images.length <= 1 || isManual || trigger !== undefined) return;
    timerRef.current = setInterval(next, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images, interval, isManual, trigger]);

  useEffect(() => {
    if (trigger === undefined) return;
    if (lastTriggerRef.current === null) {
      lastTriggerRef.current = trigger;
      return;
    }
    if (trigger !== lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      if (images.length <= 1) return;
      setPrevIndex(indexRef.current);
      setIndex((prev) => (prev + 1) % images.length);
    }
  }, [trigger, images.length]);


  const removeImage = (i: number) => {
    if (!onImagesChange) return;
    const newImages = images.filter((_, idx) => idx !== i);
    onImagesChange(newImages);
    if (index >= newImages.length) setIndex(0);
    setPrevIndex(null);
    SoundManager.playClick();
  };

  if (!images || images.length === 0) return (
    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
       <span className="text-[10px] font-mono opacity-20 uppercase tracking-widest">No Media</span>
    </div>
  );

  const n = images.length;
  const targetW = 40;
  const avail = targetW / n;
  const gap = Math.max(2, avail * 0.3); 
  const size = Math.min(4, Math.max(2, avail - gap));

  return (
    <div className={`w-full h-full relative overflow-hidden bg-zinc-950 touch-none group/gallery ${disableInteraction ? 'pointer-events-none' : ''}`}>
      <div className="absolute inset-0">
        {prevIndex !== null && (
          <img
            src={images[prevIndex]}
            className={`absolute inset-0 w-full h-full ${alwaysCover ? 'object-cover' : (isHovered ? 'object-contain' : 'object-cover')}`}
            style={{ zIndex: 0, opacity: 1, backgroundColor: 'transparent' }}
            referrerPolicy="no-referrer"
          />
        )}

        <motion.img
          key={`current-${index}`}
          src={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => setPrevIndex(null)}
          onClick={!disableInteraction ? (e) => {
            e.stopPropagation();
            setIsManual(true);
            next();
            SoundManager.playClick();
          } : undefined}
          className={`absolute inset-0 w-full h-full ${!disableInteraction ? 'cursor-pointer' : ''} ${alwaysCover ? 'object-cover' : (isHovered ? 'object-contain' : 'object-cover')}`}
          style={{ zIndex: 1, willChange: 'opacity, transform', backgroundColor: 'transparent' }}
          referrerPolicy="no-referrer"
        />
      </div>
      
      {isAdmin && (
        <button 
          onClick={() => removeImage(index)}
          className="absolute top-4 right-4 z-30 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity active:scale-90"
        >
          <Trash2 size={12} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 flex z-20 pointer-events-none" style={{ gap: `${gap}px` }}>
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`rounded-full transition-all duration-300 ${i === index ? 'bg-black scale-125' : 'bg-black/10'} backdrop-blur-sm border border-white/10`} 
              style={{ width: `${size}px`, height: `${size}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CVPage = ({ data }: { data: PortfolioData }) => {
  const sectionItems = useMemo(() => [
    { id: 'spec-objective', label: 'About' },
    { id: 'work-experience', label: 'Work' },
    { id: 'education', label: 'Studies' },
    { id: 'technical-stack', label: 'Tech' },
    { id: 'contact-hq', label: 'Contact' },
  ], []);

  const [activeBulletIndex, setActiveBulletIndex] = useState(0);
  const [lineMetrics, setLineMetrics] = useState({ top: 0, maxHeight: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const { scrollYProgress } = useScroll({ container: containerRef });
  const lineScale = useTransform(scrollYProgress, [0, 0.95], [0, 1]);
  const smoothLineScale = useSpring(lineScale, { damping: 24, stiffness: 160 });
  const activeIndexMotion = useTransform(scrollYProgress, [0, 1], [0, sectionItems.length - 1]);

  useLayoutEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      const buttons = buttonRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (!nav || buttons.length === 0) return;

      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      if (!firstButton || !lastButton) return;

      const navRect = nav.getBoundingClientRect();
      const firstRect = firstButton.getBoundingClientRect();
      const lastRect = lastButton.getBoundingClientRect();

      const firstCenter = firstRect.top - navRect.top + firstRect.height / 2;
      const lastCenter = lastRect.top - navRect.top + lastRect.height / 2;

      setLineMetrics({
        top: firstCenter,
        maxHeight: Math.max(0, lastCenter - firstCenter),
      });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sectionItems.length]);

  useEffect(() => {
    const unsubscribe = activeIndexMotion.on('change', (latest) => {
      const index = Math.min(sectionItems.length - 1, Math.max(0, Math.round(latest)));
      setActiveBulletIndex(index);
    });

    return unsubscribe;
  }, [activeIndexMotion, sectionItems.length]);

  const scrollToSection = (id: string) => {
    const container = containerRef.current;
    const el = document.getElementById(id);
    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    const offset = elementRect.top - containerRect.top - container.clientHeight * 0.2;

    container.scrollTo({
      top: container.scrollTop + offset,
      behavior: 'smooth',
    });
  };

  return (
    <motion.div 
      ref={containerRef}
      id="cv-scroll-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-10 bg-white overflow-y-auto px-6 pt-32 pb-20 md:px-20 md:pt-40"
    >
      <div className="max-w-4xl   mx-auto space-y-16 relative" style={{ marginTop: '60px' }}>
        <div className="lg:hidden  bg-white/40 fixed left-0 right-0 z-50  backdrop-blur-md" style={{ top: 'var(--header-height, 4.5rem)' }}>
          <div className="flex items-center justify-between gap-1 px-2 py-3 overflow-hidden text-[10px] uppercase tracking-[0.18em]">
            {sectionItems.map((section, index) => {
              const isActive = activeBulletIndex === index;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`min-w-0 flex-1 text-center rounded-full border px-2 py-2 text-[10px] transition-colors ${isActive ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-black hover:text-black'}`}
                  type="button"
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="hidden lg:block fixed left-6 top-1/2 z-20 -translate-y-1/2">
          <div ref={navRef} className="relative flex flex-col items-start gap-8 px-1 py-4">
            <div className="absolute left-[calc(var(--spacing)*2.6)] top-7 h-[calc(100%-3.5rem)] w-px bg-zinc-200" />
            <motion.div
              className="absolute left-[calc(var(--spacing)*2.6)] w-px bg-black"
              initial={false}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              style={{
                top: lineMetrics.top,
                height: lineMetrics.maxHeight,
                scaleY: smoothLineScale,
                transformOrigin: 'top',
              }}
            />
            {sectionItems.map((section, index) => {
              const isActive = activeBulletIndex === index;
              return (
                <button
                  ref={(el) => { buttonRefs.current[index] = el; }}
                  data-section-id={section.id}
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="relative flex h-10 items-center gap-3 text-left"
                  type="button"
                >
                  <span className={`relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${isActive ? 'border-black bg-black' : 'border-zinc-300 bg-white'}`}>
                    <span className={`block h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-zinc-300'}`} />
                  </span>
                  <span className={`text-[10px] uppercase tracking-[0.3em] transition-colors ${isActive ? 'text-black font-semibold' : 'text-zinc-500'}`}>
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section id="spec-objective" className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400">Spec / Objective</h2>
            <p className="text-2xl md:text-3xl font-display font-medium leading-tight">
              Bridging the gap between raw material intelligence and human-centric utility through intentional industrial geometry.
            </p>
          </div>
          <div className="text-zinc-500 font-mono text-[11px] leading-relaxed space-y-4 whitespace-pre-wrap">
            <p>
              Based in the intersection of digital craft and physical manufacturing, my practice focuses on high-performance product development and speculative industrial design.
            </p>
            <p>
              Every project is an exploration of technical constraints as creative opportunities—utilizing STL precision and FBX versatility to define the next generation of studio-grade hardware.
            </p>
          </div>
        </section>

        {(Array.isArray(data.workExperience) || Array.isArray(data.education)) && (
          <section id="work-experience" className="border-t border-black/5 pt-12 space-y-20">
            {Array.isArray(data.workExperience) && data.workExperience.length > 0 && (
              <div className="space-y-12">
                <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400">Work Experience</h2>
                <div className="space-y-16">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-12">
                      <div className="md:col-span-1">
                        <span className="text-[11px] uppercase tracking-widest font-bold opacity-60 italic">{exp.date}</span>
                      </div>
                      <div className="md:col-span-3 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-display font-bold uppercase tracking-tight">{exp.title}</h3>
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 italic">{exp.subtitle}</p>
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed font-mono">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {Array.isArray(data.education) && data.education.length > 0 && (
              <div id="education" className="space-y-12 border-t border-black/5 pt-12">
                <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400">Education</h2>
                <div className="space-y-16">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-12">
                      <div className="md:col-span-1">
                        <span className="text-[10px] font-mono tracking-widest opacity-40 block">{edu.date}</span>
                      </div>
                      <div className="md:col-span-3 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-display font-bold uppercase tracking-tight">{edu.title}</h3>
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 italic">{edu.subtitle}</p>
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed font-mono">{edu.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section id="technical-stack" className="border-t border-black/5 pt-12">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400 mb-8">Technical Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Modeling</span>
              {splitSkills(data.modeling, "Rhino / Grasshopper").map((skill, index) => (
                <span key={index} className="block text-sm opacity-60">{skill}</span>
              ))}
            </div>
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Soft Skill</span>
              {splitSkills(data.softSkill, "Alias / Fusion 360").map((skill, index) => (
                <span key={index} className="block text-sm opacity-60">{skill}</span>
              ))}
            </div>
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Visualization</span>
              {splitSkills(data.visualization, "KeyShot / Octane").map((skill, index) => (
                <span key={index} className="block text-sm opacity-60">{skill}</span>
              ))}
            </div>
            <div className="space-y-2">
              <span className="block text-[9px] uppercase font-bold tracking-widest">Prototyping</span>
              {splitSkills(data.prototyping, "SLA / FDM Printing").map((skill, index) => (
                <span key={index} className="block text-sm opacity-60">{skill}</span>
              ))}
            </div>
          </div>
        </section>

        <section id="contact-hq" className="border-t border-black/5 pt-12 pb-20">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-8 max-w-sm">
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400">Contact / HQ</h2>
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-tight">Studio Archive 04</p>
                <p className="text-sm opacity-60">Industrial Product Design</p>
                <p className="text-sm opacity-60">domgarm@gmail.com</p>
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
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const measureHeader = () => {
      if (!headerRef.current) return;
      const height = headerRef.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    measureHeader();
    window.addEventListener('resize', measureHeader);
    return () => window.removeEventListener('resize', measureHeader);
  }, []);

  return (
    <header ref={headerRef} className="fixed pb-0 top-0 left-0 w-full z-50 px-6 py-4 md:px-10 md:py-4 bg-white/40 backdrop-blur-md">
      <div className="flex justify-between items-center">
        <div className="flex gap-8 items-center p-2 rounded-sm">
          <button 
            onClick={() => onChangeView('work')}
            className="flex gap-4 items-center text-left group"
          >
          <Logo className="w-8 h-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-display font-bold tracking-tighter uppercase group-hover:opacity-60 transition-opacity leading-none text-black">{data.ownerName}</span>
            <span className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-mono italic text-black">Studio V.04</span>
          </div>
        </button>
      </div>

      <div className="flex gap-8 items-center flex-row">
        <nav className="flex gap-8 text-black p-2 rounded-sm items-center">
          <button 
            onClick={() => onChangeView('work')}
            className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all ${activeView === 'work' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            Archive
          </button>
          <button 
            onClick={() => onChangeView('about')}
            className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all ${activeView === 'about' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            CV
          </button>
        </nav>
        
        {showAdminInterface && (
          <div className="flex items-center gap-4 p-4 rounded-sm">
            {user && (
               <span className="text-[9px] uppercase font-mono hidden md:block opacity-40 text-black">{user.email}</span>
            )}
            <button 
              onClick={onToggleAdmin}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${isAdmin ? 'bg-black text-white border-black' : 'border-black/20 hover:border-black text-black'}`}
            >
              / {isAdmin ? 'Lock' : 'Access'}
            </button>
            {user && (
              <button onClick={() => logout()} className="text-black/30 hover:text-black transition-colors" title="Logout">
                 <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </header>
  );
};

const ThreeDCarousel = ({ items, onSelectItem }: { items: PortfolioItem[], onSelectItem: (item: PortfolioItem) => void }) => {
  const dragContainer = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: -10, y: 0, autoY: 0, autoX: 0 });
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isHoveredRef = useRef(false);
  const itemsRef = useRef(items);
  const [radius, setRadius] = useState(480);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const focusedIndexRef = useRef(0);
  const [isMobileCarousel, setIsMobileCarousel] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const sync = () => setIsMobileCarousel(window.innerWidth <= 640);
    window.addEventListener('resize', sync);
    sync();
    return () => window.removeEventListener('resize', sync);
  }, []);

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
      // Limit X-axis rotation to strictly track within +/- 15 degrees
      if (tY > 15) tY = 15;
      if (tY < -15) tY = -15;
      
      const rotY = tX + rotationRef.current.autoY;
      const currentAngle = isMobileCarousel ? rotationRef.current.autoX : rotY;
      if (isMobileCarousel) {
        target.style.transform = `rotateY(0deg) rotateX(${currentAngle}deg)`;
      } else {
        target.style.transform = `rotateX(${-tY}deg) rotateY(${rotY}deg)`;
      }

      // Update active dot and apply depth fog
      if (itemsRef.current.length > 0) {
        const step = 360 / itemsRef.current.length;
        const effectiveAngle = isMobileCarousel ? rotationRef.current.autoX : rotationRef.current.autoY;
        const activeIndex = ((Math.round(-effectiveAngle / step) % itemsRef.current.length) + itemsRef.current.length) % itemsRef.current.length;
        if (activeIndex !== focusedIndexRef.current) {
          focusedIndexRef.current = activeIndex;
          setFocusedIndex(activeIndex);
        }

        // Apply depth-based fog (opacity + blur) to each item element
        const itemElements = target.querySelectorAll('.absolute.pointer-events-auto');
        if (itemElements.length === itemsRef.current.length) {
          itemElements.forEach((el, index) => {
            const itemAngle = index * (360 / itemsRef.current.length);
            const absoluteAngle = isMobileCarousel 
              ? rotationRef.current.autoX + itemAngle 
              : rotY + itemAngle;
            
            const rad = (absoluteAngle * Math.PI) / 180;
            const zCos = Math.cos(rad); // ranges from -1 (furthest/back) to 1 (closest/front)
            
            // Map depth to scale, opacity and blur
            const normalizedDepth = (zCos + 1) / 2; // ranges from 0 (back) to 1 (front)
            
            // Opacity: 0.15 at back, 1.0 at front
            const opacity = 0.15 + 0.85 * normalizedDepth;
            
            // Blur: up to 6px at absolute back
            const blur = (1 - normalizedDepth) * 6;
            
            const htmlEl = el as HTMLElement;
            htmlEl.style.opacity = opacity.toFixed(3);
            htmlEl.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
          });
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
        if (isMobileCarousel) {
          rotationRef.current.autoX += 0.05 * speedMultiplier;
        } else {
          rotationRef.current.autoY += 0.05 * speedMultiplier;
        }
        
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
        
        const deltaX = nX - sX;
        const deltaY = nY - sY;
        
        desX = deltaX;
        desY = deltaY;
        
        // Use a cooldown or stronger threshold for sound to avoid performance hit
        if (Math.abs(desX) > 20 && !window.swooshPlaying) {
          SoundManager.playSwoosh();
          window.swooshPlaying = true;
          setTimeout(() => { window.swooshPlaying = false; }, 400);
        }
        
        if (isMobileCarousel) {
          rotationRef.current.autoX += desY * 0.1;
        } else {
          tX += desX * 0.1;
          tY += desY * 0.1;
        }
        
        if (dragContainer.current) applyTransform(dragContainer.current);
        
        sX = nX;
        sY = nY;
      };

      const handlePointerUp = () => {
        isDragging = false;
        timer = setInterval(() => {
          desX *= 0.95;
          desY *= 0.95;
          if (isMobileCarousel) {
            rotationRef.current.autoX += desY * 0.1;
          } else {
            tX += desX * 0.1;
            tY += desY * 0.1;
          }
          
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
      if (isMobileCarousel) {
        rotationRef.current.autoX += delta * 0.02;
      } else {
        tX += delta * 0.05;
      }
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
                 backgroundColor: i === focusedIndex ? '#f97316' : '#00000033' 
               }}
               transition={{ type: 'spring', damping: 20, stiffness: 300 }}
               className="shadow-sm"
               style={{ 
                 width: `${dotSize}px`, 
                 height: `${dotSize}px`,
                 borderRadius: '50%'
               }}
             />
           ))}
         </div>
         <span className="text-[9px] uppercase tracking-[0.6em] font-mono opacity-30 px-4 py-1">Orbit Archive</span>
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
              transform: isMobileCarousel ? 'rotateY(22deg) rotateX(0deg)' : 'rotateX(-10deg) rotateY(0deg)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
                      transform: isMobileCarousel ? `rotateX(${i * (360 / items.length)}deg) translateZ(${radius}px)` : `rotateY(${i * (360 / items.length)}deg) translateZ(${radius}px)`,
                      transformStyle: 'preserve-3d',
                      left: `-${width / 2}px`,
                      top: `-${height / 2}px`,
                    }}
                  >
                    <div className="w-full h-full shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 flex flex-col relative bg-zinc-50 border border-black/5">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      
                      <div className="absolute inset-0 z-20 pointer-events-none bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
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
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const baseDistanceRef = useRef(0);
  const baseScaleRef = useRef(1);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  
  // Editable states
  const [tempLabel, setTempLabel] = useState(item.label || "Case Study 2026");
  const [tempTitle, setTempTitle] = useState(item.title);
  const [tempYear, setTempYear] = useState(item.year || "");
  const [tempCategory, setTempCategory] = useState(item.category || "");
  const [tempDesc, setTempDesc] = useState(item.description || "");

  // Update local state if item changes
  useEffect(() => {
    setTempLabel(item.label || "Case Study 2026");
    setTempTitle(item.title);
    setTempYear(item.year || "");
    setTempCategory(item.category || "");
    setTempDesc(item.description || "");
  }, [item.id]);

  const updateField = async (field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'projects', item.id), { [field]: value });
      SoundManager.playClick();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const path = `projects/${item.id}/${Date.now()}_${file.name}`;
      const storageRef = sRef(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const newImages = [...(item.images || []), url];
      await updateField('images', newImages);
      if (!item.imageUrl) await updateField('imageUrl', url);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isImagePreviewOpen) {
      setImageScale(1);
      setImageOffset({ x: 0, y: 0 });
      pointersRef.current.clear();
      baseDistanceRef.current = 0;
      baseScaleRef.current = 1;
      panStartRef.current = { x: 0, y: 0 };
      lastPanRef.current = { x: 0, y: 0 };
      isPanningRef.current = false;
    }
  }, [isImagePreviewOpen, previewIndex]);

  const clampOffset = (offset: { x: number; y: number }, scale: number) => {
    const maxShift = Math.max(0, (scale - 1) * 1000);
    return {
      x: Math.max(-maxShift, Math.min(maxShift, offset.x)),
      y: Math.max(-maxShift, Math.min(maxShift, offset.y)),
    };
  };

  const handlePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 2) {
      const points = Array.from(pointersRef.current.values());
      baseDistanceRef.current = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      baseScaleRef.current = imageScale;
      isPanningRef.current = false;
    } else if (pointersRef.current.size === 1) {
      panStartRef.current = { x: event.clientX, y: event.clientY };
      lastPanRef.current = imageOffset;
      isPanningRef.current = imageScale > 1;
    }
  };

  const handlePreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 2) {
      const points = Array.from(pointersRef.current.values());
      const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const nextScale = Math.max(1, Math.min(4, baseScaleRef.current * (distance / Math.max(baseDistanceRef.current, 1))));
      setImageScale(nextScale);
      if (nextScale <= 1) {
        setImageOffset({ x: 0, y: 0 });
      } else {
        setImageOffset((current) => clampOffset(current, nextScale));
      }
    } else if (pointersRef.current.size === 1 && isPanningRef.current) {
      const currentPoint = pointersRef.current.get(event.pointerId);
      if (!currentPoint) return;
      const deltaX = currentPoint.x - panStartRef.current.x;
      const deltaY = currentPoint.y - panStartRef.current.y;
      setImageOffset(clampOffset({ x: lastPanRef.current.x + deltaX, y: lastPanRef.current.y + deltaY }, imageScale));
    }
  };

  const handlePreviewPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      isPanningRef.current = false;
    }
  };

  const handlePreviewDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (imageScale === 1) {
      setImageScale(2);
    } else {
      setImageScale(1);
      setImageOffset({ x: 0, y: 0 });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 bg-white/5 crispy-glass"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 80, opacity: 0, rotateX: 20 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        exit={{ y: 80, opacity: 0, rotateX: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[1100px] max-h-[calc(100vh-4rem)] min-h-[600px] flex flex-col lg:flex-row relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div 
          className="w-full lg:w-[50%] h-[400px] lg:h-auto p-0 md:p-8 cursor-pointer relative group/photo"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setIsImagePreviewOpen(true);
            }
          }}
        >
          <motion.div 
            className="w-full h-full relative z-10 lg:group-hover/photo:overflow-visible"
            animate={{ 
              zIndex: isHovered ? 100 : 10
            }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 60, 
              mass: 1.2
            }}
          >
            {(item.images && item.images.length > 0) || item.imageUrl ? (
                <div className="w-full h-full shadow-2xl relative">
                  <LoopingGallery 
                    images={item.images && item.images.length > 0 ? item.images : [item.imageUrl].filter(Boolean) as string[]} 
                    interval={12000} 
                    isAdmin={isAdmin}
                    onImagesChange={(newImgs) => updateField('images', newImgs)}
                    isHovered={isHovered}
                  />
                  {isAdmin && (
                    <label className="absolute bottom-4 left-4 z-40 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg cursor-pointer hover:bg-white transition-all active:scale-90 border border-black/5" onClick={(e) => e.stopPropagation()}>
                      <Plus size={16} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-[10px] font-mono animate-pulse uppercase tracking-[0.3em]">Uploading...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center relative">
                  {isAdmin && (
                    <label className="bg-white p-4 shadow-xl cursor-pointer hover:bg-zinc-50 transition-all border border-black/5 flex flex-col items-center gap-2">
                       <ImageIcon size={24} className="opacity-40" />
                       <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">Add Main Media</span>
                       <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              )
            )}
            {isImagePreviewOpen && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[130] bg-black/95 flex flex-col items-center justify-center p-4"
                  onClick={() => setIsImagePreviewOpen(false)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsImagePreviewOpen(false); }}
                    className="absolute top-4 right-4 z-40 rounded-full bg-white/90 p-2 text-black"
                  >
                    Close
                  </button>
                  <div
                    className="relative max-w-full max-h-full w-full h-full flex items-center justify-center overflow-hidden touch-none"
                    onPointerDown={handlePreviewPointerDown}
                    onPointerMove={handlePreviewPointerMove}
                    onPointerUp={handlePreviewPointerUp}
                    onPointerCancel={handlePreviewPointerUp}
                    onDoubleClick={handlePreviewDoubleClick}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={(item.images && item.images.length > 0 ? item.images[previewIndex] : item.imageUrl) || ''}
                      alt={item.title}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        transform: `scale(${imageScale}) translate(${imageOffset.x / imageScale}px, ${imageOffset.y / imageScale}px)`,
                        touchAction: 'none',
                        cursor: imageScale > 1 ? 'grab' : 'auto',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {(item.images && item.images.length > 1) && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewIndex((prev) => (prev - 1 + item.images!.length) % item.images!.length); }}
                          className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/90 p-3 text-black"
                        >
                          ‹
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewIndex((prev) => (prev + 1) % item.images!.length); }}
                          className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/90 p-3 text-black"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </motion.div>
        
        <div className="flex-1 min-h-0 p-8 md:p-16 flex flex-col justify-between overflow-y-auto hide-scrollbar relative z-[60] bg-white lg:bg-transparent backdrop-blur-lg lg:backdrop-blur-none">
          <div className="relative z-[60]">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-4 w-full relative z-[60]">
                <div className="flex items-center gap-3">
                   {isAdmin ? (
                     <div className="flex items-center gap-2 group/label w-full max-w-xs relative z-[70]">
                       <input 
                         type="text"
                         value={tempLabel}
                         onChange={(e) => {
                           e.stopPropagation();
                           setTempLabel(e.target.value);
                         }}
                         onBlur={() => updateField('label', tempLabel)}
                         className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-black border-b border-black/10 focus:border-black outline-none bg-white lg:bg-transparent w-full cursor-text pointer-events-auto relative z-[70]"
                         onPointerDown={(e) => e.stopPropagation()}
                         onClick={(e) => {
                           e.stopPropagation();
                           e.currentTarget.focus();
                         }}
                       />
                       <Edit2 size={10} className="text-black opacity-0 group-hover/label:opacity-100 transition-opacity" />
                     </div>
                   ) : (
                     <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold text-black/30">{item.label || "Case Study 2026"}</p>
                   )}
                </div>
                {isAdmin ? (
                  <div className="group/title relative z-[70]">
                    <textarea 
                      value={tempTitle}
                      onChange={(e) => {
                        e.stopPropagation();
                        setTempTitle(e.target.value);
                      }}
                      onBlur={() => updateField('title', tempTitle)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                      }}
                      className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-[0.85] text-black bg-white lg:bg-transparent border-none outline-none w-full resize-none h-auto min-h-[1.2em] cursor-text pointer-events-auto relative z-[70]"
                    />
                    <Edit2 size={24} className="absolute -left-10 top-4 text-black opacity-0 group-hover/title:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <h2 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter leading-[0.85] text-black">{item.title}</h2>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-black/5 transition-colors flex-shrink-0"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex flex-wrap gap-8 mb-12 text-[10px] uppercase font-bold tracking-widest text-black/50 relative z-[70]">
              <div className="flex flex-col gap-1 min-w-[100px]">
                <span className="opacity-40">Development</span>
                {isAdmin ? (
                  <input 
                    type="text"
                    value={tempYear}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTempYear(e.target.value);
                    }}
                    onBlur={() => updateField('year', tempYear)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.focus();
                    }}
                    className="bg-white lg:bg-transparent border-none outline-none text-black hover:text-black transition-colors cursor-text pointer-events-auto relative z-[70]"
                  />
                ) : (
                  <span className="flex items-center gap-2 text-black"><Calendar size={12} /> {item.year || "2026"}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-[100px]">
                <span className="opacity-40">Discipline</span>
                {isAdmin ? (
                  <input 
                    type="text"
                    value={tempCategory}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTempCategory(e.target.value);
                    }}
                    onBlur={() => updateField('category', tempCategory)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.focus();
                    }}
                    className="bg-white lg:bg-transparent border-none outline-none text-black hover:text-black transition-colors cursor-text pointer-events-auto relative z-[70]"
                  />
                ) : (
                  <span className="flex items-center gap-2 text-black"><MapPin size={12} /> {item.category}</span>
                )}
              </div>
            </div>

            <div className="space-y-8 text-black/60 leading-relaxed text-sm max-w-[500px] relative z-[70]">
              {isAdmin ? (
                <div className="group/desc relative z-[70]">
                  <textarea 
                    value={tempDesc}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTempDesc(e.target.value);
                    }}
                    onBlur={() => updateField('description', tempDesc)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.focus();
                    }}
                    className="bg-white lg:bg-transparent border-none outline-none w-full min-h-[150px] resize-none text-black/60 leading-relaxed cursor-text pointer-events-auto relative z-[70]"
                  />
                  <Edit2 size={14} className="absolute -left-6 top-1 text-black opacity-0 group-hover/desc:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ) : (
                <p>{item.description || "The conceptualization of modern industrial objects requires a delicate balance between utility and aesthetic purity. This project explores the intersection of raw materiality and high-performance engineering."}</p>
              )}
              
              <div className="w-20 h-[1px] bg-black/10" />
            </div>
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
  const [tempName, setTempName] = useState(data.ownerName);

  // Sync tempName if data changes externally
  useEffect(() => {
    setTempName(data.ownerName);
  }, [data.ownerName]);

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
    // Update local state immediately for responsiveness
    setEditingItem(updated);
    
    const { id, ...rest } = updated;
    try {
      await updateDoc(doc(db, 'projects', id), rest);
    } catch (err: any) {
      console.error("Update failed:", err);
      // We don't alert on every keystroke to avoid interrupting the user, 
      // but maybe show a subtle indicator if it fails consistently
    }
  };

  const updateSettings = async (field: string, value: any) => {
    await updateDoc(doc(db, 'settings', 'portfolio'), { [field]: value });
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

  const handleFileUpload = async (file: File) => {
    if (!editingItem) return;
    
    setIsUploading(true);
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileRef = sRef(storage, `portfolio/${editingItem.id}/image_${uniqueSuffix}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const currentImages = editingItem.images || [];
      const updatedImages = [...currentImages, url];
      const updated = { 
        ...editingItem, 
        imageUrl: currentImages.length === 0 ? url : editingItem.imageUrl,
        images: updatedImages 
      };
      await updateItem(updated);
      setEditingItem(updated);
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
      className="fixed inset-y-0 right-0 w-full md:w-[480px] z-[150] shadow-2xl flex flex-col border-l border-white/20 bg-zinc-50"
    >
      <div className="p-8 border-b border-black/5 flex justify-between items-center bg-zinc-50">
        <h2 className="text-2xl font-display font-bold uppercase tracking-tighter">Inventory Control</h2>
        <button onClick={onClose} className="p-2 hover:bg-black/5 transition-colors text-black">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 hide-scrollbar text-black">
        <section>
          <h3 className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-4 font-bold">Metadata / CV</h3>
          <div className="space-y-4">
            <input 
              className="w-full border-b border-black text-xl font-display font-bold uppercase tracking-tighter p-2 outline-none focus:border-black relative z-[151] pointer-events-auto"
              value={tempName}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                setTempName(e.target.value);
                updateSettings('ownerName', e.target.value);
              }}
              placeholder="NAME"
            />
            
            <div className="space-y-8 pt-4 border-t border-black/5">
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <label className="text-[9px] uppercase font-bold tracking-widest opacity-40">Work Experience</label>
                   <button 
                    onClick={() => {
                      const newExp = { id: Date.now().toString(), title: '', subtitle: '', date: '', description: '' };
                      updateSettings('workExperience', [...(data.workExperience || []), newExp]);
                    }}
                    className="text-[9px] uppercase font-bold tracking-widest bg-black text-white px-2 py-1 rounded-sm"
                   >
                     + Add
                   </button>
                 </div>
                 <div className="space-y-4">
                   {Array.isArray(data.workExperience) && data.workExperience.map((exp, idx) => (
                     <div key={exp.id} className="space-y-2 p-3 border border-black/10 bg-zinc-50/30">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            placeholder="Title" 
                            className="w-full border-b border-black/10 p-1 text-[11px] outline-none" 
                            value={exp.title} 
                            onChange={(e) => {
                              const newList = [...(data.workExperience || [])];
                              newList[idx] = { ...exp, title: e.target.value };
                              updateSettings('workExperience', newList);
                            }}
                          />
                          <input 
                            placeholder="Date" 
                            className="w-full border-b border-black/10 p-1 text-[11px] outline-none text-right" 
                            value={exp.date} 
                            onChange={(e) => {
                              const newList = [...(data.workExperience || [])];
                              newList[idx] = { ...exp, date: e.target.value };
                              updateSettings('workExperience', newList);
                            }}
                          />
                        </div>
                        <input 
                          placeholder="Company — Location" 
                          className="w-full border-b border-black/10 p-1 text-[11px] outline-none" 
                          value={exp.subtitle} 
                          onChange={(e) => {
                            const newList = [...(data.workExperience || [])];
                            newList[idx] = { ...exp, subtitle: e.target.value };
                            updateSettings('workExperience', newList);
                          }}
                        />
                        <textarea 
                          placeholder="Description" 
                          className="w-full border border-black/10 p-2 text-[11px] h-20 outline-none" 
                          value={exp.description} 
                          onChange={(e) => {
                            const newList = [...(data.workExperience || [])];
                            newList[idx] = { ...exp, description: e.target.value };
                            updateSettings('workExperience', newList);
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newList = data.workExperience?.filter(e => e.id !== exp.id);
                            updateSettings('workExperience', newList);
                          }}
                          className="text-[8px] text-red-500 uppercase font-bold"
                        >
                          Remove
                        </button>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-black/5">
                 <div className="flex justify-between items-center">
                   <label className="text-[9px] uppercase font-bold tracking-widest opacity-40">Education</label>
                   <button 
                    onClick={() => {
                      const newEdu = { id: Date.now().toString(), title: '', subtitle: '', date: '', description: '' };
                      updateSettings('education', [...(data.education || []), newEdu]);
                    }}
                    className="text-[9px] uppercase font-bold tracking-widest bg-black text-white px-2 py-1 rounded-sm"
                   >
                     + Add
                   </button>
                 </div>
                 <div className="space-y-4">
                   {Array.isArray(data.education) && data.education.map((edu, idx) => (
                     <div key={edu.id} className="space-y-2 p-3 border border-black/10 bg-zinc-50/30">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            placeholder="Degree" 
                            className="w-full border-b border-black/10 p-1 text-[11px] outline-none" 
                            value={edu.title} 
                            onChange={(e) => {
                              const newList = [...(data.education || [])];
                              newList[idx] = { ...edu, title: e.target.value };
                              updateSettings('education', newList);
                            }}
                          />
                          <input 
                            placeholder="Period" 
                            className="w-full border-b border-black/10 p-1 text-[11px] outline-none text-right" 
                            value={edu.date} 
                            onChange={(e) => {
                              const newList = [...(data.education || [])];
                              newList[idx] = { ...edu, date: e.target.value };
                              updateSettings('education', newList);
                            }}
                          />
                        </div>
                        <input 
                          placeholder="Institution — Location" 
                          className="w-full border-b border-black/10 p-1 text-[11px] outline-none" 
                          value={edu.subtitle} 
                          onChange={(e) => {
                            const newList = [...(data.education || [])];
                            newList[idx] = { ...edu, subtitle: e.target.value };
                            updateSettings('education', newList);
                          }}
                        />
                        <textarea 
                          placeholder="Description" 
                          className="w-full border border-black/10 p-2 text-[11px] h-20 outline-none" 
                          value={edu.description} 
                          onChange={(e) => {
                            const newList = [...(data.education || [])];
                            newList[idx] = { ...edu, description: e.target.value };
                            updateSettings('education', newList);
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newList = data.education?.filter(e => e.id !== edu.id);
                            updateSettings('education', newList);
                          }}
                          className="text-[8px] text-red-500 uppercase font-bold"
                        >
                          Remove
                        </button>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest opacity-40">Modeling</label>
                    <input 
                      className="w-full border-b border-black/10 p-1 text-[11px] outline-none focus:border-black"
                      value={data.modeling || ''}
                      onChange={(e) => updateSettings('modeling', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest opacity-40">Soft Skill</label>
                    <input 
                      className="w-full border-b border-black/10 p-1 text-[11px] outline-none focus:border-black"
                      value={data.softSkill || ''}
                      onChange={(e) => updateSettings('softSkill', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest opacity-40">Visualization</label>
                    <input 
                      className="w-full border-b border-black/10 p-1 text-[11px] outline-none focus:border-black"
                      value={data.visualization || ''}
                      onChange={(e) => updateSettings('visualization', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest opacity-40">Prototyping</label>
                    <input 
                      className="w-full border-b border-black/10 p-1 text-[11px] outline-none focus:border-black"
                      value={data.prototyping || ''}
                      onChange={(e) => updateSettings('prototyping', e.target.value)}
                    />
                  </div>
               </div>
            </div>
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
                      onFileSelected={(f) => handleFileUpload(f)} />
                  </>
                )}
              </div>

              <div className="space-y-5 mt-8">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Label (e.g. Case Study 2026)</label>
                  <input 
                    className="w-full border-b border-black p-2 outline-none focus:border-blue-500 font-bold uppercase transition-all relative z-[170] pointer-events-auto"
                    value={editingItem.label || ''}
                    placeholder="Case Study 2026"
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => updateItem({ ...editingItem, label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Project Name</label>
                  <input 
                    className="w-full border-b border-black p-2 outline-none focus:border-blue-500 font-bold uppercase transition-all relative z-[170] pointer-events-auto"
                    value={editingItem.title}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => updateItem({ ...editingItem, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Discipline</label>
                    <input 
                      className="w-full border-b border-zinc-200 p-2 outline-none focus:border-black text-sm uppercase relative z-[170] pointer-events-auto"
                      value={editingItem.category}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={(e) => updateItem({ ...editingItem, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Year</label>
                    <input 
                      className="w-full border-b border-zinc-200 p-2 outline-none focus:border-black text-sm relative z-[170] pointer-events-auto"
                      value={editingItem.year || ''}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={(e) => updateItem({ ...editingItem, year: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Mission Description</label>
                  <textarea 
                    className="w-full border border-zinc-100 p-4 outline-none focus:border-black text-sm min-h-[140px] resize-none bg-zinc-50/30 relative z-[170] pointer-events-auto"
                    value={editingItem.description || ''}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => updateItem({ ...editingItem, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">Source URLs (Advanced)</label>
                  <div className="space-y-2">
                    <input 
                      className="w-full border border-zinc-100 p-2 outline-none focus:border-black text-[9px] font-mono relative z-[170] pointer-events-auto"
                      placeholder="Image URL"
                      value={editingItem.imageUrl}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={(e) => updateItem({ ...editingItem, imageUrl: e.target.value })}
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
  const { data, loading: dataLoading } = usePortfolioData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('work');
  const [showAdminInterface, setShowAdminInterface] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Preload all portfolio item standard images
  useEffect(() => {
    if (!dataLoading && data.items) {
      if (data.items.length === 0) {
        setImagesPreloaded(true);
        return;
      }

      const imageUrls = data.items
        .map(item => item.imageUrl)
        .filter(Boolean);

      if (imageUrls.length === 0) {
        setImagesPreloaded(true);
        return;
      }

      let loadedCount = 0;
      const total = imageUrls.length;

      const handleImageLoad = () => {
        loadedCount++;
        if (loadedCount >= total) {
          setImagesPreloaded(true);
        }
      };

      imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.onload = handleImageLoad;
        img.onerror = handleImageLoad; // Fallback to avoid blocking on bad Image URLs
      });
    }
  }, [dataLoading, data.items]);

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

  if (dataLoading || !imagesPreloaded) {
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
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">Initializing</span>
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
            <CVPage key="about" data={data} />
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
