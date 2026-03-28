/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Share2, Heart, Droplets, Lock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn("Supabase is not configured. Global scoring will be disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.");
}

type Stage = "selection" | "transition" | "game" | "success" | "signup" | "already_completed";

interface Nemesis {
  name: string;
  id: string;
  image: string;
}

const NEMESES: Nemesis[] = [
  { name: "Marine", id: "marine", image: "https://tse4.mm.bing.net/th/id/OIP.JTw6vkpgi8ZL3kPUBOg2TgHaEu?rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Ursula", id: "ursula", image: "https://clipground.com/images/women-face-png-10.jpg" },
  { name: "Viktor", id: "viktor", image: "https://www.pngmart.com/files/15/Viktor-Orban-PNG-Transparent-Image.png" },
];

const SLOGANS = [
  "Tax the Rich",
  "No means No",
  "Climate justice now",
  "¡No pasarán!",
  "Stop austerity",
  "Refugees welcome",
  "People before profit",
  "Never again fascism",
  "NO deportations",
  "No hate, no fear",
];

const TARGET_SCORE = 10;

export default function App() {
  const [stage, setStage] = useState<Stage>("selection");
  const [selectedNemesis, setSelectedNemesis] = useState<Nemesis | null>(null);
  const [score, setScore] = useState(0);
  const [globalTears, setGlobalTears] = useState(0);
  const [tears, setTears] = useState<{ id: number; x: number; y: number }[]>([]);
  const tearIdRef = useRef(0);
  const userSessionIdRef = useRef<string>("");

  // Check for completion and fetch global tears on mount
  useEffect(() => {
    // Generate or retrieve user session ID
    let sessionId = localStorage.getItem("user_session_id");
    if (!sessionId) {
      sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("user_session_id", sessionId);
    }
    userSessionIdRef.current = sessionId;

    const checkCompleted = localStorage.getItem("nemesis_completed");
    if (checkCompleted === "true") {
      setStage("already_completed");
    }

    const fetchGlobalTears = async () => {
      if (!supabase) return;
      try {
        const { count, error } = await supabase
          .from("tears")
          .select("*", { count: "exact", head: true });
        if (count !== null) {
          setGlobalTears(count);
        }
      } catch (err) {
        console.error("Error fetching global tears:", err);
      }
    };
    fetchGlobalTears();

    // Subscribe to real-time updates on tears table
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel("tears_changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "tears" },
          () => {
            // Refetch count when new tear is added
            fetchGlobalTears();
          }
        )
        .subscribe();
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Transition to game after selection
  useEffect(() => {
    if (stage === "transition") {
      const timer = setTimeout(() => setStage("game"), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Transition to success when score reaches target
  useEffect(() => {
    if (score >= TARGET_SCORE && stage === "game") {
      localStorage.setItem("nemesis_completed", "true");
      const timer = setTimeout(() => setStage("success"), 1000);
      return () => clearTimeout(timer);
    }
  }, [score, stage]);

  const handleSelectNemesis = (nemesis: Nemesis) => {
    setSelectedNemesis(nemesis);
    setStage("transition");
  };

  const savePointToSupabase = async (nemesisId: string, newScore: number) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase.from("tears").insert({
        user_session_id: userSessionIdRef.current,
        nemesis_id: nemesisId,
        score: newScore,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving point to Supabase:", error);
      } else {
        console.log("Point saved successfully");
        // Immediately increment global tears in UI after successful save
        setGlobalTears((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error saving point:", err);
    }
  };

  const handleAddPoint = async () => {
    if (score < TARGET_SCORE && selectedNemesis) {
      const newScore = score + 1;
      setScore(newScore);

      // Save point to Supabase table
      await savePointToSupabase(selectedNemesis.id, newScore);

      // Increment global tears counter
      if (supabase) {
        try {
          await supabase.rpc("increment_tears", { amount: 1 });
        } catch (err) {
          console.error("Error incrementing global tears:", err);
        }
      }

      // Add a tear animation
      const newTear = {
        id: tearIdRef.current++,
        x: Math.random() * 60 - 30, // Random offset from center
        y: 0,
      };
      setTears((prev) => [...prev, newTear]);
      // Remove tear after animation
      setTimeout(() => {
        setTears((prev) => prev.filter((t) => t.id !== newTear.id));
      }, 2000);
    }
  };

  const waterHeight = (stage === "success" || stage === "signup" || stage === "already_completed") ? 100 : (score / TARGET_SCORE) * 100;

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans text-[#141414] overflow-hidden relative">
      {/* Water Background Effect */}
      <AnimatePresence>
        {stage !== "selection" && stage !== "transition" && (
          <div className="fixed inset-0 pointer-events-none z-0">
            {/* Layer 1: Light Blue (Back/Top) */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-[#2584C6]"
              initial={{ height: "0%" }}
              animate={{ height: `${waterHeight}%` }}
              exit={{ height: "0%" }}
              transition={{ type: "spring", stiffness: 30, damping: 15 }}
            >
              <div className="absolute top-0 left-0 w-full -translate-y-[98%]">
                <motion.svg
                  viewBox="0 0 1440 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto text-[#2584C6] fill-current"
                  animate={{ y: [5, -5, 5] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <path d="M0 60C60 20 120 20 180 60C240 100 300 100 360 60C420 20 480 20 540 60C600 100 660 100 720 60C780 20 840 20 900 60C960 100 1020 100 1080 60C1140 20 1200 20 1260 60C1320 100 1380 100 1440 60V120H0V60Z" />
                </motion.svg>
              </div>
            </motion.div>

            {/* Layer 2: Medium Blue (Middle) */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-[#1E6BA1]"
              initial={{ height: "0%" }}
              animate={{ height: `${waterHeight * 0.97}%` }}
              exit={{ height: "0%" }}
              transition={{ type: "spring", stiffness: 30, damping: 15, delay: 0.05 }}
            >
              <div className="absolute top-0 left-0 w-full -translate-y-[95%]">
                <motion.svg
                  viewBox="0 0 1440 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto text-[#1E6BA1] fill-current"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                >
                  <path d="M0 60C45 20 90 20 135 60C180 100 225 100 270 60C315 20 360 20 405 60C450 100 495 100 540 60C585 20 630 20 675 60C720 100 765 100 810 60C855 20 900 20 945 60C990 100 1035 100 1080 60C1125 20 1170 20 1215 60C1260 100 1305 100 1350 60C1395 20 1440 20 1485 60V120H0V60Z" />
                </motion.svg>
              </div>
            </motion.div>

            {/* Layer 3: Dark Blue (Front/Bottom) */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-[#16527C]"
              initial={{ height: "0%" }}
              animate={{ height: `${waterHeight * 0.94}%` }}
              exit={{ height: "0%" }}
              transition={{ type: "spring", stiffness: 30, damping: 15, delay: 0.1 }}
            >
              <div className="absolute top-0 left-0 w-full -translate-y-[90%]">
                <motion.svg
                  viewBox="0 0 1440 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto text-[#16527C] fill-current"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <path d="M0 60C30 20 60 20 90 60C120 100 150 100 180 60C210 20 240 20 270 60C300 100 330 100 360 60C390 20 420 20 450 60C480 100 510 100 540 60C570 20 600 20 630 60C660 100 690 100 720 60C750 20 780 20 810 60C840 100 870 100 900 60C930 20 960 20 990 60C1020 100 1050 100 1080 60C1110 20 1140 20 1170 60C1200 100 1230 100 1260 60C1290 20 1320 20 1350 60C1380 100 1410 100 1440 60V120H0V60Z" />
                </motion.svg>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === "already_completed" && (
          <motion.div
            key="already_completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center text-white"
          >
            <Lock size={64} className="mb-8" />
            <h1 className="text-4xl md:text-6xl font-black mb-4">Challenge Completed!</h1>
            <p className="text-xl md:text-2xl font-bold mb-12 max-w-lg">
              You've already made your nemesis cry. The global tear count is still rising!
            </p>
            <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl border border-white/30 mb-12">
              <p className="text-3xl md:text-5xl font-black">
                {globalTears.toLocaleString()} / 1,000,000
              </p>
              <p className="text-sm uppercase tracking-widest mt-2 opacity-80">Global Tears Collected</p>
            </div>
            <button
              onClick={() => setStage("signup")}
              className="bg-[#FF6321] text-white py-4 px-12 rounded-full font-black text-2xl shadow-xl hover:scale-105 transition-transform"
            >
              Join the Spark
            </button>
          </motion.div>
        )}

        {stage === "selection" && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center">Choose your nemesis</h1>
            <div className="flex items-center gap-4 md:gap-8 max-w-6xl w-full justify-center">
              <button
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                id="prev-btn"
              >
                <ChevronLeft size={64} />
              </button>

              <div className="flex gap-4 md:gap-12 justify-center items-center">
                {NEMESES.map((nemesis) => (
                  <motion.div
                    key={nemesis.id}
                    className="cursor-pointer"
                    onClick={() => handleSelectNemesis(nemesis)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={nemesis.image}
                      alt={nemesis.name}
                      className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ))}
              </div>

              <button
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                id="next-btn"
              >
                <ChevronRight size={64} />
              </button>
            </div>
          </motion.div>
        )}

        {stage === "transition" && selectedNemesis && (
          <motion.div
            key="transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -inset-8 bg-[#FF6321] rounded-full blur-2xl opacity-50"
              />
              <img
                src={selectedNemesis.image}
                alt={selectedNemesis.name}
                className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-5xl md:text-7xl font-black mt-12 text-[#FF6321] italic uppercase tracking-tighter">
              Good to go!
            </h2>
          </motion.div>
        )}

        {stage === "game" && selectedNemesis && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center min-h-screen p-4 pt-12"
          >
            <div className="absolute top-4 left-4 font-mono font-bold text-xl">
              Score : {score}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-8">Make them cry!</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl w-full">
              {/* Left Slogans */}
              <div className="flex flex-col gap-4">
                {SLOGANS.slice(0, 5).map((slogan) => (
                  <button
                    key={slogan}
                    onClick={handleAddPoint}
                    className="bg-white hover:bg-[#FF6321] hover:text-white transition-all py-3 px-6 rounded-full font-bold shadow-md transform hover:-translate-y-1 active:translate-y-0"
                  >
                    {slogan}
                  </button>
                ))}
              </div>

              {/* Nemesis Center */}
              <div className="relative flex justify-center">
                <div className="relative">
                  <motion.img
                    key={score}
                    animate={{ 
                      scale: score > 0 ? [1, 1.05, 1] : 1,
                      x: score > 0 ? [0, -5, 5, -5, 5, 0] : 0,
                      filter: score > 0 ? "sepia(0.2) saturate(1.5)" : "none"
                    }}
                    transition={{ duration: 0.3 }}
                    src={selectedNemesis.image}
                    alt={selectedNemesis.name}
                    className="w-64 h-64 md:w-80 md:h-80 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Tears Animation */}
                  <AnimatePresence>
                    {tears.map((tear) => (
                      <motion.div
                        key={tear.id}
                        initial={{ opacity: 1, y: 40, x: tear.x }}
                        animate={{ opacity: 0, y: 300 }}
                        transition={{ duration: 1.5, ease: "easeIn" }}
                        className="absolute top-1/2 left-1/2 text-[#2584C6]"
                      >
                        <Droplets fill="currentColor" size={32} />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Floating +1 */}
                  <AnimatePresence>
                    {tears.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -50 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 right-0 text-3xl font-black text-[#2584C6]"
                      >
                        +1
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Slogans */}
              <div className="flex flex-col gap-4">
                {SLOGANS.slice(5).map((slogan) => (
                  <button
                    key={slogan}
                    onClick={handleAddPoint}
                    className="bg-white hover:bg-[#FF6321] hover:text-white transition-all py-3 px-6 rounded-full font-bold shadow-md transform hover:-translate-y-1 active:translate-y-0"
                  >
                    {slogan}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center"
          >
            <h1 className="text-6xl md:text-8xl font-black mb-2 text-[#333333]">Congrats!</h1>
            <p className="text-2xl md:text-4xl font-bold mb-12 text-[#333333]">You made them cry!</p>
            
            <div className="mb-8 text-white">
              <p className="text-2xl md:text-4xl font-bold mb-1">
                Tears so far: {globalTears.toLocaleString()} / 1,000,000
              </p>
              <p className="text-xs text-[#FF6321] font-bold uppercase tracking-tighter">(Global Accumulation)</p>
            </div>

            <div className="mb-12 text-white">
              <p className="text-2xl md:text-4xl font-bold leading-tight">
                Let’s hit 1 million tears<br />
                by the end of the EU term!
              </p>
            </div>

            <button
              onClick={() => setStage("signup")}
              className="bg-[#FF6321] text-white py-4 px-12 rounded-[2rem] font-black text-2xl shadow-xl hover:scale-105 transition-transform mb-12"
            >
              Get the Spark
            </button>

            <div className="max-w-md text-[#333333] font-bold text-sm leading-relaxed opacity-80">
              <p>The Spark is where radical ideas for a better world</p>
              <p>live, spread and evolve.</p>
            </div>
          </motion.div>
        )}

        {stage === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-white"
          >
            <div className="absolute top-8 right-8 flex flex-col items-center gap-2">
              <p className="font-bold uppercase text-xs tracking-widest">Invite a friend</p>
              <button className="bg-white text-[#2584C6] p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Share2 />
              </button>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-12">Sign up</h1>

            <form className="w-full max-w-md flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase tracking-widest opacity-80">Name</label>
                <input
                  type="text"
                  className="bg-white/10 border-2 border-white/30 rounded-lg p-4 focus:outline-none focus:border-white transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase tracking-widest opacity-80">Surname</label>
                <input
                  type="text"
                  className="bg-white/10 border-2 border-white/30 rounded-lg p-4 focus:outline-none focus:border-white transition-colors"
                  placeholder="Your surname"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase tracking-widest opacity-80">Email</label>
                <input
                  type="email"
                  className="bg-white/10 border-2 border-white/30 rounded-lg p-4 focus:outline-none focus:border-white transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex items-start gap-3 mt-4">
                <input type="checkbox" className="mt-1 w-5 h-5 rounded" id="opt-in" />
                <label htmlFor="opt-in" className="text-sm opacity-80 leading-relaxed">
                  I don't want to receive emails about Mailchimp and related Intuit product and feature updates, marketing best practices, and promotions from Mailchimp.
                </label>
              </div>

              <button
                type="submit"
                className="bg-[#FF6321] hover:bg-white hover:text-[#FF6321] text-white text-2xl font-black py-4 rounded-full shadow-xl transition-all mt-4 uppercase"
              >
                Sign up
              </button>

              <p className="text-xs opacity-60 text-center mt-4">
                By creating an account, you agree to our <span className="underline cursor-pointer">Terms</span> and have read and acknowledge the <span className="underline cursor-pointer">Global Privacy Statement</span>.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Floating Hearts/Tears */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "100vh", x: `${Math.random() * 100}vw` }}
            animate={{ y: "-10vh" }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute text-[#2584C6]"
          >
            <Droplets size={Math.random() * 24 + 12} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
