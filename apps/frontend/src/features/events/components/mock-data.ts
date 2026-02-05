import type { ApiSchemas } from "@/lib/api/client";

export type EventCard = ApiSchemas["EventsResponse"][number];

export interface Event {
  id: string;
  title: string;
  type: string;
  image?: string;
  location: string;
  startDatetime: string;
  time?: string;
  attendees?: number;
}

export interface EventDetail extends Event {
  description: string;
  endTime: string;
  danceStyles: string[];
  schedule: { time: string; title: string; description?: string }[];
  organizer: { name: string; role: string; avatar: string };
  venue: string;
  address: string;
  price: string;
  capacity: number;
}

export const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Spring Showcase: Contemporary & Modern",
    type: "Showcase",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    location: "USC Kaufman Hall, Los Angeles, CA",
    startDatetime: "Feb 14, 2026",
    time: "7:00 PM",
    attendees: 142,
  },
  {
    id: "2",
    title: "Hip Hop Intensive Workshop",
    type: "Workshop",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    location: "Juilliard Studios, New York, NY",
    startDatetime: "Feb 18, 2026",
    time: "2:00 PM",
    attendees: 56,
  },
  {
    id: "3",
    title: "Audition Day: Fall 2026 Admissions",
    type: "Audition",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    location: "NYU Tisch School of the Arts, New York, NY",
    startDatetime: "Feb 22, 2026",
    time: "9:00 AM",
    attendees: 230,
  },
  {
    id: "4",
    title: "Ballet Masterclass with Guest Artist",
    type: "Masterclass",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    location: "UNC School of the Arts, Winston-Salem, NC",
    startDatetime: "Mar 1, 2026",
    time: "10:00 AM",
    attendees: 78,
  },
  {
    id: "5",
    title: "Jazz & Musical Theater Showcase",
    type: "Showcase",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    location: "Point Park University, Pittsburgh, PA",
    startDatetime: "Mar 7, 2026",
    time: "6:30 PM",
    attendees: 95,
  },
  {
    id: "6",
    title: "World Dance Festival",
    type: "Festival",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    location: "UCLA, Los Angeles, CA",
    startDatetime: "Mar 14, 2026",
    time: "12:00 PM",
    attendees: 310,
  },
  {
    id: "7",
    title: "Choreography Competition Finals",
    type: "Competition",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    location: "Fordham / Ailey, New York, NY",
    startDatetime: "Mar 21, 2026",
    time: "5:00 PM",
    attendees: 185,
  },
  {
    id: "8",
    title: "Open House & Campus Tour",
    type: "Open House",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    location: "Butler University, Indianapolis, IN",
    startDatetime: "Mar 28, 2026",
    time: "11:00 AM",
    attendees: 64,
  },
];

export const MOCK_EVENT_DETAILS: Record<string, EventDetail> = {
  "1": {
    ...MOCK_EVENTS[0],
    description:
      "Join us for an evening celebrating the artistry of contemporary and modern dance. Featuring performances by USC Kaufman's top student choreographers and dancers, this showcase highlights original works that push boundaries and explore new movement vocabularies. The program includes pieces inspired by themes of identity, community, and transformation.",
    endTime: "9:30 PM",
    danceStyles: ["Contemporary", "Modern", "Lyrical"],
    schedule: [
      { time: "6:00 PM", title: "Doors Open" },
      {
        time: "6:30 PM",
        title: "Pre-show Reception",
        description: "Meet the choreographers in the lobby",
      },
      {
        time: "7:00 PM",
        title: "Act I",
        description: "Contemporary works by emerging choreographers",
      },
      { time: "7:45 PM", title: "Intermission" },
      {
        time: "8:00 PM",
        title: "Act II",
        description: "Modern dance ensemble pieces",
      },
      { time: "9:00 PM", title: "Finale & Curtain Call" },
    ],
    organizer: {
      name: "Sarah Mitchell",
      role: "Program Director, USC Kaufman",
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    venue: "USC Kaufman Hall",
    address: "3551 Trousdale Pkwy, Los Angeles, CA 90089",
    price: "Free",
    capacity: 200,
  },
  "2": {
    ...MOCK_EVENTS[1],
    description:
      "An intensive full-day workshop led by industry professionals covering foundational and advanced hip hop techniques. Participants will learn choreography, freestyle fundamentals, and musicality. Open to intermediate and advanced dancers looking to sharpen their skills and connect with the hip hop dance community.",
    endTime: "6:00 PM",
    danceStyles: ["Hip Hop", "Breaking", "Popping"],
    schedule: [
      { time: "1:30 PM", title: "Check-in & Warm-up" },
      {
        time: "2:00 PM",
        title: "Foundations Session",
        description: "Groove, bounce, and rhythm training",
      },
      { time: "3:30 PM", title: "Break" },
      {
        time: "3:45 PM",
        title: "Choreography Intensive",
        description: "Learn and drill a full combo",
      },
      { time: "5:15 PM", title: "Freestyle Circle" },
      { time: "5:45 PM", title: "Cool-down & Q&A" },
    ],
    organizer: {
      name: "Marcus Johnson",
      role: "Guest Instructor, Juilliard",
      avatar: "https://i.pravatar.cc/150?u=marcus",
    },
    venue: "Juilliard Studios",
    address: "60 Lincoln Center Plaza, New York, NY 10023",
    price: "$45",
    capacity: 80,
  },
  "3": {
    ...MOCK_EVENTS[2],
    description:
      "Prospective students are invited to audition for Fall 2026 admission to NYU Tisch's Department of Dance. Auditions include a technique class, short solo performance, and brief interview. This is your opportunity to demonstrate your training, artistry, and potential as a member of our vibrant dance community.",
    endTime: "4:00 PM",
    danceStyles: ["Ballet", "Modern", "Contemporary", "Jazz"],
    schedule: [
      { time: "8:30 AM", title: "Registration & Check-in" },
      {
        time: "9:00 AM",
        title: "Welcome & Orientation",
        description: "Overview of the program and audition process",
      },
      { time: "9:30 AM", title: "Ballet Technique Class" },
      { time: "10:45 AM", title: "Modern Technique Class" },
      { time: "12:00 PM", title: "Lunch Break" },
      { time: "1:00 PM", title: "Solo Performances" },
      { time: "3:00 PM", title: "Individual Interviews" },
    ],
    organizer: {
      name: "Dr. Linda Park",
      role: "Chair, Dept. of Dance, NYU Tisch",
      avatar: "https://i.pravatar.cc/150?u=linda",
    },
    venue: "NYU Tisch School of the Arts",
    address: "111 2nd Ave, New York, NY 10003",
    price: "$75 application fee",
    capacity: 300,
  },
  "4": {
    ...MOCK_EVENTS[3],
    description:
      "A rare opportunity to study with a world-renowned guest artist in an intimate masterclass setting. This session focuses on classical ballet technique, artistry, and performance quality. Students will receive individual corrections and coaching. Suitable for advanced ballet students and pre-professional dancers.",
    endTime: "1:00 PM",
    danceStyles: ["Ballet", "Classical"],
    schedule: [
      { time: "9:30 AM", title: "Doors Open" },
      {
        time: "10:00 AM",
        title: "Barre Work",
        description: "Focus on alignment and musicality",
      },
      {
        time: "10:45 AM",
        title: "Center Work",
        description: "Adagio and pirouettes",
      },
      {
        time: "11:30 AM",
        title: "Across the Floor",
        description: "Allegro and grand allegro combinations",
      },
      { time: "12:15 PM", title: "Q&A with Guest Artist" },
    ],
    organizer: {
      name: "James Crawford",
      role: "Ballet Faculty, UNCSA",
      avatar: "https://i.pravatar.cc/150?u=james",
    },
    venue: "UNC School of the Arts",
    address: "1533 S Main St, Winston-Salem, NC 27127",
    price: "$30",
    capacity: 100,
  },
  "5": {
    ...MOCK_EVENTS[4],
    description:
      "An electrifying evening of jazz and musical theater dance, featuring student and faculty choreography. From classic Broadway to contemporary jazz fusion, this showcase celebrates the energy, storytelling, and technical brilliance of theatrical dance. Expect high-energy numbers, live vocals, and show-stopping performances.",
    endTime: "9:00 PM",
    danceStyles: ["Jazz", "Musical Theater", "Broadway"],
    schedule: [
      { time: "5:30 PM", title: "Doors Open" },
      {
        time: "6:30 PM",
        title: "Act I: Jazz Fusion",
        description: "Contemporary jazz and fusion works",
      },
      { time: "7:15 PM", title: "Intermission" },
      {
        time: "7:30 PM",
        title: "Act II: Broadway Spotlight",
        description: "Musical theater choreography",
      },
      { time: "8:30 PM", title: "Grand Finale" },
    ],
    organizer: {
      name: "Tanya Rodriguez",
      role: "Dept. Head, Point Park Dance",
      avatar: "https://i.pravatar.cc/150?u=tanya",
    },
    venue: "George Rowland White Performance Center",
    address: "201 Wood St, Pittsburgh, PA 15222",
    price: "$15",
    capacity: 120,
  },
  "6": {
    ...MOCK_EVENTS[5],
    description:
      "A vibrant celebration of global dance traditions featuring performances, workshops, and cultural exchanges. Experience Afrobeat, Bollywood, Flamenco, Samba, and more in a day-long festival that honors the diversity and richness of world dance. Open to all levels and backgrounds.",
    endTime: "8:00 PM",
    danceStyles: ["Afrobeat", "Bollywood", "Flamenco", "Samba", "Folk"],
    schedule: [
      { time: "11:30 AM", title: "Festival Gates Open" },
      {
        time: "12:00 PM",
        title: "Opening Ceremony",
        description: "Welcome performances from each ensemble",
      },
      {
        time: "1:00 PM",
        title: "Workshop Block A",
        description: "Choose from Afrobeat, Bollywood, or Flamenco",
      },
      { time: "2:30 PM", title: "Main Stage Performances" },
      {
        time: "4:00 PM",
        title: "Workshop Block B",
        description: "Choose from Samba, Folk, or Fusion",
      },
      { time: "5:30 PM", title: "Cultural Exchange Panel" },
      { time: "7:00 PM", title: "Closing Gala Performance" },
    ],
    organizer: {
      name: "Prof. Amara Chen",
      role: "Director, UCLA World Arts",
      avatar: "https://i.pravatar.cc/150?u=amara",
    },
    venue: "UCLA Royce Hall & Sculpture Garden",
    address: "10745 Dickson Ct, Los Angeles, CA 90095",
    price: "$20",
    capacity: 500,
  },
  "7": {
    ...MOCK_EVENTS[6],
    description:
      "The culminating event of the season's choreography competition. Watch as finalists present original works judged by a panel of distinguished choreographers and artistic directors. Categories include solo, duet, and group works. Winners receive scholarships and performance opportunities.",
    endTime: "9:00 PM",
    danceStyles: ["Contemporary", "Modern", "Jazz", "Experimental"],
    schedule: [
      { time: "4:30 PM", title: "Doors Open" },
      {
        time: "5:00 PM",
        title: "Solo Category",
        description: "Original solo works (3–5 min each)",
      },
      { time: "6:00 PM", title: "Duet Category" },
      { time: "6:45 PM", title: "Intermission" },
      {
        time: "7:00 PM",
        title: "Group Category",
        description: "Ensemble works (5–8 min each)",
      },
      { time: "8:15 PM", title: "Judges' Deliberation & Audience Choice Vote" },
      { time: "8:45 PM", title: "Awards Ceremony" },
    ],
    organizer: {
      name: "David Okafor",
      role: "Artistic Director, Fordham/Ailey",
      avatar: "https://i.pravatar.cc/150?u=david",
    },
    venue: "Ailey Citigroup Theater",
    address: "405 W 55th St, New York, NY 10019",
    price: "$25",
    capacity: 250,
  },
  "8": {
    ...MOCK_EVENTS[7],
    description:
      "Discover what Butler University's dance program has to offer during this open house and campus tour. Meet faculty, watch rehearsals, tour state-of-the-art facilities, and learn about audition requirements, curriculum, and student life. Current students will share their experiences and answer your questions.",
    endTime: "3:00 PM",
    danceStyles: ["Ballet", "Modern", "Jazz"],
    schedule: [
      { time: "10:30 AM", title: "Check-in & Welcome" },
      {
        time: "11:00 AM",
        title: "Program Overview",
        description: "Presentation by department chair",
      },
      {
        time: "11:45 AM",
        title: "Facility Tour",
        description: "Visit studios, theaters, and training rooms",
      },
      { time: "12:30 PM", title: "Lunch with Current Students" },
      {
        time: "1:30 PM",
        title: "Observe Rehearsal",
        description: "Watch a spring concert rehearsal",
      },
      { time: "2:30 PM", title: "Q&A & Wrap-up" },
    ],
    organizer: {
      name: "Katherine Wells",
      role: "Admissions Coordinator, Butler Dance",
      avatar: "https://i.pravatar.cc/150?u=katherine",
    },
    venue: "Lilly Hall, Butler University",
    address: "510 W 46th St, Indianapolis, IN 46208",
    price: "Free",
    capacity: 80,
  },
};

export function getEventById(id: string): EventDetail | undefined {
  return MOCK_EVENT_DETAILS[id];
}
