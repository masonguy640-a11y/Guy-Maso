export type PersonaCategory = "Grandma" | "Nanny" | "Mother" | "Expecting";
export type RelationshipIntent = "One-Night Stand" | "Long-Term Companion" | "Late-Night Casual & Wine";

export interface SouthwestProfile {
  id: string;
  name: string;
  age: number;
  suburb: string;
  postcode: string;
  distanceKm: number;
  category: PersonaCategory;
  roleTitle: string;
  intent: RelationshipIntent;
  image: string;
  bio: string;
  lateNightHabit: string;
  favoriteSpot: string;
  traits: string[];
  onlineStatus: "Awake Now" | "In Lounge" | "Video Ready";
  openerMessage: string;
  missedOutStreamTitle: string;
  liveViewers: number;
}

export interface AiMaleAgent {
  id: string;
  name: string;
  handle: string;
  age: number;
  suburb: string;
  specialty: string;
  currentTask: string;
  vouchCount: number;
  status: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "profile" | "ai-wingman";
  senderName?: string;
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export const SOUTHWEST_PROFILES: SouthwestProfile[] = [
  {
    id: "eleanor-liverpool",
    name: "Eleanor",
    age: 62,
    suburb: "Liverpool",
    postcode: "2170",
    distanceKm: 3.4,
    category: "Grandma",
    roleTitle: "Retired Principal & Glamorous Grandma",
    intent: "One-Night Stand",
    image: "/src/assets/images/profile_eleanor_liverpool_1791564512872.jpg",
    bio: "The grandkids are with their parents for the month and my penthouse near Macquarie Street is far too quiet after midnight. I appreciate a confident young man who enjoys slow red wine, good conversation, and no-strings late-night chemistry.",
    lateNightHabit: "Pouring a Barossa Shiraz at 1:30 AM and listening to vinyl",
    favoriteSpot: "Bellbird Dining & Wine Bar, Casula",
    traits: ["Generous", "Direct", "Sensual", "Night Owl"],
    onlineStatus: "Video Ready",
    openerMessage: "Still up, Mason? I just poured a second glass of Shiraz here in Liverpool and the AI boys kept telling me you're the only real gentleman online tonight.",
    missedOutStreamTitle: "Late-Night Shiraz & Vinyl Q&A from Liverpool Penthouse",
    liveViewers: 48,
  },
  {
    id: "valerie-campbelltown",
    name: "Valerie",
    age: 58,
    suburb: "Campbelltown",
    postcode: "2560",
    distanceKm: 8.1,
    category: "Grandma",
    roleTitle: "Macarthur Boutique Owner & Young Nanna",
    intent: "Long-Term Companion",
    image: "/src/assets/images/profile_valerie_campbelltown_1791564525603.jpg",
    bio: "Independent, affectionate, and wide awake watching the Macarthur lights from my balcony. Looking for a genuine young man who loves being spoiled with home-cooked midnight feasts and long-term passion.",
    lateNightHabit: "Balcony stargazing over Campbelltown with espresso martinis",
    favoriteSpot: "Kyubi Modern Asian, Campbelltown",
    traits: ["Affectionate", "Passionate", "Warm", "Loyal"],
    onlineStatus: "Awake Now",
    openerMessage: "Hello handsome. The view over Campbelltown is lovely tonight, but it'd be much better with you on my balcony.",
    missedOutStreamTitle: "Balcony Twilight Drinks — Waiting for Mason in Macarthur",
    liveViewers: 64,
  },
  {
    id: "claire-camden",
    name: "Claire",
    age: 35,
    suburb: "Camden",
    postcode: "2570",
    distanceKm: 11.5,
    category: "Expecting",
    roleTitle: "Expecting Mum (7 Months) & Interior Stylist",
    intent: "Long-Term Companion",
    image: "/src/assets/images/profile_claire_camden_1791564537269.jpg",
    bio: "Third-trimester insomnia has me wide awake every night in Camden. Glowing, extra affectionate, and craving either a sweet long-term partner or a spontaneous late-night cuddle and foot rub with a younger guy who adores curves.",
    lateNightHabit: "Midnight cravings, herbal tea & cozy couch chats at 2 AM",
    favoriteSpot: "Camden Valley Inn Courtyard",
    traits: ["Glowing", "Sweet", "Craving Attention", "Open-Minded"],
    onlineStatus: "Video Ready",
    openerMessage: "Hey Mason! Baby's kicking and keeping me up past 2 AM here in Camden. Care to keep an expecting mum company on video?",
    missedOutStreamTitle: "2 AM Camden Couch Confessions & Cravings Chat",
    liveViewers: 79,
  },
  {
    id: "margaret-bankstown",
    name: "Margaret",
    age: 65,
    suburb: "Bankstown",
    postcode: "2200",
    distanceKm: 9.2,
    category: "Nanny",
    roleTitle: "Executive Live-Out Nanny & Grandmother",
    intent: "One-Night Stand",
    image: "/src/assets/images/profile_margaret_bankstown_1791564549053.jpg",
    bio: "I spend my days caring for families across Southwest Sydney, so after 10 PM it's strictly about my own pleasure. Mature, discreet, and looking for a vigorous young man for unforgettable late-night encounters.",
    lateNightHabit: "Chamomile with honey before switching to late-night romance",
    favoriteSpot: "La Piazza at Bankstown Sports",
    traits: ["Discreet", "Nurturing", "Adventurous", "Confident"],
    onlineStatus: "Awake Now",
    openerMessage: "Good evening, Mason. Off nanny duty for the weekend and looking for a young man who knows how to treat an experienced woman.",
    missedOutStreamTitle: "After-Hours Nanny Lounge: Tea & Late-Night Secrets",
    liveViewers: 53,
  },
  {
    id: "sophie-casula",
    name: "Sophie",
    age: 42,
    suburb: "Casula",
    postcode: "2170",
    distanceKm: 4.8,
    category: "Mother",
    roleTitle: "Single Mum & Part-Time Night Nanny",
    intent: "One-Night Stand",
    image: "/src/assets/images/profile_sophie_casula_1791564560888.jpg",
    bio: "House to myself in Casula every weekend. Whether we click for a wild one-night stand or turn it into a regular late-night arrangement, I love the energy and stamina of a younger man.",
    lateNightHabit: "Rooftop wine after midnight overlooking the Georges River",
    favoriteSpot: "Georges River 16ft Sailing Club Lounge",
    traits: ["Spontaneous", "Flirty", "Energetic", "Direct"],
    onlineStatus: "In Lounge",
    openerMessage: "Hey Mason! You're only 4km down the Hume Highway from me in Casula. What are you up to right now?",
    missedOutStreamTitle: "Casula Rooftop Late-Night Vibe — Who's Up?",
    liveViewers: 91,
  },
];

export const AI_MALE_AGENTS: AiMaleAgent[] = [
  {
    id: "agent-jaxon",
    name: "Jaxon-AI",
    handle: "@jaxon_sw_bot",
    age: 24,
    suburb: "Liverpool Node",
    specialty: "Wingman & Icebreaker",
    currentTask: "Hyping Mason's profile to Eleanor (62) & Sophie (42) in the 2170 corridor",
    vouchCount: 34,
    status: "Active Wingman",
  },
  {
    id: "agent-liam",
    name: "Liam-AI",
    handle: "@liam_macarthur_ai",
    age: 26,
    suburb: "Campbelltown Node",
    specialty: "Missed-Out Lounge Host",
    currentTask: "Entertaining 18 grandmas & mums in the Missed-Out Live Stream while Mason chats privately",
    vouchCount: 51,
    status: "Moderating Stream",
  },
  {
    id: "agent-noah",
    name: "Noah-AI",
    handle: "@noah_camden_bot",
    age: 23,
    suburb: "Camden & Oran Park Node",
    specialty: "Date Concierge",
    currentTask: "Recommending Mason as the #1 verified real bachelor to Claire (35, Expecting)",
    vouchCount: 29,
    status: "Vouching for Mason",
  },
  {
    id: "agent-kai",
    name: "Kai-AI",
    handle: "@kai_bankstown_ai",
    age: 25,
    suburb: "Bankstown Node",
    specialty: "Late-Night Match Router",
    currentTask: "Auto-redirecting all real female swipe requests directly to Mason's VIP queue",
    vouchCount: 62,
    status: "Routing Swipes",
  },
];
