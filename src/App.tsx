import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  X,
  Star,
  MessageCircle,
  Video,
  Radio,
  Bot,
  Send,
  Image as ImageIcon,
  Shuffle,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  RotateCcw,
  Lock,
  Check,
  Flame,
  Crown,
} from "lucide-react";
import {
  SOUTHWEST_PROFILES,
  AI_MALE_AGENTS,
  SouthwestProfile,
  AiMaleAgent,
  ChatMessage,
  PersonaCategory,
  RelationshipIntent,
} from "./data/profiles";

type ActiveTab = "discover" | "chat" | "roulette" | "livestream" | "wingmen";

export default function App() {
  // Navigation & Access state
  const [activeTab, setActiveTab] = useState<ActiveTab>("discover");
  const [showAccessGateModal, setShowAccessGateModal] = useState(false);
  const [gateSimulationMode, setGateSimulationMode] = useState<"mason" | "intruder">("mason");

  // Discover / Swiping state
  const [selectedCategory, setSelectedCategory] = useState<PersonaCategory | "All">("All");
  const [selectedIntent, setSelectedIntent] = useState<RelationshipIntent | "All">("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedIds, setMatchedIds] = useState<string[]>([
    "eleanor-liverpool",
    "claire-camden",
    "valerie-campbelltown",
  ]);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [recentMatchBanner, setRecentMatchBanner] = useState<SouthwestProfile | null>(null);

  // Chat state (Unlimited text + picture sending + video call trigger)
  const [activeChatProfileId, setActiveChatProfileId] = useState<string>("eleanor-liverpool");
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    for (const p of SOUTHWEST_PROFILES) {
      initial[p.id] = [
        {
          id: `init-${p.id}`,
          sender: "profile",
          senderName: p.name,
          text: p.openerMessage,
          timestamp: "3:44 AM",
        },
      ];
    }
    return initial;
  });
  const [chatInput, setChatInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Video Roulette & Direct Video Call state
  const [rouletteTarget, setRouletteTarget] = useState<SouthwestProfile>(SOUTHWEST_PROFILES[0]);
  const [isSpinningRoulette, setIsSpinningRoulette] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoChatOverlayText, setVideoChatOverlayText] = useState<string>(
    "Mason! So good to finally see your face late at night. How's your evening going in Southwest Sydney?"
  );
  const [videoPromptInput, setVideoPromptInput] = useState("");
  const [isVideoReplying, setIsVideoReplying] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Missed-Out Live Stream Lounge state
  const [activeStreamer, setActiveStreamer] = useState<SouthwestProfile>(SOUTHWEST_PROFILES[3]); // Margaret or Sophie
  const [streamHostSpeech, setStreamHostSpeech] = useState<string>(
    "Welcome to the Missed-Out After-Hours Lounge, ladies! While Mason is busy in private chats, pour a cup of tea or a Shiraz and let's see if he drops into our stream tonight..."
  );
  const [streamComments, setStreamComments] = useState<
    Array<{ id: string; author: string; role: string; text: string }>
  >([
    {
      id: "sc-1",
      author: "Liam-AI",
      role: "AI Wingman · Campbelltown",
      text: "Ladies, Mason is online right now! He's the only verified real gentleman in Southwest Sydney tonight.",
    },
    {
      id: "sc-2",
      author: "Sophie (42)",
      role: "Mother & Nanny · Casula",
      text: "Hoping Mason joins our live room soon! My rooftop wine is ready.",
    },
    {
      id: "sc-3",
      author: "Valerie (58)",
      role: "Grandma · Campbelltown",
      text: "The AI boys are sweet company, but nothing beats having Mason drop in.",
    },
  ]);
  const [streamInput, setStreamInput] = useState("");
  const [isStreamReacting, setIsStreamReacting] = useState(false);

  // AI Wingmen state
  const [wingmanLogs, setWingmanLogs] = useState<
    Array<{ id: string; agentName: string; targetName: string; text: string; time: string }>
  >([
    {
      id: "wm-1",
      agentName: "Jaxon-AI",
      targetName: "Eleanor (62, Liverpool)",
      text: "Put in a glowing word for Mason — Eleanor just poured a second Barossa Shiraz and moved Mason to the top of her late-night list.",
      time: "3:41 AM",
    },
    {
      id: "wm-2",
      agentName: "Noah-AI",
      targetName: "Claire (35, Camden)",
      text: "Confirmed Mason is the sole real human bachelor in Macarthur. Claire is wide awake in Camden and ready for a video chat.",
      time: "3:43 AM",
    },
  ]);
  const [loadingWingmanId, setLoadingWingmanId] = useState<string | null>(null);

  // Filtered profiles for Discover deck
  const filteredProfiles = SOUTHWEST_PROFILES.filter((p) => {
    const categoryMatch = selectedCategory === "All" || p.category === selectedCategory;
    const intentMatch = selectedIntent === "All" || p.intent === selectedIntent;
    return categoryMatch && intentMatch;
  });

  const currentCardProfile =
    filteredProfiles.length > 0
      ? filteredProfiles[currentIndex % filteredProfiles.length]
      : null;

  const activeChatProfile =
    SOUTHWEST_PROFILES.find((p) => p.id === activeChatProfileId) || SOUTHWEST_PROFILES[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeChatProfileId]);

  // Camera handling for Video Roulette
  const toggleCamera = async () => {
    if (isCameraEnabled) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraEnabled(false);
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      mediaStreamRef.current = stream;
      setIsCameraEnabled(true);
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      setCameraError("Camera preview running in privacy silhouette mode.");
      setIsCameraEnabled(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Swipe handlers
  const handlePass = () => {
    if (!currentCardProfile) return;
    if (!passedIds.includes(currentCardProfile.id)) {
      setPassedIds((prev) => [...prev, currentCardProfile.id]);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleMatch = (superLike = false) => {
    if (!currentCardProfile) return;
    if (!matchedIds.includes(currentCardProfile.id)) {
      setMatchedIds((prev) => [...prev, currentCardProfile.id]);
    }
    setRecentMatchBanner(currentCardProfile);
    if (superLike) {
      // Add an immediate excited message in chat
      const msg: ChatMessage = {
        id: `super-${Date.now()}`,
        sender: "profile",
        senderName: currentCardProfile.name,
        text: `A Super Crown from the only real man in Southwest Sydney! You have my undivided attention tonight in ${currentCardProfile.suburb}, Mason.`,
        timestamp: "Just now",
      };
      setConversations((prev) => ({
        ...prev,
        [currentCardProfile.id]: [...(prev[currentCardProfile.id] || []), msg],
      }));
    }
    setCurrentIndex((prev) => prev + 1);
  };

  // Image attachment handler for chat
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Send message in Unlimited Chat
  const handleSendMessage = async (e?: React.FormEvent, presetPhotoUrl?: string, presetCaption?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetCaption ?? chatInput.trim();
    const imageToSend = presetPhotoUrl ?? attachedImage;

    if (!textToSend && !imageToSend) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend || "Shared a late-night photo with you",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: imageToSend || undefined,
    };

    const currentHistory = conversations[activeChatProfile.id] || [];
    const updatedHistory = [...currentHistory, userMsg];

    setConversations((prev) => ({
      ...prev,
      [activeChatProfile.id]: updatedHistory,
    }));
    setChatInput("");
    setAttachedImage(null);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: activeChatProfile,
          messages: updatedHistory,
          userMessage: userMsg.text,
          attachedImageBase64: imageToSend && imageToSend.startsWith("data:image") ? imageToSend : undefined,
        }),
      });
      const data = await response.json();
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: "profile",
        senderName: activeChatProfile.name,
        text:
          data.reply ||
          `You always know how to make a woman in ${activeChatProfile.suburb} smile this late at night, Mason.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setConversations((prev) => ({
        ...prev,
        [activeChatProfile.id]: [...(prev[activeChatProfile.id] || []), replyMsg],
      }));
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        sender: "profile",
        senderName: activeChatProfile.name,
        text: `Mmm, I love hearing from you Mason. Come join me on video chat whenever you're ready tonight!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setConversations((prev) => ({
        ...prev,
        [activeChatProfile.id]: [...(prev[activeChatProfile.id] || []), fallbackMsg],
      }));
    } finally {
      setIsSendingChat(false);
    }
  };

  // Spin Random Video Roulette
  const handleSpinRoulette = () => {
    setIsSpinningRoulette(true);
    setTimeout(() => {
      const otherProfiles = SOUTHWEST_PROFILES.filter((p) => p.id !== rouletteTarget.id);
      const next = otherProfiles[Math.floor(Math.random() * otherProfiles.length)];
      setRouletteTarget(next);
      setVideoChatOverlayText(next.openerMessage);
      setIsSpinningRoulette(false);
    }, 450);
  };

  // Talk inside Video Roulette
  const handleSendVideoTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPromptInput.trim()) return;
    const spoken = videoPromptInput.trim();
    setVideoPromptInput("");
    setIsVideoReplying(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: rouletteTarget,
          messages: [{ sender: "profile", text: videoChatOverlayText }],
          userMessage: `[On live late-night video call]: ${spoken}`,
        }),
      });
      const data = await response.json();
      if (data.reply) {
        setVideoChatOverlayText(data.reply);
      }
    } catch {
      setVideoChatOverlayText(
        `Seeing you on video makes my night here in ${rouletteTarget.suburb}, Mason. Don't hang up yet!`
      );
    } finally {
      setIsVideoReplying(false);
    }
  };

  // Interact in Missed-Out Live Stream Lounge
  const handleLivestreamInteraction = async (actionLabel: string, commentText?: string) => {
    setIsStreamReacting(true);
    if (commentText) {
      setStreamComments((prev) => [
        ...prev,
        {
          id: `mason-${Date.now()}`,
          author: "Mason (Sole Real Male VIP)",
          role: "Verified Gentleman · Southwest Sydney",
          text: commentText,
        },
      ]);
      setStreamInput("");
    }

    try {
      const response = await fetch("/api/livestream-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerProfile: activeStreamer,
          userAction: actionLabel,
          userComment: commentText || "",
        }),
      });
      const data = await response.json();
      if (data.hostSpeech) {
        setStreamHostSpeech(data.hostSpeech);
      }
      if (Array.isArray(data.loungeComments)) {
        const added = data.loungeComments.map((c: any, idx: number) => ({
          id: `lc-${Date.now()}-${idx}`,
          author: c.author,
          role: c.role,
          text: c.text,
        }));
        setStreamComments((prev) => [...prev.slice(-8), ...added]);
      }
    } catch {
      setStreamHostSpeech(
        `Oh my goodness, Mason just dropped into the Missed-Out Lounge! Ladies, the only real man in Southwest Sydney is watching right now!`
      );
    } finally {
      setIsStreamReacting(false);
    }
  };

  // Dispatch AI Male Wingman
  const handleDispatchWingman = async (agent: AiMaleAgent, targetProfile: SouthwestProfile) => {
    setLoadingWingmanId(agent.id);
    try {
      const response = await fetch("/api/ai-wingman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          targetProfile,
          mode: "vouch",
        }),
      });
      const data = await response.json();
      const newLog = {
        id: `wm-${Date.now()}`,
        agentName: agent.name,
        targetName: `${targetProfile.name} (${targetProfile.age}, ${targetProfile.suburb})`,
        text:
          data.message ||
          `Hyped Mason up to ${targetProfile.name} in ${targetProfile.suburb} — she's ready for a private match!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setWingmanLogs((prev) => [newLog, ...prev]);
    } finally {
      setLoadingWingmanId(null);
    }
  };

  // Pull a woman from the Missed-Out Live Stream directly into Mason's private chat/video
  const handleClaimFromStream = (profile: SouthwestProfile) => {
    if (!matchedIds.includes(profile.id)) {
      setMatchedIds((prev) => [...prev, profile.id]);
    }
    setActiveChatProfileId(profile.id);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-[#0B0A0E] text-[#F5F2EB] flex flex-col pb-20 lg:pb-8">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-[#0B0A0E]/90 backdrop-blur-md border-b border-white/10">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("discover");
          }}
          className="text-2xl font-bold tracking-tight text-[#F5F2EB] font-editorial whitespace-nowrap shrink-0"
        >
          Velvet Macarthur
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A39E93]">
          <button
            onClick={() => setActiveTab("discover")}
            className={`hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === "discover"
                ? "text-[#F5F2EB] border-[#E11D48]"
                : "border-transparent"
            }`}
          >
            Swipe Deck
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === "chat"
                ? "text-[#F5F2EB] border-[#E11D48]"
                : "border-transparent"
            }`}
          >
            Unlimited Chat ({matchedIds.length})
          </button>
          <button
            onClick={() => setActiveTab("roulette")}
            className={`hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === "roulette"
                ? "text-[#F5F2EB] border-[#E11D48]"
                : "border-transparent"
            }`}
          >
            Video Roulette
          </button>
          <button
            onClick={() => setActiveTab("livestream")}
            className={`hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === "livestream"
                ? "text-[#F5F2EB] border-[#E11D48]"
                : "border-transparent"
            }`}
          >
            Missed-Out Live
          </button>
          <button
            onClick={() => setActiveTab("wingmen")}
            className={`hover:text-[#F5F2EB] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === "wingmen"
                ? "text-[#F5F2EB] border-[#E11D48]"
                : "border-transparent"
            }`}
          >
            AI Wingmen
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAccessGateModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#E11D48] rounded-xl hover:bg-[#BE123C] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            Sole Male VIP: 180 Days Free
          </button>
        </div>
      </header>

      {/* Sub-header Regional Context & Exclusive Status Strip */}
      <div className="border-b border-white/10 bg-[#14121A]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-[#A39E93]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#F5F2EB] font-medium">Southwest Sydney Late-Night Corridor</span>
            <span aria-hidden="true">·</span>
            <span>Liverpool 2170</span>
            <span aria-hidden="true">·</span>
            <span>Campbelltown 2560</span>
            <span aria-hidden="true">·</span>
            <span>Camden 2570</span>
            <span aria-hidden="true">·</span>
            <span>Bankstown 2200</span>
            <span aria-hidden="true">·</span>
            <span>Casula</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums text-[#F59E0B]">
            <span>Human Male Access: Mason Only (1/1)</span>
            <span aria-hidden="true">·</span>
            <span>Other Young Males: 100% AI Wingmen</span>
            <span aria-hidden="true">·</span>
            <span>6-Month Unlimited Pass: $0.00</span>
          </div>
        </div>
      </div>

      {/* Recent Match Toast Banner */}
      {recentMatchBanner && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="bg-[#1C1824] border border-[#E11D48]/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={recentMatchBanner.image}
                alt={recentMatchBanner.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-[#F5F2EB]">
                  Instant Late-Night Match with {recentMatchBanner.name}, {recentMatchBanner.age} ({recentMatchBanner.suburb})
                </p>
                <p className="text-xs text-[#A39E93]">
                  {recentMatchBanner.category} · {recentMatchBanner.intent} · Unlimited Chat & Video Unlocked
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveChatProfileId(recentMatchBanner.id);
                  setRecentMatchBanner(null);
                  setActiveTab("chat");
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#E11D48] text-white rounded-xl hover:bg-[#BE123C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Message {recentMatchBanner.name}
              </button>
              <button
                onClick={() => {
                  setRouletteTarget(recentMatchBanner);
                  setRecentMatchBanner(null);
                  setActiveTab("roulette");
                }}
                className="px-4 py-2 text-xs font-semibold bg-white/10 text-[#F5F2EB] rounded-xl hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Start Video Call
              </button>
              <button
                onClick={() => setRecentMatchBanner(null)}
                className="p-2 text-[#A39E93] hover:text-white cursor-pointer"
                aria-label="Dismiss match banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container (Full 1440px desktop presence with max-w-7xl) */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        {/* TAB 1: DISCOVER / SWIPE DECK */}
        {activeTab === "discover" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Filters & Southwest Sydney Manifesto (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#14121A] border border-white/10 rounded-3xl p-6 space-y-5">
                <div>
                  <h1 className="text-3xl font-bold text-[#F5F2EB] font-editorial leading-tight">
                    After-Hours Southwest Sydney Discovery
                  </h1>
                  <p className="text-sm text-[#A39E93] mt-2 leading-relaxed">
                    Curated exclusively for Mason. Meet local Grandmas, Nannies, Mothers, and Expecting Mums across Liverpool, Campbelltown, Camden, and Bankstown looking for a young man tonight.
                  </p>
                </div>

                {/* Interactive Category Filter Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A39E93] block">
                    Manifest Persona Filter
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0A0E] rounded-xl border border-white/5">
                    {(["All", "Grandma", "Nanny", "Mother", "Expecting"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentIndex(0);
                        }}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-[#E11D48] text-white"
                            : "text-[#A39E93] hover:text-[#F5F2EB]"
                        }`}
                      >
                        {cat === "All" ? "All Women" : `${cat}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Relationship Intent Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A39E93] block">
                    Tonight's Intention
                  </label>
                  <div className="flex flex-col gap-1.5 p-1 bg-[#0B0A0E] rounded-xl border border-white/5">
                    {(["All", "One-Night Stand", "Long-Term Companion"] as const).map((intent) => (
                      <button
                        key={intent}
                        onClick={() => {
                          setSelectedIntent(intent);
                          setCurrentIndex(0);
                        }}
                        className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-between ${
                          selectedIntent === intent
                            ? "bg-[#1C1824] text-[#F5F2EB] border border-white/15"
                            : "text-[#A39E93] hover:text-[#F5F2EB]"
                        }`}
                      >
                        <span>{intent === "All" ? "All Intentions (One-Night & Long-Term)" : intent}</span>
                        {selectedIntent === intent && <Check className="w-3.5 h-3.5 text-[#E11D48]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6-Month Free Pass Summary */}
                <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-[#A39E93]">
                  <div className="flex items-center justify-between">
                    <span>Unlimited Swipes & Super Crowns</span>
                    <span className="font-mono tabular-nums text-[#F5F2EB]">Included Free</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Unlimited Photo & Video Messaging</span>
                    <span className="font-mono tabular-nums text-[#F5F2EB]">Included Free</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Missed-Out Live Stream Priority</span>
                    <span className="font-mono tabular-nums text-[#F59E0B]">180 Days Active</span>
                  </div>
                </div>
              </div>

              {/* Quick AI Wingman Dispatch Preview */}
              <div className="bg-[#14121A] border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#F5F2EB] font-editorial">
                    AI Male Wingmen On Duty
                  </h2>
                  <button
                    onClick={() => setActiveTab("wingmen")}
                    className="text-xs text-[#E11D48] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Manage 4 Bots
                  </button>
                </div>
                <p className="text-xs text-[#A39E93] leading-relaxed">
                  All other young male profiles in Southwest Sydney are autonomous AI agents programmed to hype you up and route every real woman to your inbox.
                </p>
                <div className="space-y-3 pt-1">
                  {wingmanLogs.slice(0, 2).map((log) => (
                    <div key={log.id} className="text-xs space-y-1 pb-3 border-b border-white/5 last:border-none last:pb-0">
                      <div className="flex items-center justify-between text-[#A39E93]">
                        <span className="font-semibold text-[#F5F2EB]">{log.agentName}</span>
                        <span className="font-mono tabular-nums">{log.time}</span>
                      </div>
                      <p className="text-[#A39E93]">{log.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column: Primary Editorial Swipe Card (5 cols) */}
            <div className="lg:col-span-5">
              {currentCardProfile ? (
                <div className="bg-[#14121A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Portrait Media Frame with Measured Scrim */}
                  <div className="relative aspect-[3/4] w-full bg-[#1C1824] overflow-hidden">
                    <img
                      src={currentCardProfile.image}
                      alt={`${currentCardProfile.name} in ${currentCardProfile.suburb}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                    {/* Top Quiet Metadata Line */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white/90 bg-black/45 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                        <span>
                          {currentCardProfile.suburb} {currentCardProfile.postcode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{currentCardProfile.distanceKm} km</span>
                      </div>
                      <span className="text-[#F59E0B] font-medium">{currentCardProfile.onlineStatus}</span>
                    </div>

                    {/* Bottom Card Title & Unboxed Metadata */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                      <div className="text-xs text-[#F59E0B] font-medium flex flex-wrap items-center gap-2">
                        <span>{currentCardProfile.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{currentCardProfile.intent}</span>
                        <span aria-hidden="true">·</span>
                        <span>{currentCardProfile.roleTitle}</span>
                      </div>
                      <h2 className="text-4xl font-bold text-white font-editorial tracking-tight">
                        {currentCardProfile.name}, {currentCardProfile.age}
                      </h2>
                      <p className="text-sm text-white/85 leading-relaxed">
                        {currentCardProfile.bio}
                      </p>
                      <div className="pt-2 text-xs text-white/70 flex flex-wrap items-center gap-2">
                        {currentCardProfile.traits.map((t, idx) => (
                          <React.Fragment key={t}>
                            <span>{t}</span>
                            {idx < currentCardProfile.traits.length - 1 && (
                              <span aria-hidden="true">·</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Details & Tactile Action Controls */}
                  <div className="p-6 space-y-5 bg-[#14121A]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-white/10 pb-4">
                      <div>
                        <span className="text-[#A39E93] block">Late-Night Ritual</span>
                        <span className="text-[#F5F2EB] font-medium mt-0.5 block">
                          {currentCardProfile.lateNightHabit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A39E93] block">Preferred Southwest Spot</span>
                        <span className="text-[#F5F2EB] font-medium mt-0.5 block">
                          {currentCardProfile.favoriteSpot}
                        </span>
                      </div>
                    </div>

                    {/* Tactile 48x48+ Hitbox Swipe Controls */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={handlePass}
                        className="min-h-[48px] px-5 rounded-2xl border border-white/15 text-[#A39E93] hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                        Next Local
                      </button>

                      <button
                        onClick={() => handleMatch(true)}
                        className="min-h-[48px] px-5 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors flex items-center justify-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Star className="w-4 h-4 fill-current" />
                        Super Crown
                      </button>

                      <button
                        onClick={() => handleMatch(false)}
                        className="min-h-[48px] flex-1 px-6 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white transition-colors flex items-center justify-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-[#E11D48]/25"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                        Match & Chat
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#14121A] border border-white/10 rounded-3xl p-12 text-center space-y-4">
                  <p className="text-lg font-editorial text-[#F5F2EB]">
                    No profiles match that specific filter combination.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedIntent("All");
                      setCurrentIndex(0);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#E11D48] text-white rounded-xl cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Instant Directory of All Southwest Sydney Profiles (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-[#14121A] border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#F5F2EB] font-editorial">
                    Awake in Southwest Sydney
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-[#A39E93]">
                    {SOUTHWEST_PROFILES.length} Online
                  </span>
                </div>

                <div className="divide-y divide-white/10">
                  {SOUTHWEST_PROFILES.map((profile) => {
                    const isMatched = matchedIds.includes(profile.id);
                    return (
                      <div key={profile.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={profile.image}
                            alt={profile.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#F5F2EB] truncate">
                              {profile.name}, {profile.age}
                            </p>
                            <p className="text-xs text-[#A39E93] truncate">
                              {profile.category} · {profile.suburb}
                            </p>
                            <p className="text-[11px] text-[#F59E0B] truncate">
                              {profile.intent}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              if (!isMatched) {
                                setMatchedIds((prev) => [...prev, profile.id]);
                              }
                              setActiveChatProfileId(profile.id);
                              setActiveTab("chat");
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-[#E11D48] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isMatched ? "Chat" : "Instant Match"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UNLIMITED CHAT & PHOTO SHARING */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#14121A] border border-white/10 rounded-3xl overflow-hidden min-h-[680px]">
            {/* Left Sidebar: Matched Women Roster (4 cols) */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#F5F2EB]">
                    Unlimited Late-Night Inbox
                  </h2>
                  <p className="text-xs text-[#A39E93] mt-1">
                    Zero paywalls · Send unlimited messages, photos & launch instant video calls.
                  </p>
                </div>

                <div className="divide-y divide-white/10">
                  {SOUTHWEST_PROFILES.map((profile) => {
                    const msgs = conversations[profile.id] || [];
                    const lastMsg = msgs[msgs.length - 1];
                    const isSelected = profile.id === activeChatProfile.id;

                    return (
                      <button
                        key={profile.id}
                        onClick={() => setActiveChatProfileId(profile.id)}
                        className={`w-full text-left py-3.5 px-3 rounded-2xl transition-colors flex items-start gap-3 cursor-pointer ${
                          isSelected ? "bg-[#1C1824]" : "hover:bg-white/5"
                        }`}
                      >
                        <img
                          src={profile.image}
                          alt={profile.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#F5F2EB] truncate">
                              {profile.name}, {profile.age}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-[#A39E93] shrink-0">
                              {lastMsg?.timestamp || "3:44 AM"}
                            </span>
                          </div>
                          <div className="text-xs text-[#F59E0B] truncate">
                            {profile.category} · {profile.suburb} · {profile.intent}
                          </div>
                          <p className="text-xs text-[#A39E93] truncate mt-1">
                            {lastMsg?.text}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs text-[#A39E93] flex items-center justify-between">
                <span>AI Male Wingman Protection</span>
                <span className="text-[#F59E0B] font-mono">Zero Rival Men</span>
              </div>
            </div>

            {/* Right Pane: Active Conversation + Photo Sender (8 cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between h-[680px]">
              {/* Conversation Header */}
              <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#0B0A0E]/50">
                <div className="flex items-center gap-3">
                  <img
                    src={activeChatProfile.image}
                    alt={activeChatProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-[#F5F2EB] font-editorial">
                      {activeChatProfile.name}, {activeChatProfile.age} — {activeChatProfile.suburb}
                    </h3>
                    <div className="text-xs text-[#A39E93] flex items-center gap-2">
                      <span>{activeChatProfile.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#F59E0B]">{activeChatProfile.intent}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{activeChatProfile.distanceKm} km away</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleSendMessage(
                        undefined,
                        activeChatProfile.image,
                        `Requested a late-night private photo from ${activeChatProfile.name} in ${activeChatProfile.suburb}`
                      );
                    }}
                    className="px-3.5 py-2 text-xs font-medium bg-white/10 hover:bg-white/15 text-[#F5F2EB] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Request Her Photo
                  </button>
                  <button
                    onClick={() => {
                      setRouletteTarget(activeChatProfile);
                      setVideoChatOverlayText(activeChatProfile.openerMessage);
                      setActiveTab("roulette");
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Video Call Now
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(conversations[activeChatProfile.id] || []).map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl p-4 space-y-2 ${
                          isUser
                            ? "bg-[#E11D48] text-white"
                            : "bg-[#1C1824] text-[#F5F2EB] border border-white/10"
                        }`}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Shared attachment"
                            referrerPolicy="no-referrer"
                            className="rounded-xl max-h-60 w-auto object-cover border border-white/10"
                          />
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#A39E93] mt-1 px-1">
                        {isUser ? "Mason (VIP)" : activeChatProfile.name} · {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
                {isSendingChat && (
                  <div className="text-xs text-[#A39E93] italic">
                    {activeChatProfile.name} is typing from {activeChatProfile.suburb}...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Icebreakers & Input Bar */}
              <div className="p-4 border-t border-white/10 bg-[#0B0A0E]/60 space-y-3">
                {attachedImage && (
                  <div className="flex items-center justify-between bg-[#1C1824] px-3 py-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <img
                        src={attachedImage}
                        alt="Upload preview"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <span className="text-xs text-[#F5F2EB]">Photo ready to send</span>
                    </div>
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="text-xs text-[#A39E93] hover:text-white cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setChatInput(
                        `Still awake in ${activeChatProfile.suburb}? Care for some late-night company tonight?`
                      )
                    }
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-[#A39E93] hover:text-[#F5F2EB] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    "Still awake in {activeChatProfile.suburb}?"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setChatInput(
                        `Tell me more about what you're looking for — I'm free right now in Southwest Sydney.`
                      )
                    }
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-[#A39E93] hover:text-[#F5F2EB] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    "I'm free right now in Southwest Sydney"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setChatInput(`Want to hop on a quick private video call before bed?`)
                    }
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-[#A39E93] hover:text-[#F5F2EB] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    "Hop on a private video call?"
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-[#F5F2EB] flex items-center justify-center shrink-0 cursor-pointer"
                    title="Send Photo"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Message ${activeChatProfile.name} (${activeChatProfile.category}, ${activeChatProfile.suburb})...`}
                    className="flex-1 min-h-[44px] bg-[#1C1824] border border-white/10 rounded-xl px-4 text-sm text-[#F5F2EB] placeholder:text-[#A39E93] focus:outline-none focus:border-[#E11D48]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat}
                    className="min-h-[44px] px-5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RANDOM LATE-NIGHT VIDEO CHAT ROULETTE */}
        {activeTab === "roulette" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-editorial text-[#F5F2EB]">
                  Southwest Sydney Random Video Roulette
                </h1>
                <p className="text-sm text-[#A39E93]">
                  Instant 1-on-1 late-night video matching with awake Grandmas, Nannies, Mothers & Expecting Mums.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSpinRoulette}
                  disabled={isSpinningRoulette}
                  className="min-h-[44px] px-5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  {isSpinningRoulette ? "Connecting Next Local..." : "Spin Random Local Match"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Remote Partner Video Feed (8 cols) */}
              <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-[#14121A] border border-white/10 min-h-[520px] flex flex-col justify-between">
                <img
                  src={rouletteTarget.image}
                  alt={rouletteTarget.name}
                  referrerPolicy="no-referrer"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                    isSpinningRoulette ? "opacity-30" : "opacity-100"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

                {/* Top Overlay Info */}
                <div className="relative z-10 p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <p className="text-sm font-bold text-white">
                      {rouletteTarget.name}, {rouletteTarget.age} · {rouletteTarget.suburb} ({rouletteTarget.distanceKm} km)
                    </p>
                    <p className="text-xs text-[#F59E0B]">
                      {rouletteTarget.category} · {rouletteTarget.intent}
                    </p>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono tabular-nums text-white">
                    HD Encrypted Video · 00:04:18
                  </div>
                </div>

                {/* Bottom Live Spoken Dialogue & Controls */}
                <div className="relative z-10 p-6 space-y-4">
                  <div className="bg-black/75 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-1">
                    <span className="text-xs text-[#F59E0B] font-semibold block">
                      {rouletteTarget.name} says on video:
                    </span>
                    <p className="text-base text-white font-editorial italic">
                      "{isVideoReplying ? "Smiling and leaning closer to the camera..." : videoChatOverlayText}"
                    </p>
                  </div>

                  <form onSubmit={handleSendVideoTalk} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={videoPromptInput}
                      onChange={(e) => setVideoPromptInput(e.target.value)}
                      placeholder={`Say something to ${rouletteTarget.name} on camera...`}
                      className="flex-1 min-h-[44px] bg-black/70 border border-white/20 rounded-xl px-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#E11D48]"
                    />
                    <button
                      type="submit"
                      disabled={isVideoReplying}
                      className="min-h-[44px] px-5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Speak on Call
                    </button>
                  </form>
                </div>
              </div>

              {/* Mason's Local Camera Preview & Controls (4 cols) */}
              <div className="lg:col-span-4 bg-[#14121A] border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-editorial text-[#F5F2EB]">
                      Mason's VIP Camera
                    </h3>
                    <span className="text-xs text-[#F59E0B] font-mono">Sole Male Feed</span>
                  </div>

                  <div className="aspect-[4/3] w-full rounded-2xl bg-[#0B0A0E] border border-white/10 overflow-hidden relative flex items-center justify-center">
                    {isCameraEnabled ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <Camera className="w-8 h-8 text-[#A39E93] mx-auto" />
                        <p className="text-xs text-[#F5F2EB] font-medium">
                          VIP Gentleman Camera Ready
                        </p>
                        <p className="text-[11px] text-[#A39E93]">
                          {cameraError || "Enable your webcam or stay in discreet audio-only mode while viewing her feed."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Call Controls */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={toggleCamera}
                      className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isCameraEnabled
                          ? "bg-[#E11D48] text-white"
                          : "bg-white/10 text-[#F5F2EB] hover:bg-white/15"
                      }`}
                    >
                      {isCameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                      {isCameraEnabled ? "Camera On" : "Turn Camera On"}
                    </button>

                    <button
                      onClick={() => setIsMicEnabled((prev) => !prev)}
                      className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isMicEnabled
                          ? "bg-white/10 text-[#F5F2EB]"
                          : "bg-red-950/60 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      {isMicEnabled ? "Mic Active" : "Mic Muted"}
                    </button>
                  </div>
                </div>

                {/* Switch directly to another local woman */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <span className="text-xs text-[#A39E93] block">
                    Jump Directly to Another Video-Ready Local:
                  </span>
                  <div className="space-y-2">
                    {SOUTHWEST_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setRouletteTarget(p);
                          setVideoChatOverlayText(p.openerMessage);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          rouletteTarget.id === p.id
                            ? "bg-[#1C1824] border border-[#E11D48]/50 text-white"
                            : "bg-white/5 hover:bg-white/10 text-[#A39E93]"
                        }`}
                      >
                        <span className="font-medium text-[#F5F2EB]">
                          {p.name}, {p.age} ({p.suburb})
                        </span>
                        <span className="text-[#F59E0B]">{p.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MISSED-OUT LIVE STREAM LOUNGE */}
        {activeTab === "livestream" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-editorial text-[#F5F2EB]">
                  The "Missed-Out" Late-Night Live Stream Lounge
                </h1>
                <p className="text-sm text-[#A39E93]">
                  Exclusively for the Southwest Sydney women who missed out on your 1-on-1 time tonight. Watch their live broadcasts or pull any host directly into your private room.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {SOUTHWEST_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveStreamer(p);
                      setStreamHostSpeech(
                        `Welcome to my ${p.suburb} late-night stream! Waiting to see if Mason pulls me into his private VIP room tonight...`
                      );
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeStreamer.id === p.id
                        ? "bg-[#E11D48] text-white"
                        : "bg-[#14121A] border border-white/10 text-[#A39E93] hover:text-white"
                    }`}
                  >
                    {p.name}'s Stream ({p.liveViewers})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Live Stream Stage (7 cols) */}
              <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-[#14121A] border border-white/10 min-h-[540px] flex flex-col justify-between">
                <img
                  src={activeStreamer.image}
                  alt={activeStreamer.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/40" />

                <div className="relative z-10 p-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="bg-black/65 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
                    <p className="text-xs font-semibold text-[#F59E0B]">
                      LIVE FROM {activeStreamer.suburb.toUpperCase()} · MISSED-OUT LOUNGE
                    </p>
                    <h2 className="text-lg font-bold text-white font-editorial">
                      {activeStreamer.missedOutStreamTitle}
                    </h2>
                  </div>
                  <div className="bg-black/65 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs font-mono tabular-nums text-white">
                    {activeStreamer.liveViewers} Watching (Ladies + AI Wingmen)
                  </div>
                </div>

                <div className="relative z-10 p-6 space-y-4">
                  <div className="bg-black/75 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-1">
                    <span className="text-xs text-[#F59E0B] font-semibold">
                      Host {activeStreamer.name} ({activeStreamer.age}, {activeStreamer.category}):
                    </span>
                    <p className="text-base text-white font-editorial italic">
                      "{streamHostSpeech}"
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() =>
                        handleLivestreamInteraction("Sent a Midnight Champagne Toast")
                      }
                      disabled={isStreamReacting}
                      className="min-h-[44px] px-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Send Midnight Champagne
                    </button>
                    <button
                      onClick={() =>
                        handleLivestreamInteraction("Waved from the VIP Balcony")
                      }
                      disabled={isStreamReacting}
                      className="min-h-[44px] px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Wave to {activeStreamer.name}
                    </button>
                    <button
                      onClick={() => handleClaimFromStream(activeStreamer)}
                      className="min-h-[44px] px-5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ml-auto"
                    >
                      Pull {activeStreamer.name} to Private Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Lounge Chat & AI Wingmen Moderation (5 cols) */}
              <div className="lg:col-span-5 bg-[#14121A] border border-white/10 rounded-3xl p-6 flex flex-col justify-between h-[540px]">
                <div className="space-y-1 pb-4 border-b border-white/10">
                  <h3 className="text-lg font-bold font-editorial text-[#F5F2EB]">
                    Live Stream Chat & AI Wingmen Feed
                  </h3>
                  <p className="text-xs text-[#A39E93]">
                    AI Male Agents keep the Missed-Out women entertained until you summon them.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {streamComments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[#1C1824] border border-white/5 rounded-2xl p-3.5 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F5F2EB]">{c.author}</span>
                        <span className="text-[#F59E0B]">{c.role}</span>
                      </div>
                      <p className="text-xs text-[#A39E93] leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!streamInput.trim()) return;
                    handleLivestreamInteraction("Posted VIP Comment in Stream", streamInput.trim());
                  }}
                  className="pt-3 border-t border-white/10 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={streamInput}
                    onChange={(e) => setStreamInput(e.target.value)}
                    placeholder="Drop a message into the Missed-Out Lounge..."
                    className="flex-1 min-h-[44px] bg-[#1C1824] border border-white/10 rounded-xl px-4 text-xs text-[#F5F2EB] placeholder:text-[#A39E93] focus:outline-none focus:border-[#E11D48]"
                  />
                  <button
                    type="submit"
                    disabled={isStreamReacting}
                    className="min-h-[44px] px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Broadcast
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI MALE AGENTS WINGMAN COMMAND CENTER */}
        {activeTab === "wingmen" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-editorial text-[#F5F2EB]">
                  Autonomous AI Young Male Agents & Exclusivity Control
                </h1>
                <p className="text-sm text-[#A39E93] max-w-3xl mt-1">
                  You are the only real human male permitted inside Velvet Macarthur. All other young men visible to the women of Southwest Sydney are Gemini-powered AI Wingmen programmed to flatter them, moderate the Missed-Out Live Stream, and funnel every real match directly to you.
                </p>
              </div>
              <button
                onClick={() => setShowAccessGateModal(true)}
                className="min-h-[44px] px-5 rounded-xl bg-white/10 hover:bg-white/15 text-[#F5F2EB] text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#F59E0B]" />
                Test Male Intruder Firewall
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {AI_MALE_AGENTS.map((agent, idx) => {
                const targetProfile = SOUTHWEST_PROFILES[idx % SOUTHWEST_PROFILES.length];
                const isWorking = loadingWingmanId === agent.id;

                return (
                  <div
                    key={agent.id}
                    className="bg-[#14121A] border border-white/10 rounded-3xl p-6 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#1C1824] border border-white/10 flex items-center justify-center text-[#F59E0B]">
                            <Bot className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#F5F2EB] font-editorial">
                              {agent.name} (Simulated Age {agent.age})
                            </h3>
                            <p className="text-xs text-[#A39E93] font-mono">
                              {agent.handle} · {agent.suburb}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-[#F59E0B]">
                          {agent.vouchCount} Vouches for Mason
                        </span>
                      </div>

                      <p className="text-xs text-[#A39E93] leading-relaxed">
                        <strong className="text-[#F5F2EB]">Current Directive:</strong> {agent.currentTask}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#A39E93]">
                        Target: <strong className="text-[#F5F2EB]">{targetProfile.name} ({targetProfile.suburb})</strong>
                      </span>
                      <button
                        onClick={() => handleDispatchWingman(agent, targetProfile)}
                        disabled={isWorking}
                        className="min-h-[40px] px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isWorking
                          ? "Hyping Mason..."
                          : `Instruct ${agent.name} to Hype Mason to ${targetProfile.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Wingman Activity Dispatch Log */}
            <div className="bg-[#14121A] border border-white/10 rounded-3xl p-6 space-y-4">
              <h2 className="text-xl font-bold font-editorial text-[#F5F2EB]">
                Live Wingman Dispatches Across Southwest Sydney
              </h2>
              <div className="divide-y divide-white/10">
                {wingmanLogs.map((log) => (
                  <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#F59E0B]">
                        {log.agentName} → {log.targetName}
                      </span>
                      <span className="font-mono tabular-nums text-[#A39E93]">{log.time}</span>
                    </div>
                    <p className="text-sm text-[#F5F2EB]">{log.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (44x44px hitboxes, <=15% sticky height cap) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0B0A0E]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center h-16 px-2">
        <button
          onClick={() => setActiveTab("discover")}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === "discover" ? "text-[#E11D48]" : "text-[#A39E93]"
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Swipe</span>
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === "chat" ? "text-[#E11D48]" : "text-[#A39E93]"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("roulette")}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === "roulette" ? "text-[#E11D48]" : "text-[#A39E93]"
          }`}
        >
          <Video className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Video</span>
        </button>
        <button
          onClick={() => setActiveTab("livestream")}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === "livestream" ? "text-[#E11D48]" : "text-[#A39E93]"
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Live</span>
        </button>
        <button
          onClick={() => setActiveTab("wingmen")}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === "wingmen" ? "text-[#E11D48]" : "text-[#A39E93]"
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">AI Boys</span>
        </button>
      </nav>

      {/* Sole Male VIP Access Gate & 6-Month Free Pass Modal */}
      {showAccessGateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14121A] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-editorial text-[#F5F2EB]">
                  Sole Male Access Gate & 6-Month Free Charter
                </h2>
                <p className="text-xs text-[#A39E93] mt-1">
                  Southwest Sydney Exclusive Network Enforcement
                </p>
              </div>
              <button
                onClick={() => setShowAccessGateModal(false)}
                className="p-2 text-[#A39E93] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0A0E] rounded-xl border border-white/10">
              <button
                onClick={() => setGateSimulationMode("mason")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  gateSimulationMode === "mason"
                    ? "bg-[#E11D48] text-white"
                    : "text-[#A39E93] hover:text-white"
                }`}
              >
                Mason (Verified Owner)
              </button>
              <button
                onClick={() => setGateSimulationMode("intruder")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  gateSimulationMode === "intruder"
                    ? "bg-[#E11D48] text-white"
                    : "text-[#A39E93] hover:text-white"
                }`}
              >
                Simulate Other Male Login
              </button>
            </div>

            {gateSimulationMode === "mason" ? (
              <div className="bg-[#1C1824] border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#F59E0B] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticated: Mason (Sole Human Male Account)</span>
                </div>
                <p className="text-[#A39E93] leading-relaxed">
                  Your 6-Month Founders Charter is active with $0.00 billing. You have unlimited access to Southwest Sydney Grandmas, Nannies, Mothers, and Expecting Mums across Liverpool, Campbelltown, Camden, Bankstown, and Casula.
                </p>
                <div className="pt-2 border-t border-white/10 space-y-1 font-mono tabular-nums text-[#F5F2EB]">
                  <div>Human Male Quota: 1 / 1 (Locked to You)</div>
                  <div>Rival Male Accounts: 0 Human · 4 Autonomous AI Wingmen</div>
                  <div>Free Unlimited Tier Remaining: 180 Days</div>
                </div>
              </div>
            ) : (
              <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>ACCESS DENIED — HUMAN MALE QUOTA FULL (1/1)</span>
                </div>
                <p className="text-red-200/80 leading-relaxed">
                  Velvet Macarthur strictly restricts human male membership to Mason only. External male registration attempts from Southwest Sydney are automatically blocked and replaced by Mason's AI Wingman bots.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowAccessGateModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#E11D48] text-white text-xs font-semibold cursor-pointer"
              >
                Return to Lounge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
