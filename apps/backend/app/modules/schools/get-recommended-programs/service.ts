import { DatabaseService } from "#database/service";
import { StateCode } from "#shared/constants/states";
import { inject } from "@adonisjs/core";
import { stateAdjacencies, stateRegions } from "./constants.ts";

type MatchTier = "excellent" | "good" | "partial" | "unqualified" | null;

type SkillDebugInfo = { skillId: string; weight: number; rarityBonus: number };

type DebugInfo = {
  schoolSkills: SkillDebugInfo[];
  matchedSkills: SkillDebugInfo[];
};

type RecommendedProgram = {
  id: string;
  name: string;
  location: string;
  locationScore: number;
  username: string;
  avatar: string | null;
  matchScore: number;
  matchTier: MatchTier;
  matchedSkillsCount: number;
  totalSchoolSkills: number;
  matchedStylesCount: number;
  totalSchoolStyles: number;
  matchedSportsCount: number;
  totalSchoolSports: number;
  sameState: boolean;
  meetsGpaRequirement: boolean;
  gpa: number | null;
  debug?: DebugInfo;
};

type DancerProfile = {
  id: string;
  location: string | null;
  gpa: number | null;
  skills: string[];
  styles: string[];
  sports: string[];
};

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    profileId: string,
    options: { debug?: boolean } = {}
  ): Promise<RecommendedProgram[]> {
    const dancer = await this.getDancerProfile(profileId);
    if (!dancer || dancer.skills.length < 10) {
      return [];
    }

    const [schools, skillRarity] = await Promise.all([
      this.getSchools(profileId),
      this.getDancerSkillRarity(),
    ]);
    const scored = this.calculateScores(
      dancer,
      schools,
      skillRarity,
      options.debug
    );

    return scored.filter((s) => s.matchScore > 0);
  }

  /**
   * Get skill rarity based on how common each skill is relative to the most common skill.
   * Returns a map of skillId -> frequency percentage (0-1)
   * Most common skill = 1.0 (no bonus), rarest skills approach 0 (max bonus)
   */
  private async getDancerSkillRarity(): Promise<Map<string, number>> {
    const skillRarity = await this.db.use((db) =>
      db.query.skillRarity.findMany({
        columns: { skillId: true, rarity: true },
      })
    );

    return new Map(skillRarity.map((s) => [s.skillId, s.rarity]));
  }

  private async getDancerProfile(
    profileId: string
  ): Promise<DancerProfile | null> {
    const profile = await this.db.use((db) =>
      db.query.dancerProfiles.findFirst({
        where: { id: profileId },
        columns: { id: true, location: true, gpa: true },
        with: {
          skills: { columns: { slug: true } },
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
      skills: profile.skills.map((s) => s.slug),
      styles: profile.styles.map((s) => s.slug),
      sports: profile.sports.map((s) => s.slug),
    };
  }

  private async getSchools(dancerProfileId: string) {
    // Exclude schools the dancer already follows
    const followedSchools = await this.db.use((db) =>
      db.query.follows.findMany({
        where: { dancerId: dancerProfileId },
        columns: { schoolId: true },
      })
    );
    const followedIds = new Set(followedSchools.map((f) => f.schoolId));

    const schools = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: {
          user: { role: "user" },
        },
        columns: {
          id: true,
          name: true,
          location: true,
          gpa: true,
        },
        with: {
          user: { columns: { username: true, avatar: true } },
          schoolSkills: { columns: { skillId: true, weight: true } },
          styles: { columns: { slug: true } },
          sports: { columns: { slug: true } },
        },
      })
    );

    return schools.flatMap((school) => {
      if (!school.user || followedIds.has(school.id)) return [];
      return [{ ...school, user: school.user }];
    });
  }

  private calculateScores(
    dancer: DancerProfile,
    schools: Awaited<ReturnType<typeof this.getSchools>>,
    skillRarity: Map<string, number>,
    debug?: boolean
  ): RecommendedProgram[] {
    const dancerSkillSet = new Set(dancer.skills);
    const dancerStyleSet = new Set(dancer.styles);
    const dancerSportSet = new Set(dancer.sports);

    // Rarity bonus: rarer skills (fewer dancers have them) get higher bonus (0-3 pts)
    // 0% of dancers have skill = +3, 100% of dancers have skill = 0
    const getRarityBonus = (skillId: string) => {
      const percent = skillRarity.get(skillId) ?? 0;
      return percent;
    };

    const scored: RecommendedProgram[] = [];

    for (const school of schools) {
      const schoolSkills = school.schoolSkills;
      const schoolStyles = school.styles;
      const schoolSports = school.sports;

      const matchedSkills = schoolSkills.filter((s) =>
        dancerSkillSet.has(s.skillId)
      );
      const matchedStyles = schoolStyles.filter((s) =>
        dancerStyleSet.has(s.slug)
      );
      const matchedSports = schoolSports.filter((s) =>
        dancerSportSet.has(s.slug)
      );

      const sameState =
        dancer.location !== null && dancer.location === school.location;

      // Coverage bonus: reward schools with a higher percentage of skills matched
      const coverageRatio =
        schoolSkills.length > 0
          ? matchedSkills.length / schoolSkills.length
          : 0;
      const coverageBonus = coverageRatio * 10;

      // Skills: weight directly (1-5 pts based on importance)
      const skillScore = matchedSkills.reduce((sum, s) => {
        const weight = s.weight ?? 1;
        const rarity = getRarityBonus(s.skillId);

        // Base score + rarity bonus
        return sum + weight + weight * rarity;
      }, 0);

      // Styles: 3 pts each (limited to 3, high identity signal)
      // Sports: 0.5 pts each (nice-to-have, tiebreaker)
      const baseScore =
        skillScore + matchedStyles.length * 3 + matchedSports.length * 0.5;

      const locationScore = this.getLocationScore(
        dancer.location as StateCode,
        school.location as StateCode
      );

      const gpaBonus = this.getGpaBonus(dancer.gpa, school.gpa);
      console.log("gpaBonus", gpaBonus, dancer.gpa, school.gpa);

      const matchScore = baseScore + locationScore + coverageBonus + gpaBonus;

      // GPA check (informational, affects tier only)
      const meetsGpaRequirement =
        school.gpa === null ||
        (dancer.gpa !== null && dancer.gpa >= school.gpa);

      const matchTier: MatchTier = !meetsGpaRequirement
        ? "unqualified"
        : this.getMatchTier(matchScore);

      scored.push({
        id: school.id,
        name: school.name,
        location: school.location,
        locationScore,
        username: school.user.username,
        avatar: school.user.avatar,
        matchScore: Math.round(matchScore),
        matchTier,
        matchedSkillsCount: matchedSkills.length,
        totalSchoolSkills: schoolSkills.length,
        matchedStylesCount: matchedStyles.length,
        totalSchoolStyles: schoolStyles.length,
        matchedSportsCount: matchedSports.length,
        totalSchoolSports: schoolSports.length,
        sameState,
        meetsGpaRequirement,
        gpa: school.gpa,
        ...(debug && {
          debug: {
            schoolSkills: schoolSkills.map((s) => ({
              skillId: s.skillId,
              weight: s.weight ?? 1,
              rarityBonus: getRarityBonus(s.skillId),
            })),
            matchedSkills: matchedSkills.map((s) => ({
              skillId: s.skillId,
              weight: s.weight ?? 1,
              rarityBonus: getRarityBonus(s.skillId),
            })),
          },
        }),
      });
    }

    // Sort by raw match score
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
  }

  private getMatchTier(points: number): MatchTier {
    if (points >= 35) return "excellent";
    if (points >= 25) return "good";
    if (points >= 15) return "partial";
    return null;
  }

  private getLocationScore(dancerState: StateCode, schoolState: StateCode) {
    if (dancerState === schoolState) return 5;
    if (stateAdjacencies[dancerState]?.includes(schoolState)) return 3;
    if (stateRegions[dancerState] === stateRegions[schoolState]) return 1;
    return 0;
  }

  private getGpaBonus(dancerGpa: number | null, schoolGpa: number | null) {
    // No requirement or no dancer GPA = no bonus
    if (schoolGpa === null || dancerGpa === null) return 0;

    // Doesn't meet requirement = no bonus (or handle as disqualified elsewhere)
    if (dancerGpa < schoolGpa) return 0;

    // Reward based on how high the school's bar is
    // Higher requirement = more competitive program = better fit for strong students
    const maxBonus = 5;
    return (schoolGpa / 4.0) * maxBonus;
  }
}
