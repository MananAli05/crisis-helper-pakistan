import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode, RefObject } from "react";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CloudRain,
  Compass,
  Droplets,
  FileText,
  Flame,
  Headphones,
  Home,
  Languages,
  Loader2,
  Map,
  MapPin,
  Menu,
  Mic,
  Navigation,
  Phone,
  Radio,
  Route,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Speaker,
  UserSearch,
  Waves,
  Zap,
  CheckCircle2,
  Sun,
  Cloud,
  CloudLightning,
  CloudDrizzle,
  Thermometer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getEmergencyGuidance } from "./services/geminiService";

type PageId = "overview" | "assistant" | "map" | "alerts" | "shelters" | "contacts" | "guide";

type GuidanceResult = {
  immediate_steps: string[];
  contacts: { name: string; number: string }[];
  nearby_options: string[];
  urdu_instructions: string[];
  english_instructions: string[];
  reassurance: string;
};

type EmergencyType = {
  id: string;
  label: string;
  urduLabel: string;
  icon: ReactNode;
  placeholder: string;
  image: string;
  color: string;
};

const emergencyTypes: EmergencyType[] = [
  {
    id: "medical",
    label: "Medical Emergency",
    urduLabel: "\u0637\u0628\u06cc \u0627\u06cc\u0645\u0631\u062c\u0646\u0633\u06cc",
    icon: <Activity className="w-6 h-6 text-rose-500" />,
    placeholder: "Example: A person is having a heart attack and needs immediate medical attention.",
    image: "https://t3.ftcdn.net/jpg/05/51/01/72/360_F_551017210_IQTOezSDlGMn9zFXgd8IE7grlf9eeQsk.jpg",
    color: "bg-rose-500/20 border-rose-500/30",
  },
  {
    id: "fire",
    label: "Fire Emergency",
    urduLabel: "\u0622\u06af \u06a9\u06cc \u0627\u06cc\u0645\u0631\u062c\u0646\u0633\u06cc",
    icon: <Flame className="w-6 h-6 text-orange-500" />,
    placeholder: "Example: A fire has broken out in the kitchen and is spreading.",
    image: "https://www.bugoutbagbuilder.com/sites/default/files/images/Bug-Our-Bag-Builder-Prepare-for-Home-Fires-FB.jpg",
    color: "bg-orange-500/20 border-orange-500/30",
  },
  {
    id: "security",
    label: "Crime / Security",
    urduLabel: "\u062c\u0631\u0645 / \u0633\u06cc\u06a9\u0648\u0631\u0679\u06cc",
    icon: <ShieldAlert className="w-6 h-6 text-blue-500" />,
    placeholder: "Example: Armed robbery in progress at street corner.",
    image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&q=80&w=800",
    color: "bg-blue-500/20 border-blue-500/30",
  },
  {
    id: "disaster",
    label: "Natural Disaster",
    urduLabel: "\u0642\u062f\u0631\u062a\u06cc \u0622\u0641\u062a",
    icon: <Waves className="w-6 h-6 text-cyan-500" />,
    placeholder: "Example: Flood water entering homes near the river.",
    image: "https://idsb.tmgrup.com.tr/ly/uploads/images/2023/12/31/307966.jpg",
    color: "bg-cyan-500/20 border-cyan-500/30",
  },
  {
    id: "child",
    label: "Lost Child",
    urduLabel: "\u06af\u0645\u0634\u062f\u06c1 \u0628\u0686\u06c1",
    icon: <UserSearch className="w-6 h-6 text-purple-500" />,
    placeholder: "Example: A 5-year old boy wearing a red shirt is lost in the market.",
    image: "https://galelawgroup.com/wp-content/uploads/2025/02/kidnappingsfamily.jpg",
    color: "bg-purple-500/20 border-purple-500/30",
  },
  {
    id: "other",
    label: "Other Emergency",
    urduLabel: "\u062f\u06cc\u06af\u0631 \u0627\u06cc\u0645\u0631\u062c\u0646\u0633\u06cc",
    icon: <AlertTriangle className="w-6 h-6 text-slate-300" />,
    placeholder: "Example: Describe your emergency here clearly.",
    image: "https://www.reuters.com/resizer/v2/https%3A%2F%2Farchive-images.prod.global.a201836.reutersmedia.net%2F2012%2F09%2F13%2F2012-09-13T154523Z_04_RP2DRIEDMOAA_RTRRPP_0_CRASH.JPG?auth=d91ceb5d30b891e33ab643ab009fc7d639dadd8cacf0fdd461949fe6b27954e2&width=1920&quality=80",
    color: "bg-slate-500/30 border-slate-500/40",
  },
];

const navItems: { id: PageId; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Dashboard", icon: <Home /> },
  { id: "assistant", label: "AI Voice Help", icon: <Headphones /> },
  { id: "map", label: "Live Map", icon: <Map /> },
  { id: "alerts", label: "Weather Alerts", icon: <CloudRain /> },
  { id: "shelters", label: "Shelters", icon: <ShieldCheck /> },
  { id: "contacts", label: "Emergency Calls", icon: <Phone /> },
  { id: "guide", label: "How to Use", icon: <FileText /> },
];

const cities = ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Multan", "Lahore", "Peshawar", "Quetta"];

const shelters = [
  { name: "Sheikh Zayed Medical College", city: "Rahim Yar Khan", distance: "1.2 km", capacity: "800 people", status: "Open", route: "Jail Road", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" },
  { name: "Government Boys Degree College", city: "Hyderabad", distance: "1.8 km", capacity: "320 people", status: "Open", route: "Main Auto Bhan Road", image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=800" },
  { name: "District Sports Complex", city: "Sukkur", distance: "2.4 km", capacity: "500 people", status: "Open", route: "Military Road", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800" },
  { name: "Jinnah School Relief Camp", city: "Karachi", distance: "3.1 km", capacity: "240 people", status: "Limited", route: "Shahrah-e-Faisal", image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800" },
];

const emergencyContacts = [
  { name: "Rescue 1122", number: "1122", area: "Punjab, KP, major districts", priority: "Ambulance / rescue" },
  { name: "Police Emergency", number: "15", area: "Nationwide", priority: "Security / missing person" },
  { name: "Edhi Foundation", number: "115", area: "Nationwide", priority: "Ambulance / shelter" },
  { name: "Fire Brigade", number: "16", area: "Major cities", priority: "Fire / building risk" },
  { name: "Chhipa Ambulance", number: "1020", area: "Karachi", priority: "Ambulance" },
  { name: "Aman Ambulance", number: "1021", area: "Karachi", priority: "Ambulance" },
];

const weatherAlerts = [
  { city: "Karachi", risk: "Moderate", rain: "42 mm", river: "Urban drains under pressure", color: "bg-amber-500", temp: "31°C", weatherLabel: "Partly Cloudy", weatherIconType: "Cloud" },
  { city: "Hyderabad", risk: "High", rain: "84 mm", river: "Low-lying areas at risk", color: "bg-red-500", temp: "34°C", weatherLabel: "Rainy", weatherIconType: "CloudRain" },
  { city: "Sukkur", risk: "Severe", rain: "116 mm", river: "Indus belt watch active", color: "bg-rose-600", temp: "36°C", weatherLabel: "Thunderstorm", weatherIconType: "CloudLightning" },
  { city: "Lahore", risk: "Low", rain: "18 mm", river: "Normal flow", color: "bg-emerald-500", temp: "28°C", weatherLabel: "Clear", weatherIconType: "Sun" },
];

const weatherCities = [
  { city: "Rahim Yar Khan", latitude: 28.4212, longitude: 70.2989, river: "Local drainage watch" },
  { city: "Karachi", latitude: 24.86, longitude: 67.01, river: "Urban drains and coastal roads watch" },
  { city: "Hyderabad", latitude: 25.39, longitude: 68.36, river: "Low-lying Latifabad and Qasimabad watch" },
  { city: "Sukkur", latitude: 27.71, longitude: 68.85, river: "Indus river belt watch" },
  { city: "Lahore", latitude: 31.52, longitude: 74.36, river: "Ravi and urban drainage watch" },
];

const impactStats = [
  { label: "Active Incidents", value: "24", icon: <Activity /> },
  { label: "Shelters Online", value: "148", icon: <ShieldCheck /> },
  { label: "Emergency Lines", value: "6", icon: <Phone /> },
  { label: "AI Guidance Used", value: "2.4k", icon: <Headphones /> },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("medical");
  const [location, setLocation] = useState("Auto-detecting...");
  const [situation, setSituation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const [userLat, setUserLat] = useState(24.8607);
  const [userLng, setUserLng] = useState(67.0011);
  const [isLocationReal, setIsLocationReal] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          setIsLocationReal(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county;
              const suburb = data.address.suburb || data.address.neighbourhood;
              const locationStr = [suburb, city].filter(Boolean).join(", ");
              if (locationStr) setLocation(locationStr);
              else setLocation("Location Found");
            }
          } catch (e) {
            setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error("Location access denied", error);
          setLocation("Location access denied");
        }
      );
    } else {
      setLocation("Location not supported");
    }
  }, []);

  const dynamicMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${userLng - 0.05}%2C${userLat - 0.05}%2C${userLng + 0.05}%2C${userLat + 0.05}&layer=mapnik&marker=${userLat}%2C${userLng}`;

  const selectedEmergency = useMemo(
    () => emergencyTypes.find((type) => type.id === selectedType) ?? emergencyTypes[0],
    [selectedType],
  );

  const goTo = (page: PageId) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectEmergencyAndGo = (typeId: string) => {
    setSelectedType(typeId);
    goTo("assistant");
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ur-PK";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError("");
      setIsListening(true);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setError("Voice input could not start. Please allow microphone access and try again.");
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setSituation((current) => `${current ? `${current} ` : ""}${transcript}`);
    };

    recognition.start();
  };

  const speakUrdu = () => {
    if (!result || !("speechSynthesis" in window)) return;
    const text = result.urdu_instructions.join(". ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ur-PK";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!location.trim() || !situation.trim()) {
      setError("Please add your location and describe what is happening.");
      return;
    }

    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const data = await getEmergencyGuidance(selectedEmergency.label, location, situation);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError("Gemini guidance is unavailable right now. Call 1122 immediately for life-threatening emergencies.");
    } finally {
      setIsLoading(false);
    }
  };

  const shareGuidance = () => {
    if (!result) return;
    const text = `Crisis Helper\nLocation: ${location}\nEmergency: ${selectedEmergency.label}\n\nImmediate steps:\n${result.immediate_steps
      .map((step, index) => `${index + 1}. ${step}`)
      .join("\n")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark bg-[#f97316]">
            <Radio className="text-white w-6 h-6" />
          </span>
          <div>
            <strong className="text-white font-extrabold tracking-tight">Crisis Helper</strong><br></br>
            <span className="text-[#a9c2c9] font-medium text-xs">Pakistan Flood Response</span>
          </div>
        </div>

        <nav className="nav-list mt-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${
                activePage === item.id 
                  ? "bg-[#1f4650] text-white" 
                  : "text-[#dce8eb] hover:bg-[#1f4650] hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-alert mt-auto bg-[#fef3c7] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#422006] font-bold mb-2">
            <Siren className="w-5 h-5" />
            <span>Emergency first</span>
          </div>
          <span className="text-[#854d0e] text-sm leading-relaxed block mb-3 font-medium">
            For danger to life, call 1122 or 15 before using AI guidance.
          </span>
          <a href="tel:1122" className="flex items-center justify-center bg-[#b91c1c] text-white font-bold py-2 rounded-lg hover:bg-red-800 transition-colors">
            Call 1122
          </a>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            className="mobile-scrim"
            type="button"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close navigation"
          />
        )}
      </AnimatePresence>

      <main className="app-shell pb-20">
        <header className="topbar flex items-center justify-between py-6 border-b border-stone-200 mb-8">
          <div className="flex items-center gap-4">
            <button className="icon-button mobile-menu border-stone-200 bg-white" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <Menu className="w-6 h-6 text-stone-700" />
            </button>
            <div>
              <span className="eyebrow text-indigo-600 text-xs font-extrabold tracking-widest uppercase">Live Dashboard</span>
              <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1">{pageTitle(activePage)}</h1>
            </div>
          </div>
          <div className="topbar-actions flex gap-3">
            {isLocationReal && (
               <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 Live Location Active
               </div>
            )}
            <button className="primary-action bg-stone-900 text-white px-5 py-2.5 rounded-full font-bold hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10 flex items-center gap-2" type="button" onClick={() => goTo("assistant")}>
              <Mic className="w-4 h-4" /> Voice Help
            </button>
          </div>
        </header>

        {activePage === "overview" && <OverviewPage selectEmergencyAndGo={selectEmergencyAndGo} mapUrl={dynamicMapUrl} />}
        {activePage === "assistant" && (
          <AssistantPage
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            location={location}
            setLocation={setLocation}
            situation={situation}
            setSituation={setSituation}
            selectedEmergency={selectedEmergency}
            isListening={isListening}
            isLoading={isLoading}
            error={error}
            result={result}
            resultRef={resultRef}
            startVoiceInput={startVoiceInput}
            handleSubmit={handleSubmit}
            speakUrdu={speakUrdu}
            shareGuidance={shareGuidance}
            mapUrl={dynamicMapUrl}
          />
        )}
        {activePage === "map" && <MapPage mapUrl={dynamicMapUrl} />}
        {activePage === "alerts" && <AlertsPage userLat={userLat} userLng={userLng} userLocation={location} isLocationReal={isLocationReal} />}
        {activePage === "shelters" && <SheltersPage />}
        {activePage === "contacts" && <ContactsPage />}
        {activePage === "guide" && <GuidePage goTo={goTo} />}
      </main>
    </div>
  );
}

function pageTitle(page: PageId) {
  const titles: Record<PageId, string> = {
    overview: "Emergency Control Center",
    assistant: "AI Crisis Assistant",
    map: "Real-time Location",
    alerts: "Risk Intelligence",
    shelters: "Safe Zones",
    contacts: "Priority Lines",
    guide: "System Manual",
  };
  return titles[page];
}

function OverviewPage({ selectEmergencyAndGo, mapUrl }: { selectEmergencyAndGo: (type: string) => void, mapUrl: string }) {
  return (
    <motion.section 
      className="page-stack flex flex-col gap-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center gap-6 p-8 rounded-[2rem] bg-white border border-stone-200 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold w-fit border border-indigo-100">
            <Radio className="w-4 h-4" /> Active Threat Intelligence
          </span>
          <h2 className="text-4xl md:text-[3.25rem] font-extrabold text-stone-900 leading-[1.1] tracking-tight">
            Rapid AI Response for Critical Emergencies.
          </h2>
          <p className="text-stone-500 text-lg md:text-xl leading-relaxed max-w-lg font-medium">
            Instantly access localized guidance, alert networks, and secure mapping tailored to your live geographic coordinates.
          </p>
        </div>

        <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 h-[380px] group shadow-sm bg-stone-100">
          <iframe title="Live User Map" src={mapUrl} className="w-full h-full filter saturate-[0.8] contrast-[1.05]" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <div>
              <span className="text-indigo-300 font-bold uppercase tracking-wider text-xs block mb-1">Live Tracking Enabled</span>
              <strong className="text-white text-xl font-bold drop-shadow-md">Your Local Area Map</strong>
            </div>
            <div className="w-12 h-12 rounded-full bg-white shadow-xl border border-stone-200 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">Select Emergency Type</h3>
            <p className="text-stone-500 mt-2 text-lg font-medium">Tap a category to initiate AI crisis protocols</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emergencyTypes.map((type, i) => (
            <motion.button
              key={type.id}
              onClick={() => selectEmergencyAndGo(type.id)}
              className="group relative h-72 rounded-[2rem] overflow-hidden text-left focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-stone-900/20 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent z-10 opacity-90"></div>
              <img src={type.image} alt={type.label} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
              
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${type.color} bg-white/10 backdrop-blur-md border border-white/20 shadow-lg`}>
                  {type.icon}
                </div>
                <h4 className="text-2xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">{type.label}</h4>
                <p className="text-stone-200 font-urdu text-lg">{type.urduLabel}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#102a32] to-[#1a3c47] rounded-[2rem] p-10 md:p-14 shadow-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-sky-400 font-extrabold uppercase tracking-widest text-sm mb-3 block">System Architecture</span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">How CrisisOps Works</h3>
          <p className="text-stone-300 text-base leading-relaxed mb-12 max-w-2xl">
            When disaster strikes, every second matters. We connect live geolocation, verified shelter data, and advanced AI reasoning to provide immediate guidance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 - Assess */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 mb-6 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-indigo-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              </div>
              <span className="text-indigo-300 font-black text-xs uppercase tracking-widest block mb-2">Step 01</span>
              <strong className="text-white text-xl font-extrabold block mb-3 group-hover:text-indigo-200 transition-colors">Assess</strong>
              <p className="text-stone-400 font-medium text-sm leading-relaxed">Your live GPS location is captured and your emergency type is identified from voice or text input.</p>
            </div>

            {/* Step 2 - Analyze */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 mb-6 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-purple-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div>
              <span className="text-purple-300 font-black text-xs uppercase tracking-widest block mb-2">Step 02</span>
              <strong className="text-white text-xl font-extrabold block mb-3 group-hover:text-purple-200 transition-colors">Analyze</strong>
              <p className="text-stone-400 font-medium text-sm leading-relaxed">AI cross-references standard emergency protocols and generates safe, step-by-step localized instructions.</p>
            </div>

            {/* Step 3 - Act */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 mb-6 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <span className="text-emerald-300 font-black text-xs uppercase tracking-widest block mb-2">Step 03</span>
              <strong className="text-white text-xl font-extrabold block mb-3 group-hover:text-emerald-200 transition-colors">Act</strong>
              <p className="text-stone-400 font-medium text-sm leading-relaxed">You receive priority contacts, verified safe zone routing, and bilingual Urdu voice guidance instantly.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="bg-white border border-stone-200 p-7 rounded-[2rem] flex flex-col gap-5 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-rose-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <strong className="text-3xl md:text-4xl font-black text-stone-900 block mb-1">24</strong>
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Active Incidents</span>
          </div>
        </div>

        {/* Shelters Online */}
        <div className="bg-white border border-stone-200 p-7 rounded-[2rem] flex flex-col gap-5 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-emerald-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <div>
            <strong className="text-3xl md:text-4xl font-black text-stone-900 block mb-1">148</strong>
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Shelters Online</span>
          </div>
        </div>

        {/* Emergency Lines */}
        <div className="bg-white border border-stone-200 p-7 rounded-[2rem] flex flex-col gap-5 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-blue-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.37a16 16 0 0 0 5.72 5.72l1.67-1.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div>
            <strong className="text-3xl md:text-4xl font-black text-stone-900 block mb-1">6</strong>
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Emergency Lines</span>
          </div>
        </div>

        {/* AI Guidance Used */}
        <div className="bg-white border border-stone-200 p-7 rounded-[2rem] flex flex-col gap-5 hover:shadow-lg hover:-translate-y-1 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-indigo-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div>
            <strong className="text-3xl md:text-4xl font-black text-stone-900 block mb-1">2.4k</strong>
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">AI Guidance Used</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AssistantPage(props: {
  selectedType: string;
  setSelectedType: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  situation: string;
  setSituation: (value: string) => void;
  selectedEmergency: EmergencyType;
  isListening: boolean;
  isLoading: boolean;
  error: string;
  result: GuidanceResult | null;
  resultRef: RefObject<HTMLDivElement | null>;
  startVoiceInput: () => void;
  handleSubmit: (event: FormEvent) => Promise<void>;
  speakUrdu: () => void;
  shareGuidance: () => void;
  mapUrl: string;
}) {
  return (
    <motion.section 
      className="page-stack"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <form className="bg-white border border-stone-200 p-8 md:p-10 rounded-[2rem] shadow-sm" onSubmit={props.handleSubmit}>
          <div className="mb-8">
            <span className="text-indigo-600 font-extrabold uppercase tracking-widest text-xs">Emergency Intake</span>
            <h2 className="text-3xl font-extrabold text-stone-900 mt-2 mb-3">Report Situation</h2>
            <p className="text-stone-500 font-medium">Our AI will process your report and provide immediate actionable steps based on standard crisis protocols.</p>
          </div>

          <label className="block text-stone-900 font-extrabold mb-4 text-lg">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {emergencyTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => props.setSelectedType(type.id)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  props.selectedType === type.id 
                    ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm" 
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <div className={props.selectedType === type.id ? "scale-110 transition-transform" : ""}>
                   {type.icon}
                </div>
                <div className="text-center">
                  <strong className="block text-sm font-bold">{type.label}</strong>
                </div>
              </button>
            ))}
          </div>

          <label className="block text-stone-900 font-extrabold mb-3 text-lg" htmlFor="location">Live Location</label>
          <div className="flex items-center gap-3 bg-[#faf7f2] border border-stone-200 rounded-xl px-4 py-4 mb-8 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <MapPin className="text-indigo-600 w-6 h-6" />
            <input
              id="location"
              className="bg-transparent border-none outline-none text-stone-900 w-full placeholder-stone-400 font-medium text-lg"
              value={props.location}
              onChange={(event) => props.setLocation(event.target.value)}
              placeholder="Detecting or enter manually..."
            />
          </div>

          <label className="block text-stone-900 font-extrabold mb-3 text-lg" htmlFor="situation">Situation Details</label>
          <div className="relative mb-8">
            <textarea
              id="situation"
              className="w-full bg-[#faf7f2] border border-stone-200 rounded-xl p-5 min-h-[180px] text-stone-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder-stone-400 font-medium text-lg"
              value={props.situation}
              onChange={(event) => props.setSituation(event.target.value)}
              placeholder={props.selectedEmergency.placeholder}
              maxLength={650}
            />
            <button
              className={`absolute bottom-5 left-5 flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${
                props.isListening ? "bg-rose-600 text-white animate-pulse" : "bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"
              }`}
              type="button"
              onClick={props.startVoiceInput}
            >
              {props.isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4 text-indigo-600" />}
              {props.isListening ? "Listening..." : "Speak Urdu"}
            </button>
          </div>

          {props.error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-6 font-bold shadow-sm">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600" /> {props.error}
            </div>
          )}

          <button 
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white font-black py-5 rounded-xl text-lg hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]" 
            type="submit" 
            disabled={props.isLoading}
          >
            {props.isLoading ? <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing Threat Level...</> : "Generate Action Plan"}
          </button>
        </form>

        <aside className="flex flex-col gap-6">
          <div className="bg-white border border-stone-200 p-6 rounded-[2rem] shadow-sm">
            <h3 className="text-stone-900 font-extrabold mb-4 text-lg">Location Context</h3>
            <div className="h-56 rounded-xl overflow-hidden border border-stone-200 relative bg-stone-100">
               <iframe title="Assistant Map" src={props.mapUrl} className="w-full h-full filter saturate-75 contrast-105 pointer-events-none" loading="lazy" />
               <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
            </div>
          </div>
          
          <div className="bg-white border border-stone-200 p-6 rounded-[2rem] shadow-sm">
            <h3 className="text-stone-900 font-extrabold mb-4 text-lg">Priority Contacts</h3>
            <div className="grid grid-cols-1 gap-3">
              {emergencyContacts.slice(0, 3).map((contact) => (
                <a href={`tel:${contact.number}`} key={contact.name} className="flex items-center justify-between p-4 rounded-xl bg-[#faf7f2] hover:bg-stone-100 transition-colors border border-stone-200">
                  <div>
                    <span className="text-stone-900 font-extrabold block mb-0.5">{contact.name}</span>
                    <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">{contact.priority}</span>
                  </div>
                  <strong className="text-rose-600 text-xl font-black">{contact.number}</strong>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {props.result && (
        <motion.div
          className="mt-8 bg-white border-2 border-emerald-500 p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-emerald-500/10"
          ref={props.resultRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-stone-200 pb-8">
            <div>
              <span className="text-emerald-600 font-extrabold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5" /> Action Plan Generated
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-stone-900 leading-tight">Critical Steps for {props.location}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-stone-100 text-stone-800 px-5 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors border border-stone-200" type="button" onClick={props.speakUrdu}>
                <Speaker className="w-5 h-5" /> Audio
              </button>
              <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20" type="button" onClick={props.shareGuidance}>
                <Send className="w-5 h-5" /> Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <GuidanceList title="Immediate Actions" icon={<Siren className="w-6 h-6 text-rose-600" />} items={props.result.immediate_steps} />
            <GuidanceList title="Urdu Instructions" icon={<Languages className="w-6 h-6 text-indigo-600" />} items={props.result.urdu_instructions} rtl />
          </div>

          <div className="bg-[#faf7f2] rounded-2xl p-8 border border-stone-200">
            <h3 className="text-stone-900 font-extrabold mb-5 flex items-center gap-2 text-xl"><Navigation className="w-6 h-6 text-stone-500" /> Nearby Resources</h3>
            <div className="flex flex-wrap gap-3">
              {props.result.nearby_options.map((option) => (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(option)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  key={option} 
                  className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold shadow-sm hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center gap-2"
                >
                  {option}
                </a>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-stone-500 italic font-bold text-lg">{props.result.reassurance}</p>
        </motion.div>
      )}
    </motion.section>
  );
}

function GuidanceList({ title, icon, items, rtl = false }: { title: string; icon: ReactNode; items: string[]; rtl?: boolean }) {
  return (
    <div className={`flex flex-col gap-5 ${rtl ? 'text-right' : 'text-left'}`}>
      <h3 className={`flex items-center gap-3 text-2xl font-black text-stone-900 ${rtl ? 'flex-row-reverse' : ''}`}>
        {icon} {title}
      </h3>
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div className={`flex items-start gap-5 p-5 rounded-2xl bg-white border border-stone-200 shadow-sm ${rtl ? 'flex-row-reverse' : ''}`} key={`${item}-${index}`}>
            <strong className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-900 font-black text-lg border border-stone-200">
              {index + 1}
            </strong>
            <span className={`text-stone-700 font-medium leading-relaxed pt-1 ${rtl ? 'font-urdu text-xl' : 'text-lg'}`}>
              {item.replace(/\*\*/g, '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapPage({ mapUrl }: { mapUrl: string }) {
  return (
    <motion.section className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="h-[600px] rounded-[2rem] overflow-hidden border border-stone-200 relative shadow-md bg-stone-100">
        <iframe title="Pakistan emergency map" src={mapUrl} className="w-full h-full filter saturate-[0.8] contrast-[1.05]" loading="lazy" />
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {shelters.map((shelter) => (
          <article className="bg-white p-8 rounded-[2rem] border border-stone-200 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow" key={shelter.name}>
            <div>
              <span className="text-indigo-600 text-xs font-extrabold tracking-widest uppercase mb-1 block">{shelter.city}</span>
              <h3 className="text-2xl font-black text-stone-900 leading-tight">{shelter.name}</h3>
            </div>
            <div className="text-stone-500 flex flex-col gap-3 font-medium">
              <span className="flex items-center gap-3"><Route className="w-5 h-5 text-stone-400" /> {shelter.route}</span>
              <span className="flex items-center gap-3"><Compass className="w-5 h-5 text-stone-400" /> {shelter.distance} away</span>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shelter.name} ${shelter.city} Pakistan`)}`} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors w-fit p-2 -ml-2 rounded-lg hover:bg-indigo-50">
              Navigate <ArrowRight className="w-5 h-5" />
            </a>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function AlertsPage({ userLat, userLng, userLocation, isLocationReal }: { userLat: number, userLng: number, userLocation: string, isLocationReal: boolean }) {
  const [liveAlerts, setLiveAlerts] = useState<any[]>(weatherAlerts);
  const [updatedAt, setUpdatedAt] = useState("Fallback sample data");

  const getWeatherDetails = (code: number) => {
    if (code === 0) return { label: "Clear", icon: "Sun" };
    if (code >= 1 && code <= 3) return { label: "Cloudy", icon: "Cloud" };
    if (code >= 51 && code <= 67) return { label: "Rainy", icon: "CloudRain" };
    if (code >= 71 && code <= 77) return { label: "Snow", icon: "CloudDrizzle" };
    if (code >= 95) return { label: "Thunderstorm", icon: "CloudLightning" };
    return { label: "Variable", icon: "Cloud" };
  };

  const IconRenderer = ({ type, className }: { type: string; className?: string }) => {
    const defaultColor = type === "Sun" ? "text-amber-500" : type === "CloudRain" ? "text-indigo-500" : type === "CloudLightning" ? "text-rose-500" : type === "CloudDrizzle" ? "text-cyan-500" : "text-stone-400";
    const css = className || `w-12 h-12 drop-shadow-md ${defaultColor}`;
    switch (type) {
      case "Sun": return <Sun className={css} />;
      case "Cloud": return <Cloud className={css} />;
      case "CloudRain": return <CloudRain className={css} />;
      case "CloudDrizzle": return <CloudDrizzle className={css} />;
      case "CloudLightning": return <CloudLightning className={css} />;
      default: return <Cloud className={css} />;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadWeather = async () => {
      try {
        let citiesToFetch = [...weatherCities];
        if (isLocationReal) {
          const uCity = userLocation === "Auto-detecting..." ? "Your Location" : userLocation;
          
          // Filter out the city if it's already in the hardcoded list (case-insensitive partial match) to prevent duplicates
          citiesToFetch = citiesToFetch.filter(c => !c.city.toLowerCase().includes(uCity.toLowerCase()) && !uCity.toLowerCase().includes(c.city.toLowerCase()));
          
          const userCityObj = {
            city: uCity,
            latitude: userLat,
            longitude: userLng,
            river: "Local area risk watch"
          };
          citiesToFetch = [userCityObj, ...citiesToFetch];
        }

        const data = await Promise.all(
          citiesToFetch.map(async (city) => {
            const params = new URLSearchParams({
              latitude: String(city.latitude),
              longitude: String(city.longitude),
              current: "temperature_2m,precipitation,weather_code",
              timezone: "Asia/Karachi",
            });
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
            if (!response.ok) throw new Error("Weather API unavailable");
            const payload = await response.json();
            
            const currentRain = Number(payload.current?.precipitation ?? 0);
            const temp = payload.current?.temperature_2m ? `${Math.round(payload.current.temperature_2m)}°C` : "--°C";
            const weatherCode = Number(payload.current?.weather_code ?? 0);
            const { label: weatherLabel, icon: weatherIconType } = getWeatherDetails(weatherCode);

            const risk = currentRain >= 50 ? "Severe" : currentRain >= 20 ? "High" : currentRain >= 5 ? "Moderate" : "Low";
            const color = risk === "Severe" ? "bg-rose-500" : risk === "High" ? "bg-orange-500" : risk === "Moderate" ? "bg-amber-500" : "bg-emerald-500";

            return {
              city: city.city,
              risk,
              rain: `${currentRain.toFixed(1)} mm`,
              river: city.river,
              color,
              temp,
              weatherLabel,
              weatherIconType
            };
          }),
        );

        if (!cancelled) {
          setLiveAlerts(data);
          setUpdatedAt(`Live Open-Meteo data • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setUpdatedAt("Weather API offline • showing fallback sample data");
      }
    };

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [userLat, userLng, userLocation, isLocationReal]);

  const heroCity = liveAlerts[0];
  const otherCities = liveAlerts.slice(1);

  return (
    <motion.section className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900">National Weather</h2>
        <span className={`font-bold text-xs uppercase tracking-wider ${updatedAt.includes('offline') ? 'text-rose-600' : 'text-emerald-600'}`}>
          {updatedAt}
        </span>
      </div>

      {heroCity && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#102a32] to-[#1a4b59] text-white px-8 py-6 shadow-xl mb-8 border border-[#1a4b59]">
          <div className="absolute top-0 right-0 w-64 h-full bg-white/5 blur-3xl pointer-events-none rounded-full"></div>
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black leading-none mb-1">{heroCity.city}</h3>
              <p className="text-sky-300 font-bold text-sm uppercase tracking-widest">{heroCity.weatherLabel}</p>
            </div>
            <div className="flex items-center gap-4">
              <IconRenderer type={heroCity.weatherIconType} className="w-12 h-12 text-white drop-shadow-lg" />
              <span className="text-6xl font-black tracking-tighter leading-none">{heroCity.temp}</span>
            </div>
          </div>
          <div className="relative z-10 flex gap-4 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 border border-white/10">
              <Droplets className="w-4 h-4 text-sky-300" />
              <span className="font-bold text-sm">{heroCity.rain} precip</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 border border-white/10">
              <ShieldAlert className="w-4 h-4 text-sky-300" />
              <span className="font-bold text-sm">{heroCity.risk} Risk</span>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-extrabold text-stone-700 mb-4 uppercase tracking-widest">Other Cities</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {otherCities.map((alert) => (
          <article className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center group" key={alert.city}>
            <div className="transform group-hover:scale-110 transition-transform mb-3">
              <IconRenderer type={alert.weatherIconType} />
            </div>
            <span className="text-stone-900 font-black text-lg mb-0.5 truncate w-full">{alert.city}</span>
            <span className="text-3xl font-black text-stone-900 mb-1">{alert.temp}</span>
            <span className="text-stone-500 font-medium text-xs mb-3">{alert.weatherLabel}</span>
            <div className={`w-full text-xs font-extrabold uppercase py-1.5 rounded-lg border ${alert.color.replace('bg-', 'text-')} bg-stone-50 border-stone-200`}>
              {alert.risk} Risk
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function SheltersPage() {
  return (
    <motion.section className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900">Safe Zones Database</h2>
        <p className="text-stone-500 mt-3 text-lg font-medium">Verified shelters, relief camps and safe zones across Pakistan.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
        {shelters.map((shelter) => (
          <article key={shelter.name} className="flex flex-col bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div className="h-64 relative overflow-hidden bg-stone-100">
               <img src={shelter.image} alt={shelter.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent pointer-events-none"></div>
               <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white font-bold text-xs flex items-center gap-2 border border-white/20 shadow-sm">
                  <ShieldCheck className="w-4 h-4" /> Capacity: {shelter.capacity}
               </div>
               <div className="absolute bottom-5 left-6 right-6">
                  <span className="text-emerald-400 font-extrabold uppercase tracking-widest text-xs block mb-1 drop-shadow-md">{shelter.city}</span>
                  <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md">{shelter.name}</h3>
               </div>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col flex-1">
               <div className="flex items-center justify-between mb-6">
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${shelter.status === "Open" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                     {shelter.status}
                  </span>
                  <strong className="text-stone-900 text-xl font-black flex items-center gap-2">
                     <Route className="w-5 h-5 text-indigo-500" /> {shelter.distance}
                  </strong>
               </div>
               
               <p className="text-stone-600 font-medium flex items-start gap-3 mb-8">
                  <MapPin className="w-5 h-5 text-stone-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{shelter.route}</span>
               </p>
               
               <div className="mt-auto flex items-center gap-3">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shelter.name} ${shelter.city} Pakistan`)}`} target="_blank" rel="noreferrer" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 text-center flex items-center justify-center">
                    Navigate
                  </a>
               </div>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function ContactsPage() {
  return (
    <motion.section className="page-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emergencyContacts.map((contact) => (
          <a className="bg-white border border-stone-200 p-8 rounded-[2rem] hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5 transition-all flex flex-col h-full group" href={`tel:${contact.number}`} key={contact.name}>
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Phone className="w-6 h-6" />
              </div>
              <strong className="text-3xl font-black text-stone-900">{contact.number}</strong>
            </div>
            <div>
              <span className="text-stone-500 text-xs font-extrabold uppercase tracking-widest block mb-2">{contact.area}</span>
              <h3 className="text-2xl font-black text-stone-900 leading-tight">{contact.name}</h3>
              <p className="text-stone-500 font-medium mt-3">{contact.priority}</p>
            </div>
          </a>
        ))}
      </div>
    </motion.section>
  );
}

function GuidePage({ goTo }: { goTo: (page: PageId) => void }) {
  const steps = [
    "Select your emergency type from the live dashboard.",
    "Allow location access so we can pinpoint exactly where help is needed.",
    "Speak naturally in Urdu or type your details into the Crisis Assistant.",
    "Execute the generated AI action plan immediately while waiting for authorities.",
    "Use the secure live map to navigate to verified safe zones.",
  ];

  return (
    <motion.section className="page-stack max-w-4xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-white border border-stone-200 p-10 md:p-14 rounded-[2rem] shadow-sm">
        <span className="text-indigo-600 font-extrabold uppercase tracking-widest text-sm mb-2 block">Standard Operating Procedure</span>
        <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-10">System Manual</h2>
        <div className="flex flex-col gap-8 mb-12">
          {steps.map((step, index) => (
            <div className="flex gap-6 items-start" key={step}>
              <strong className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center flex-shrink-0 font-black text-xl">
                {index + 1}
              </strong>
              <span className="text-stone-600 text-xl font-medium leading-relaxed pt-2">{step}</span>
            </div>
          ))}
        </div>
        <button className="bg-stone-900 text-white font-black text-lg px-10 py-5 rounded-xl hover:bg-stone-800 transition-colors inline-flex items-center gap-3 shadow-xl shadow-stone-900/10" type="button" onClick={() => goTo("overview")}>
          Acknowledge & Start <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </motion.section>
  );
}
