import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const updateProgramSchema = vine.create(
  vine.object({
    schoolName: vine.string().optional(),
    location: vine.string().optional(),
    commonRecruiting: vine.boolean().optional(),
    teamSelection: vine.enum(["recruitment", "audition", "hybrid"]).optional(),
    competitiveCircuit: vine
      .enum(["uda", "dtu", "nda", "usa", "non-competitive", "other"])
      .optional(),
    division: vine.string().nullable().optional(),
    benefits: vine.string().nullable().optional(),
    about: vine.string().nullable().optional(),
    website: vine.string().nullable().optional(),
    timeCommitment: vine.string().nullable().optional(),
    headCoach: vine.string().nullable().optional(),
    assistantCoach: vine.string().nullable().optional(),
    missionStatement: vine.string().nullable().optional(),
    whatWeDo: vine.string().nullable().optional(),
    gpa: vine.number().nullable().optional(),
    size: vine.number().nullable().optional(),
    tiktok: vine.string().nullable().optional(),
    instagram: vine.string().nullable().optional(),
  })
);

export type UpdateProgramSchema = Infer<typeof updateProgramSchema>;
