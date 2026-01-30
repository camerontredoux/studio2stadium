export type ProspectStatus = "accepted" | "in-review" | "rejected" | "none";
export type VideoStatus = "watched" | "none";

export interface SchoolSubmission {
  id: string;
  name: string;
  username: string;
  avatar: string;
  initials: string;
  location: string;
  prospectStatus: ProspectStatus;
  videoStatus: VideoStatus;
  submittedAt: string;
}

export const MOCK_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export const MOCK_SUBMISSIONS: SchoolSubmission[] = [
  {
    id: "1",
    name: "USC Kaufman School of Dance",
    username: "usc-kaufman",
    avatar: "https://i.pravatar.cc/150?u=usc-kaufman",
    initials: "UK",
    location: "Los Angeles, CA",
    prospectStatus: "accepted",
    videoStatus: "watched",
    submittedAt: "Jan 15, 2026",
  },
  {
    id: "2",
    name: "Juilliard School",
    username: "juilliard",
    avatar: "https://i.pravatar.cc/150?u=juilliard",
    initials: "JS",
    location: "New York, NY",
    prospectStatus: "in-review",
    videoStatus: "watched",
    submittedAt: "Jan 15, 2026",
  },
  {
    id: "3",
    name: "NYU Tisch School of the Arts",
    username: "nyu-tisch",
    avatar: "https://i.pravatar.cc/150?u=nyu-tisch",
    initials: "NT",
    location: "New York, NY",
    prospectStatus: "in-review",
    videoStatus: "none",
    submittedAt: "Jan 18, 2026",
  },
  {
    id: "4",
    name: "UNC School of the Arts",
    username: "uncsa",
    avatar: "https://i.pravatar.cc/150?u=uncsa",
    initials: "UA",
    location: "Winston-Salem, NC",
    prospectStatus: "rejected",
    videoStatus: "watched",
    submittedAt: "Jan 20, 2026",
  },
  {
    id: "5",
    name: "Point Park University",
    username: "point-park",
    avatar: "https://i.pravatar.cc/150?u=point-park",
    initials: "PP",
    location: "Pittsburgh, PA",
    prospectStatus: "none",
    videoStatus: "none",
    submittedAt: "Jan 22, 2026",
  },
  {
    id: "6",
    name: "UCLA Department of World Arts",
    username: "ucla-dance",
    avatar: "https://i.pravatar.cc/150?u=ucla-dance",
    initials: "UL",
    location: "Los Angeles, CA",
    prospectStatus: "none",
    videoStatus: "watched",
    submittedAt: "Jan 25, 2026",
  },
  {
    id: "7",
    name: "Fordham University / Ailey School",
    username: "fordham-ailey",
    avatar: "https://i.pravatar.cc/150?u=fordham-ailey",
    initials: "FA",
    location: "New York, NY",
    prospectStatus: "in-review",
    videoStatus: "watched",
    submittedAt: "Jan 25, 2026",
  },
  {
    id: "8",
    name: "Butler University",
    username: "butler-dance",
    avatar: "https://i.pravatar.cc/150?u=butler-dance",
    initials: "BU",
    location: "Indianapolis, IN",
    prospectStatus: "none",
    videoStatus: "none",
    submittedAt: "Jan 28, 2026",
  },
];

export interface SelectableSchool {
  id: string;
  name: string;
  username: string;
  avatar: string;
  initials: string;
  location: string;
}

export const MOCK_ALL_SCHOOLS: SelectableSchool[] = [
  {
    id: "1",
    name: "USC Kaufman School of Dance",
    username: "usc-kaufman",
    avatar: "https://i.pravatar.cc/150?u=usc-kaufman",
    initials: "UK",
    location: "Los Angeles, CA",
  },
  {
    id: "2",
    name: "Juilliard School",
    username: "juilliard",
    avatar: "https://i.pravatar.cc/150?u=juilliard",
    initials: "JS",
    location: "New York, NY",
  },
  {
    id: "3",
    name: "NYU Tisch School of the Arts",
    username: "nyu-tisch",
    avatar: "https://i.pravatar.cc/150?u=nyu-tisch",
    initials: "NT",
    location: "New York, NY",
  },
  {
    id: "4",
    name: "UNC School of the Arts",
    username: "uncsa",
    avatar: "https://i.pravatar.cc/150?u=uncsa",
    initials: "UA",
    location: "Winston-Salem, NC",
  },
  {
    id: "5",
    name: "Point Park University",
    username: "point-park",
    avatar: "https://i.pravatar.cc/150?u=point-park",
    initials: "PP",
    location: "Pittsburgh, PA",
  },
  {
    id: "6",
    name: "UCLA Department of World Arts",
    username: "ucla-dance",
    avatar: "https://i.pravatar.cc/150?u=ucla-dance",
    initials: "UL",
    location: "Los Angeles, CA",
  },
  {
    id: "7",
    name: "Fordham University / Ailey School",
    username: "fordham-ailey",
    avatar: "https://i.pravatar.cc/150?u=fordham-ailey",
    initials: "FA",
    location: "New York, NY",
  },
  {
    id: "8",
    name: "Butler University",
    username: "butler-dance",
    avatar: "https://i.pravatar.cc/150?u=butler-dance",
    initials: "BU",
    location: "Indianapolis, IN",
  },
  {
    id: "9",
    name: "University of Arizona School of Dance",
    username: "uofa-dance",
    avatar: "https://i.pravatar.cc/150?u=uofa-dance",
    initials: "AZ",
    location: "Tucson, AZ",
  },
  {
    id: "10",
    name: "Boston Conservatory at Berklee",
    username: "boston-conservatory",
    avatar: "https://i.pravatar.cc/150?u=boston-conservatory",
    initials: "BC",
    location: "Boston, MA",
  },
  {
    id: "11",
    name: "Southern Methodist University",
    username: "smu-dance",
    avatar: "https://i.pravatar.cc/150?u=smu-dance",
    initials: "SM",
    location: "Dallas, TX",
  },
  {
    id: "12",
    name: "University of Michigan",
    username: "umich-dance",
    avatar: "https://i.pravatar.cc/150?u=umich-dance",
    initials: "UM",
    location: "Ann Arbor, MI",
  },
];
