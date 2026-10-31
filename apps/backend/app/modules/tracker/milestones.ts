import { type db } from "#database/connection";
import { trackerMilestones } from "#database/schema/tracker";
import { and, asc, eq } from "drizzle-orm";

type Client = typeof db;

/** A milestone as clients see it. */
export const milestoneFields = {
  id: trackerMilestones.id,
  schoolId: trackerMilestones.schoolId,
  title: trackerMilestones.title,
  completedAt: trackerMilestones.completedAt,
  createdAt: trackerMilestones.createdAt,
};

/** Matches one milestone only when it is the dancer's. */
export function ownedMilestone(dancerId: string, id: string) {
  return and(
    eq(trackerMilestones.id, id),
    eq(trackerMilestones.dancerId, dancerId)
  );
}

/** The dancer's milestones in the order they were added. */
export function findMilestones(db: Client, dancerId: string) {
  return db
    .select(milestoneFields)
    .from(trackerMilestones)
    .where(eq(trackerMilestones.dancerId, dancerId))
    .orderBy(asc(trackerMilestones.createdAt), asc(trackerMilestones.id));
}
