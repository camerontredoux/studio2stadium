/**
 * SCHOOL-CENTRIC ALGORITHM (for school-to-dancer recommendations)
 *
 * This algorithm answers: "How well does this dancer fit what the school wants?"
 * Use this when schools are looking for dancers.
 *
 * Scoring logic:
 * - Hybrid: 50% raw count + 50% percentage of school's requirements met
 * - Skills = 2 points, Styles = 1 point, Sports = 0.5 points
 * - Location bonus: 5% multiplicative if same state
 * - Schools with < 10 skills are filtered out
 *
 * Example:
 * - School wants 14 skills, dancer has 9 = 9/14 = 64% (good fit for school)
 * - School wants 34 skills, dancer has 14 = 14/34 = 41% (less complete fit)
 */

// Hybrid scoring: combine raw count and percentage
// Percentage score: how well dancer fits school's requirements
// const percentageScore = maxPoints > 0 ? earnedPoints / maxPoints : 0;

// Raw score: total matches normalized to expected max
// Skills now contribute their own 1-5 importance weight (avg ~3.27 across all
// programs) instead of a flat 2, so a matched skill is worth ~1.6x its old
// value. Expected max is rescaled to keep rawScore on the same 0-1 footing:
//   ~20 skills (20 * 3.27 = 65pts) + 3 styles (3pts) + 5 sports (2.5pts) = ~71
// Because percentageScore is self-normalizing (earned/max both scale with the
// weights) and expectedMaxPoints absorbs the skill-scale change, the tier
// thresholds below stay valid — the average dancer lands in the same tier,
// while dancers who match a program's high-weight skills rank higher.
// const expectedMaxPoints = 71;
// const rawScore = Math.min(1, earnedPoints / expectedMaxPoints);

// Combine 50/50
// let baseScore = rawScore * 0.5 + percentageScore * 0.5;

export const SCHOOL_CENTRIC_SCORING = {
  // Skills are scored by their per-program 1-5 weight, not this flat value; it
  // remains only as the styles/sports reference scale.
  skillWeight: 2,
  styleWeight: 1,
  sportWeight: 0.5,
  expectedMaxPoints: 71,
  rawScoreWeight: 0.5,
  percentageScoreWeight: 0.5,
  locationMultiplier: 1.05,
  minSchoolSkills: 10,
  tiers: {
    excellent: 70,
    good: 50,
    partial: 30,
  },
};
