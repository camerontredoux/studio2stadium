import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";
const UpdateAchievementController = () =>
  import("./profile/update-achievement/controller.ts");
const UpdateReferenceController = () =>
  import("./profile/update-reference/controller.ts");
const GetDancersController = () =>
  import("./explore/get-dancers/controller.ts");
const GetSportsController = () => import("./profile/get-sports/controller.ts");
const UpdateSportsController = () =>
  import("./profile/update-sports/controller.ts");
const GetStylesController = () => import("./profile/get-styles/controller.ts");
const UpdateStylesController = () =>
  import("./profile/update-styles/controller.ts");
const GetSubmissionVideoController = () =>
  import("./common-recruiting/get-submission-video/controller.ts");
const GetSubmissionSchoolsController = () =>
  import("./common-recruiting/get-submission-schools/controller.ts");
const GetSubmissionsController = () =>
  import("./common-recruiting/get-submissions/controller.ts");
const GetDancerController = () => import("./profile/get-dancer/controller.ts");
const GetFiltersController = () =>
  import("./explore/get-dancer-filters/controller.ts");
const CreateDancerController = () =>
  import("./profile/create-dancer/controller.ts");
const GetFollowingController = () =>
  import("./engagement/get-following/controller.ts");
const UpdatePortfolioController = () =>
  import("./profile/update-portfolio/controller.ts");
const GetFollowersController = () =>
  import("./engagement/get-followers/controller.ts");
const GetFollowingIdsController = () =>
  import("./engagement/get-following-ids/controller.ts");
const FavoriteDancerController = () =>
  import("./engagement/favorite/controller.ts");
const UnfavoriteDancerController = () =>
  import("./engagement/unfavorite/controller.ts");
const GetMetadataController = () =>
  import("./profile/get-dancer-metadata/controller.ts");
const GetSkillsController = () => import("./profile/get-skills/controller.ts");
const UpdateSkillsController = () =>
  import("./profile/update-skills/controller.ts");
const CreateSubmissionController = () =>
  import("./common-recruiting/create-submission/controller.ts");
const EditSubmissionController = () =>
  import("./common-recruiting/edit-submission/controller.ts");
const GetChecklistController = () =>
  import("./profile/get-profile-checklist/controller.ts");
const CreateReferenceController = () =>
  import("./profile/create-reference/controller.ts");
const CreateAchievementController = () =>
  import("./profile/create-achievement/controller.ts");
const DeleteAchievementController = () =>
  import("./profile/delete-achievement/controller.ts");
const DeleteReferenceController = () =>
  import("./profile/delete-reference/controller.ts");

router
  .group(() => {
    router.post("", [CreateDancerController]).openapi({
      summary: "Create a dancer",
      description:
        "Populate account with personal information to finish dancer signup",
    });

    router.get("filters", [GetFiltersController]).openapi({
      summary: "Get dancer filters",
      description: "Returns the filters to use when searching for dancers",
    });

    router.get("", [GetDancersController]).openapi({
      summary: "Get dancers",
      description: "Returns a list of dancers",
    });

    router
      .group(() => {
        router.patch("", [UpdatePortfolioController]).openapi({
          summary: "Update my portfolio",
          description: "Updates the authenticated dancer's portfolio",
        });
        router.get("skills", [GetSkillsController]).openapi({
          summary: "Get dancer skills",
          description: "Returns the dancer's skills",
        });
        router.patch("skills", [UpdateSkillsController]).openapi({
          summary: "Update dancer skills",
          description: "Updates the dancer's skills",
        });
        router.get("styles", [GetStylesController]).openapi({
          summary: "Get dancer styles",
          description: "Returns the dancer's styles",
        });
        router.patch("styles", [UpdateStylesController]).openapi({
          summary: "Update dancer styles",
          description: "Updates the dancer's styles",
        });
        router.get("sports", [GetSportsController]).openapi({
          summary: "Get dancer sports",
          description: "Returns the dancer's sports",
        });
        router.patch("sports", [UpdateSportsController]).openapi({
          summary: "Update dancer sports",
          description: "Updates the dancer's sports",
        });
        router.get("following", [GetFollowingController]).openapi({
          summary: "Get following list",
          description: "Returns the list of school's IDs I'm following",
        });
        router.get("following/ids", [GetFollowingIdsController]).openapi({
          summary: "Get following list IDs",
          description: "Returns the list of school's IDs I'm following",
        });
        router.get("followers", [GetFollowersController]).openapi({
          summary: "Get dancer followers",
          description: "Returns the schools that have favorited this dancer.",
        });
        router.get("checklist", [GetChecklistController]).openapi({
          summary: "Get dancer profile checklist",
          description: "Returns the dancer's profile checklist",
        });
      })
      .prefix("me")
      .use(middleware.dancer());

    router
      .group(() => {
        router.get("", [GetSubmissionsController]).openapi({
          summary: "Get dancer's CRV submissions",
          description:
            "Returns the common recruiting video submissions for the authenticated dancer",
        });
        router.post("", [CreateSubmissionController]).openapi({
          summary: "Create a CRV submission",
          description:
            "Creates a common recruiting video submission for the authenticated dancer",
        });
        router.patch("video", [EditSubmissionController]).openapi({
          summary: "Edit the dancer's submission video",
          description:
            "Updates the YouTube URL for the dancer's common recruiting video",
        });
        router.get("schools", [GetSubmissionSchoolsController]).openapi({
          summary: "Get schools that the dancer has not submitted to",
          description:
            "Returns the schools that the dancer has not submitted to",
        });
        router.get("video", [GetSubmissionVideoController]).openapi({
          summary: "Get the dancer's submission video",
          description: "Returns the dancer's submission video",
        });
      })
      .use(middleware.dancer())
      .prefix("submissions");

    router.get(":username", [GetDancerController]).openapi({
      summary: "Get a dancer",
      description: "Returns the dancer's public profile",
    });

    router
      .post(":id/favorite", [FavoriteDancerController])
      .openapi({
        summary: "Favorite a dancer",
        description: "Adds a dancer to the school's favorites list.",
      })
      .use([throttle("favorite", 60), middleware.school()]);

    router
      .delete(":id/favorite", [UnfavoriteDancerController])
      .openapi({
        summary: "Unfavorite a dancer",
        description: "Removes a dancer from the school's favorites list.",
      })
      .use([throttle("unfavorite", 60), middleware.school()]);

    router
      .get(":id/metadata", [GetMetadataController])
      .openapi({
        summary: "Get dancer metadata",
        description: "Returns the dancer's metadata",
      })
      .use(middleware.school());
  })
  .use(middleware.auth())
  .prefix("dancers")
  .openapi({ tags: ["Dancers"] });

router
  .group(() => {
    router.post("", [CreateReferenceController]).openapi({
      summary: "Create a reference",
      description: "Creates a reference for the authenticated dancer",
    });
    router.delete(":id", [DeleteReferenceController]).openapi({
      summary: "Delete a reference",
      description: "Deletes a reference for the authenticated dancer",
    });
    router.patch(":id", [UpdateReferenceController]).openapi({
      summary: "Update a reference",
      description: "Updates a reference for the authenticated dancer",
    });
  })
  .use([middleware.auth(), middleware.dancer()])
  .prefix("dancers/references")
  .openapi({ tags: ["References"] });

router
  .group(() => {
    router.post("achievements", [CreateAchievementController]).openapi({
      summary: "Create an achievement",
      description: "Creates an achievement for the authenticated dancer",
    });
    router.delete("achievements/:id", [DeleteAchievementController]).openapi({
      summary: "Delete an achievement",
      description: "Deletes an achievement for the authenticated dancer",
    });
    router.patch("achievements/:id", [UpdateAchievementController]).openapi({
      summary: "Update an achievement",
      description: "Updates an achievement for the authenticated dancer",
    });
  })
  .use([middleware.auth(), middleware.dancer()])
  .prefix("dancers/achievements")
  .openapi({ tags: ["Achievements"] });
