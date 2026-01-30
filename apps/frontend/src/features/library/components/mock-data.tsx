export interface Video {
  id: string;
  title: string;
  description: string;
  tag: string;
  image: string;
  date: string;
}

export const MOCK_VIDEOS: Video[] = [
  // Technique
  {
    id: "1",
    title: "Breaking Down the Perfect Pirouette",
    description:
      "A detailed look at the mechanics behind a clean pirouette, from preparation to spotting to landing.",
    tag: "Technique",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Jan 28, 2026",
  },
  {
    id: "4",
    title: "Grand Allegro Essentials",
    description:
      "Master the fundamentals of grand allegro including grand jeté, tour jeté, and saut de basque across the floor.",
    tag: "Technique",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "Jan 8, 2026",
  },
  {
    id: "7",
    title: "Perfecting Your Arabesque Line",
    description:
      "Tips on alignment, hip placement, and back engagement to achieve a beautiful and sustainable arabesque.",
    tag: "Technique",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Dec 15, 2025",
  },
  {
    id: "8",
    title: "Pointe Work Fundamentals for Beginners",
    description:
      "Everything you need to know before going en pointe—foot strength exercises, fitting tips, and first combinations.",
    tag: "Technique",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    date: "Dec 5, 2025",
  },
  {
    id: "9",
    title: "Mastering Fouetté Turns",
    description:
      "Break down the physics and coordination behind consecutive fouetté turns with progressive drills.",
    tag: "Technique",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "Nov 22, 2025",
  },
  {
    id: "10",
    title: "Floor Work Transitions & Rolls",
    description:
      "Smooth transitions from standing to floor and back, covering shoulder rolls, spirals, and sweeps.",
    tag: "Technique",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    date: "Nov 10, 2025",
  },
  // Education
  {
    id: "2",
    title: "How to Build a College Audition Solo",
    description:
      "Step-by-step guide to selecting music, structuring choreography, and showcasing your strengths for admissions panels.",
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    date: "Jan 22, 2026",
  },
  {
    id: "5",
    title: "Understanding Scholarship Opportunities in Dance",
    description:
      "An overview of merit-based, need-based, and talent scholarships available at top dance programs across the country.",
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "Dec 30, 2025",
  },
  {
    id: "11",
    title: "Navigating the College Dance Audition Process",
    description:
      "From pre-screening videos to callback etiquette, learn what to expect at every stage of the college audition.",
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    date: "Dec 12, 2025",
  },
  {
    id: "12",
    title: "Choosing Between BFA and BA Dance Programs",
    description:
      "Understand the key differences in curriculum, time commitment, and career outcomes between BFA and BA tracks.",
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "Nov 28, 2025",
  },
  {
    id: "13",
    title: "Writing a Standout Dance Resume",
    description:
      "Formatting tips, what to include, and common mistakes to avoid when crafting your dance resume for college applications.",
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Nov 15, 2025",
  },
  {
    id: "14",
    title: "What Dance Professors Wish Students Knew",
    description:
      "Faculty from top programs share the habits, mindset, and preparation that set incoming students up for success.",
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Nov 2, 2025",
  },
  // Combination
  {
    id: "3",
    title: "Contemporary + Hip Hop Fusion Combo",
    description:
      "Learn a high-energy combination that blends contemporary fluidity with hip hop isolations and grooves.",
    tag: "Combination",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Jan 15, 2026",
  },
  {
    id: "6",
    title: "Jazz Funk Choreography Breakdown",
    description:
      "A stylized jazz funk combo with sharp hits, body rolls, and musicality-driven movement.",
    tag: "Combination",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    date: "Dec 20, 2025",
  },
  {
    id: "15",
    title: "Lyrical Contemporary Combo: Emotional Storytelling",
    description:
      "A flowing lyrical combination focused on breath, weight shifts, and conveying emotion through movement.",
    tag: "Combination",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Dec 8, 2025",
  },
  {
    id: "16",
    title: "Ballet Variation: Sleeping Beauty Act III",
    description:
      "Learn the Aurora variation from Act III with detailed breakdowns of each phrase and performance tips.",
    tag: "Combination",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    date: "Nov 25, 2025",
  },
  {
    id: "17",
    title: "Musical Theater Jazz: Fosse Style",
    description:
      "Iconic Fosse-style choreography with turned-in positions, isolated shoulders, and signature hat work.",
    tag: "Combination",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "Nov 12, 2025",
  },
  {
    id: "18",
    title: "Afro-Contemporary Fusion Routine",
    description:
      "A vibrant combo blending West African dance vocabulary with contemporary technique and spatial patterns.",
    tag: "Combination",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "Oct 30, 2025",
  },
  // Conditioning
  {
    id: "19",
    title: "Dancer's Core Workout: 20-Minute Circuit",
    description:
      "A targeted core circuit designed for dancers, focusing on stability, rotation strength, and back support.",
    tag: "Conditioning",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    date: "Jan 20, 2026",
  },
  {
    id: "20",
    title: "Flexibility & Mobility for Dancers",
    description:
      "Active stretching and PNF techniques to safely increase your range of motion in hips, hamstrings, and shoulders.",
    tag: "Conditioning",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    date: "Jan 5, 2026",
  },
  {
    id: "21",
    title: "Jump Training: Building Power & Height",
    description:
      "Plyometric exercises and progressive jump drills to increase your elevation and landing control.",
    tag: "Conditioning",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Dec 18, 2025",
  },
  {
    id: "22",
    title: "Ankle Strengthening for Pointe & Relevé",
    description:
      "Theraband exercises and balance drills to build ankle strength and prevent common foot and ankle injuries.",
    tag: "Conditioning",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Nov 30, 2025",
  },
  {
    id: "23",
    title: "Pre-Class Warm-Up Routine",
    description:
      "A 10-minute dynamic warm-up to prepare your body for class, rehearsal, or performance.",
    tag: "Conditioning",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    date: "Nov 18, 2025",
  },
  // Performance
  {
    id: "24",
    title: "Stage Presence & Performance Quality",
    description:
      "How to command the stage with intentional eye focus, projection, and dynamic energy beyond just steps.",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "Jan 18, 2026",
  },
  {
    id: "25",
    title: "Musicality Masterclass: Dancing Beyond the Beat",
    description:
      "Explore phrasing, dynamics, and rhythmic play to make your movement truly connected to the music.",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "Dec 28, 2025",
  },
  {
    id: "26",
    title: "How to Film a Dance Reel That Gets Noticed",
    description:
      "Camera angles, lighting, editing tips, and content strategy for building a strong video portfolio.",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    date: "Dec 10, 2025",
  },
  {
    id: "27",
    title: "Partnering Basics: Lifts, Trust & Communication",
    description:
      "Foundational partnering skills including counterbalance, assisted lifts, and building trust with your partner.",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    date: "Nov 20, 2025",
  },
  {
    id: "28",
    title: "Managing Pre-Performance Nerves",
    description:
      "Mental preparation techniques including visualization, breathing, and positive self-talk for auditions and shows.",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Nov 5, 2025",
  },
];

function groupVideosByType(videos: Video[]) {
  const groups: { type: string; videos: Video[] }[] = [];
  for (const video of videos) {
    const existing = groups.find((g) => g.type === video.tag);
    if (existing) {
      existing.videos.push(video);
    } else {
      groups.push({ type: video.tag, videos: [video] });
    }
  }
  return groups;
}

export const groupedVideos = groupVideosByType(MOCK_VIDEOS);
