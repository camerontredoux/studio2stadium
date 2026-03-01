import { EVENT_TYPES } from "@/utils/constants/event-types";
import { z } from "zod";

export const MAX_NAME_LENGTH = 64;

export const schemas = {
  updateProfile: z.object({
    firstName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    lastName: z.string().min(2).max(MAX_NAME_LENGTH).optional(),
    displayEmail: z.email().optional(),
    phone: z.string().nullable(),
  }),

  updateAbout: z.object({
    about: z.string().optional(),
    missionStatement: z.string().optional(),
    whatWeDo: z.string().optional(),
    benefits: z.string().optional(),
  }),

  updateContact: z.object({
    website: z.url("Must be a valid URL").optional().or(z.literal("")),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
  }),

  updateTeam: z.object({
    size: z.coerce.number().optional(),
    gpa: z.coerce.number().optional(),
    timeCommitment: z.string().optional(),
    headCoach: z.string().optional(),
    assistantCoach: z.string().optional(),
    commonRecruiting: z.boolean().optional(),
    teamSelection: z.enum(["recruitment", "audition", "hybrid"]).optional(),
    competitiveCircuit: z
      .enum(["uda", "dtu", "nda", "usa", "non-competitive", "other"])
      .optional(),
    division: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
  }),

  createEvent: z
    .object({
      type: z.enum(EVENT_TYPES, { message: "Event type is required" }),
      title: z
        .string()
        .min(1, "Title is required")
        .max(100, "Title must be 100 characters or less"),
      description: z
        .string()
        .min(1, "Description is required")
        .max(2000, "Description must be 2000 characters or less"),
      location: z.string().min(1, "Location is required"),
      startDate: z.date({ message: "Start date is required" }),
      startTime: z.string().min(1, "Start time is required"),
      endDate: z.date({ message: "End date is required" }),
      endTime: z.string().min(1, "End time is required"),
      timezone: z.string().min(1, "Timezone is required"),
      website: z.url("Must be a valid URL").optional().or(z.literal("")),
      address: z.string().optional(),
    })
    .refine(
      (data) => {
        const start = combineDateAndTime(data.startDate, data.startTime);
        const end = combineDateAndTime(data.endDate, data.endTime);
        return end > start;
      },
      {
        message: "End date/time must be after start date/time",
        path: ["endDate"],
      },
    ),
} as const;

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = parseTime(time);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function parseTime(time: string): [number, number] {
  // TimePicker outputs 24-hour format like "09:30" or "21:30"
  const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return [0, 0];
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return [hours, minutes];
}
