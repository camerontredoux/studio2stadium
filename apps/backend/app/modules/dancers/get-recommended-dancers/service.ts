import { DatabaseService } from "#database/service";
import { SCHOOL_CENTRIC_SCORING } from "#modules/schools/get-recommended-programs/school-centric-algorithm";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

// Cap the school-facing dancer recommendations to a focused top-N list,
// mirroring the dancer-facing program recommender. Applied when the caller
// doesn't request an explicit limit.
const DEFAULT_LIMIT = 20;

type MatchTier = "excellent" | "good" | "partial" | "unqualified" | null;

type RecommendedDancer = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  location: string;
  about: string | null;
  gpa: number | null;
  gradYear: number | null;
  matchScore: number;
  matchTier: MatchTier;
  top3Matches: string[];
  matchedSkillsCount: number;
  totalSchoolSkills: number;
  matchedStylesCount: number;
  totalSchoolStyles: number;
  matchedSportsCount: number;
  totalSchoolSports: number;
  sameState: boolean;
  meetsGpaRequirement: boolean;
};

/** What the viewing school is looking for — the mirror of a dancer's profile. */
type SchoolCriteria = {
  id: string;
  location: string | null;
  gpa: number | null;
  // Each skill carries the 1-5 importance weight the program assigned it, so a
  // dancer who matches the skills the school cares most about scores higher.
  skills: { slug: string; weight: number }[];
  styles: string[];
  sports: string[];
};

/**
 * Recommends dancers to a school ("how well does this dancer fit what the
 * school wants?"). This is the school-centric mirror of the dancer-facing
 * program recommender in `schools/get-recommended-programs`: same
 * attribute-matching idea, run in reverse, using the shared
 * `SCHOOL_CENTRIC_SCORING` weights and tiers.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    profileId: string,
    options: { limit?: number } = {}
  ): Promise<RecommendedDancer[]> {
    const school = await this.getSchoolCriteria(profileId);

    // A school with no defined skill preferences can't be matched against.
    if (!school || school.skills.length < 1) {
      return [];
    }

    const dancers = await this.getDancers(profileId);
    const scored = this.calculateScores(school, dancers);

    return scored
      .filter((d) => {
        // Require real skill overlap and a badgeable tier, mirroring the
        // program recommender: a dancer with no matched skills or only a
        // sub-partial score should not surface.
        return (
          d.matchedSkillsCount > 0 &&
          d.matchTier !== null &&
          d.matchTier !== "unqualified"
        );
      })
      .slice(0, options.limit ?? DEFAULT_LIMIT);
  }

  private async getSchoolCriteria(
    profileId: string
  ): Promise<SchoolCriteria | null> {
    const profile = await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: { id: profileId },
        columns: { id: true, location: true, gpa: true },
        with: {
          // Use the raw pivot rows (skillId + weight) rather than the through
          // relation so we keep each skill's 1-5 importance weight.
          schoolSkills: { columns: { skillId: true, weight: true } },
          styles: { columns: { slug: true } },
          sports: { columns: { slug: true } },
        },
      })
    );

    if (!profile) return null;

    return {
      id: profile.id,
      location: profile.location,
      gpa: profile.gpa,
      skills: profile.schoolSkills.map((s) => ({
        slug: s.skillId,
        weight: s.weight ?? 1,
      })),
      styles: profile.styles.map((s) => s.slug),
      sports: profile.sports.map((s) => s.slug),
    };
  }

  private async getDancers(schoolProfileId: string) {
    // Exclude dancers the school has already favorited.
    const favorited = await this.db.use((db) =>
      db.query.favorites.findMany({
        where: { schoolId: schoolProfileId },
        columns: { dancerId: true },
      })
    );
    const favoritedIds = new Set(favorited.map((f) => f.dancerId));

    const dancers = await this.db.use((db) =>
      db.query.dancerProfiles.findMany({
        where: {
          user: { role: "user" },
        },
        columns: {
          id: true,
          location: true,
          gpa: true,
          gradYear: true,
          biography: true,
        },
        with: {
          user: {
            columns: {
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
          skills: { columns: { slug: true } },
          styles: { columns: { slug: true } },
          sports: { columns: { slug: true } },
        },
      })
    );

    return dancers.flatMap((dancer) => {
      if (!dancer.user || favoritedIds.has(dancer.id)) return [];
      return [{ ...dancer, user: dancer.user }];
    });
  }

  private calculateScores(
    school: SchoolCriteria,
    dancers: Awaited<ReturnType<typeof this.getDancers>>
  ): RecommendedDancer[] {
    const { styleWeight, sportWeight } = SCHOOL_CENTRIC_SCORING;

    // Map each requested skill to its 1-5 importance weight.
    const schoolSkillWeights = new Map(
      school.skills.map((s) => [s.slug, s.weight])
    );
    const schoolStyleSet = new Set(school.styles);
    const schoolSportSet = new Set(school.sports);

    // How much the school is asking for — the denominator for percentage fit.
    // Skills contribute their own weight, so a school that leans heavily on a
    // few high-importance skills is scored against that emphasis.
    const totalSkillWeight = school.skills.reduce((sum, s) => sum + s.weight, 0);
    const maxPoints =
      totalSkillWeight +
      school.styles.length * styleWeight +
      school.sports.length * sportWeight;

    const scored: RecommendedDancer[] = [];

    for (const dancer of dancers) {
      const matchedSkills = dancer.skills.filter((s) =>
        schoolSkillWeights.has(s.slug)
      );
      const matchedStyles = dancer.styles.filter((s) =>
        schoolStyleSet.has(s.slug)
      );
      const matchedSports = dancer.sports.filter((s) =>
        schoolSportSet.has(s.slug)
      );

      // Sum the importance weights of the skills this dancer actually matched.
      const matchedSkillWeight = matchedSkills.reduce(
        (sum, s) => sum + (schoolSkillWeights.get(s.slug) ?? 1),
        0
      );

      const earnedPoints =
        matchedSkillWeight +
        matchedStyles.length * styleWeight +
        matchedSports.length * sportWeight;

      // Hybrid: 50% how completely the dancer meets the school's asks, 50% raw
      // volume of matches (normalized to a typical strong dancer).
      const percentageScore = maxPoints > 0 ? earnedPoints / maxPoints : 0;
      const rawScore = Math.min(
        1,
        earnedPoints / SCHOOL_CENTRIC_SCORING.expectedMaxPoints
      );
      const baseScore =
        rawScore * SCHOOL_CENTRIC_SCORING.rawScoreWeight +
        percentageScore * SCHOOL_CENTRIC_SCORING.percentageScoreWeight;

      const sameState =
        school.location !== null && dancer.location === school.location;
      const withLocation = sameState
        ? baseScore * SCHOOL_CENTRIC_SCORING.locationMultiplier
        : baseScore;
      const matchScore = withLocation * 100;

      const meetsGpaRequirement =
        school.gpa === null ||
        (dancer.gpa !== null && dancer.gpa >= school.gpa);

      const matchTier: MatchTier = !meetsGpaRequirement
        ? "unqualified"
        : this.getMatchTier(matchScore);

      scored.push({
        id: dancer.id,
        name: `${dancer.user.firstName} ${dancer.user.lastName}`,
        username: dancer.user.username,
        avatar: imageUrl(dancer.user.avatar, "avatar"),
        location: dancer.location,
        about: dancer.biography,
        gpa: dancer.gpa,
        gradYear: dancer.gradYear,
        matchScore: Math.round(matchScore),
        matchTier,
        top3Matches: matchedStyles.slice(0, 3).map((s) => s.slug),
        matchedSkillsCount: matchedSkills.length,
        totalSchoolSkills: school.skills.length,
        matchedStylesCount: matchedStyles.length,
        totalSchoolStyles: school.styles.length,
        matchedSportsCount: matchedSports.length,
        totalSchoolSports: school.sports.length,
        sameState,
        meetsGpaRequirement,
      });
    }

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
  }

  private getMatchTier(points: number): MatchTier {
    const { tiers } = SCHOOL_CENTRIC_SCORING;
    if (points >= tiers.excellent) return "excellent";
    if (points >= tiers.good) return "good";
    if (points >= tiers.partial) return "partial";
    return null;
  }
}
