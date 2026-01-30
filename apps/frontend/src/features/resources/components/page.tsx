import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { BookOpenIcon, PlayIcon, TagIcon } from "lucide-react";
import { type Blog, BlogCard } from "./blog-card";
import { FilterSheet } from "./filters/filter-sheet";
import { type Video, VideoCard } from "./video-card";

const MOCK_VIDEOS: Video[] = [
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

const MOCK_BLOGS: Blog[] = [
  {
    id: "1",
    title: "5 Things Every Dancer Should Know Before Auditioning for College",
    description:
      "From choosing the right programs to preparing your materials, here's what you need to know before stepping into the audition room.",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    date: "Jan 26, 2026",
  },
  {
    id: "2",
    title: "How to Prevent Common Dance Injuries",
    description:
      "A guide to warm-ups, cross-training, and recovery techniques that keep dancers performing at their best and off the sidelines.",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Jan 19, 2026",
  },
  {
    id: "3",
    title: "What Admissions Panels Actually Look For",
    description:
      "Insights from program directors on the qualities, technique, and artistry that make applicants stand out.",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Jan 12, 2026",
  },
  {
    id: "4",
    title: "Balancing Academics and Dance in College",
    description:
      "Tips from current students on managing coursework, rehearsals, and self-care during the college dance experience.",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    date: "Jan 5, 2026",
  },
  {
    id: "5",
    title: "The Rise of Contemporary Dance in University Programs",
    description:
      "How contemporary dance has grown from niche elective to a core pillar of top-tier college dance curricula.",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "Dec 28, 2025",
  },
  {
    id: "6",
    title: "Building Your Dance Portfolio: A Step-by-Step Guide",
    description:
      "Everything you need to create a compelling dance portfolio, including headshots, reels, and a standout resume.",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "Dec 18, 2025",
  },
  {
    id: "7",
    title: "A Parent's Guide to Supporting a Young Dancer",
    description:
      "How to encourage your child's passion without burnout—covering scheduling, nutrition, and emotional support.",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    date: "Dec 10, 2025",
  },
  {
    id: "8",
    title: "Top 10 Dance Programs on the East Coast",
    description:
      "A curated list of standout BFA and BA programs from New York to Florida, with application tips for each.",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    date: "Dec 2, 2025",
  },
  {
    id: "9",
    title: "The Mental Health Conversation in Dance Education",
    description:
      "Why more programs are prioritizing mental wellness and how students can advocate for themselves.",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Nov 24, 2025",
  },
  {
    id: "10",
    title: "How to Make the Most of Summer Dance Intensives",
    description:
      "Choosing the right intensive, setting goals, and using the experience to strengthen your college applications.",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    date: "Nov 16, 2025",
  },
  {
    id: "11",
    title: "Nutrition for Dancers: Fueling Performance",
    description:
      "A sports dietitian breaks down macros, hydration, and meal timing strategies tailored for dancers.",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    date: "Nov 8, 2025",
  },
  {
    id: "12",
    title: "From Studio to Stage: Transitioning to Professional Dance",
    description:
      "Advice from working professionals on auditions, agents, contracts, and building a sustainable career.",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "Oct 30, 2025",
  },
  {
    id: "13",
    title: "Understanding Dance Science: What the Research Says",
    description:
      "An introduction to dance science research covering biomechanics, injury prevention, and performance optimization.",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    date: "Oct 22, 2025",
  },
  {
    id: "14",
    title: "Cross-Training for Dancers: Pilates, Yoga & Beyond",
    description:
      "How complementary training methods can improve your technique, prevent injury, and extend your career.",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    date: "Oct 14, 2025",
  },
  {
    id: "15",
    title: "Diversity & Inclusion in College Dance Programs",
    description:
      "How programs are evolving to embrace diverse bodies, styles, and perspectives in their curricula.",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    date: "Oct 6, 2025",
  },
  {
    id: "16",
    title: "Dance and Technology: How AI Is Changing Choreography",
    description:
      "Exploring motion capture, AI-generated movement, and digital tools reshaping how dance is created and taught.",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    date: "Sep 28, 2025",
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

export function Page() {
  const groupedVideos = groupVideosByType(MOCK_VIDEOS);

  return (
    <div className="flex flex-col gap-2 lg:gap-4 max-lg:pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex flex-col gap-0.5 max-sm:pl-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Resources
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Tutorials & articles to level up your skills
          </p>
        </div>
        <FilterSheet />
      </div>

      <Tabs defaultValue="videos">
        <TabsList
          variant="underline"
          className="**:data-[slot=tab-indicator]:bg-brand"
        >
          <TabsTab
            value="videos"
            className="gap-1.5 text-sm sm:text-xs text-brand data-active:text-brand"
          >
            <PlayIcon className="size-3.5" />
            Video Library
          </TabsTab>
          <TabsTab
            value="blogs"
            className="gap-1.5 text-sm sm:text-xs text-brand data-active:text-brand"
          >
            <BookOpenIcon className="size-3.5" />
            Blog
          </TabsTab>
        </TabsList>

        <TabsContent value="videos">
          <div className="flex flex-col gap-2 lg:gap-4 pt-2 lg:pt-4">
            {groupedVideos.map((group) => (
              <section key={group.type} className="flex flex-col gap-2 lg:gap-3">
                <div className="sticky top-12 z-10 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-brand/20 bg-background/90 backdrop-blur-sm px-2.5 py-1">
                      <TagIcon className="size-3.5 text-brand" />
                      <span className="text-sm font-semibold text-brand">
                        {group.type}
                      </span>
                    </div>
                    <Separator className="flex-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                  {group.videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blogs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 pt-2 lg:pt-4">
            {MOCK_BLOGS.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
