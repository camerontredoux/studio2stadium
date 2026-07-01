import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";
const UpdateProgramController = () => import("./update-program/controller.ts");
const UpdateFavoriteController = () =>
  import("./update-favorite/controller.ts");
const GetSkillsController = () => import("./get-skills/controller.ts");
const UpdateSkillsController = () => import("./update-skills/controller.ts");
const GetStylesController = () => import("./get-styles/controller.ts");
const UpdateStylesController = () => import("./update-styles/controller.ts");
const GetSportsController = () => import("./get-sports/controller.ts");
const UpdateSportsController = () => import("./update-sports/controller.ts");
const GetFavoritesDataController = () =>
  import("./get-favorites-data/controller.ts");
const GetFiltersController = () => import("./get-school-filters/controller.ts");
const GetSchoolsController = () => import("./get-schools/controller.ts");
const GetSchoolController = () => import("./get-school/controller.ts");
const FollowSchoolController = () => import("./follow/controller.ts");
const UnfollowSchoolController = () => import("./unfollow/controller.ts");
const GetMetadataController = () =>
  import("./get-school-metadata/controller.ts");
const ShowInterestController = () => import("./show-interest/controller.ts");
const GetFollowersController = () => import("./get-followers/controller.ts");
const GetFollowingController = () => import("./get-following/controller.ts");
const GetRecommendedProgramsController = () =>
  import("./get-recommended-programs/controller.ts");
const GetFollowingIdsController = () =>
  import("./get-following-ids/controller.ts");
const CheckSchoolAvailabilityController = () =>
  import("./check-name-availability/controller.ts");
const EventAccessController = () =>
  import("./event-access/controller.ts");
const GetSubmissionsController = () =>
  import("./get-submissions/controller.ts");
const UpdateSubmissionController = () =>
  import("./update-submission/controller.ts");
const ViewDancerController = () => import("./view-dancer/controller.ts");
const ListPendingClaimsController = () =>
  import("./pending-claims/controller.ts");
const ClaimRosterController = () =>
  import("./pending-claims/claim-controller.ts");
const DismissClaimController = () =>
  import("./pending-claims/dismiss-controller.ts");

router
  .group(() => {
    router
      .get("check-availability", [CheckSchoolAvailabilityController])
      .openapi({
        summary: "Check school name availability",
        description: "Checks if a school name is available for registration.",
      })
      .use(throttle("check-school-availability", 20));
  })
  .prefix("schools")
  .openapi({ tags: ["Schools"] });

router
  .group(() => {
    router.get("filters", [GetFiltersController]).openapi({
      summary: "Get school filters",
      description: "Returns the filters to use when searching for schools",
    });

    router
      .get("", [GetSchoolsController])
      .openapi({
        summary: "Get schools",
        description: "Returns a list of schools",
      })
      .use([middleware.dancer()]);

    router
      .get("recommended", [GetRecommendedProgramsController])
      .openapi({
        summary: "Get recommended programs",
        description: "Returns a list of recommended programs",
      })
      .use([middleware.dancer()]);

    router
      .group(() => {
        router.patch("", [UpdateProgramController]).openapi({
          summary: "Update my school",
          description: "Updates the authenticated school's program information",
        });
        router.get("followers", [GetFollowersController]).openapi({
          summary: "Get school followers",
          description: "Returns the dancers that have followed this school.",
        });
        router.get("following/ids", [GetFollowingIdsController]).openapi({
          summary: "Get following list IDs",
          description:
            "Returns the list of dancer's IDs this school has favorited",
        });
        router.get("following", [GetFollowingController]).openapi({
          summary: "Get following list",
          description: "Returns the list of dancers this school has favorited.",
        });
        router.get("favorites", [GetFavoritesDataController]).openapi({
          summary: "Get favorites data",
          description: "Returns the data for the school's favorites",
        });
        router.patch("favorites/:id", [UpdateFavoriteController]).openapi({
          summary: "Update a favorite",
          description: "Updates a favorite for the school",
        });
        router.get("skills", [GetSkillsController]).openapi({
          summary: "Get school skills",
          description: "Returns the school's skills",
        });
        router.patch("skills", [UpdateSkillsController]).openapi({
          summary: "Update school skills",
          description: "Updates the school's skills",
        });
        router.get("styles", [GetStylesController]).openapi({
          summary: "Get school styles",
          description: "Returns the school's styles",
        });
        router.patch("styles", [UpdateStylesController]).openapi({
          summary: "Update school styles",
          description: "Updates the school's styles",
        });
        router.get("sports", [GetSportsController]).openapi({
          summary: "Get school sports",
          description: "Returns the school's sports",
        });
        router.patch("sports", [UpdateSportsController]).openapi({
          summary: "Update school sports",
          description: "Updates the school's sports",
        });
        router.get("submissions", [GetSubmissionsController]).openapi({
          summary: "Get CRV submissions",
          description: "Returns dancer submissions to this school",
        });
        router.patch("submissions/:id", [UpdateSubmissionController]).openapi({
          summary: "Update CRV submission",
          description: "Updates status or watched state of a submission",
        });
        router.post("view-dancer/:id", [ViewDancerController]).openapi({
          summary: "Record profile view",
          description: "Records that the school viewed a dancer's profile",
        });
        router.get("pending-claims", [ListPendingClaimsController]).openapi({
          summary: "List pending roster claims",
          description:
            "Returns pending coach roster rows that may belong to this school (Path D claim banner).",
        });
        router
          .post("pending-claims/:rosterId/claim", [ClaimRosterController])
          .openapi({
            summary: "Claim a roster row",
            description:
              "Links a pending coach roster row to the authenticated school account.",
          });
        router
          .post("pending-claims/:rosterId/dismiss", [DismissClaimController])
          .openapi({
            summary: "Dismiss a suggested claim",
            description:
              "Records that the school dismissed a suggested roster claim.",
          });
      })
      .prefix("me")
      .use([middleware.school()]);

    router.get("/:username", [GetSchoolController]).openapi({
      summary: "Get a school",
      description: "Returns the school's public profile",
    });

    router
      .get("/:username/event-access", [EventAccessController])
      .openapi({
        summary: "Check event access to school",
        description:
          "Returns whether the current dancer has event-based access to view this school profile.",
      })
      .use([middleware.dancer()]);

    router
      .post("/:id/follow", [FollowSchoolController])
      .openapi({
        summary: "Follow a school",
        description: "Follows the school's profile using the school ID",
      })
      .use([middleware.dancer(), throttle("follow", 60)]);

    router
      .delete("/:id/follow", [UnfollowSchoolController])
      .openapi({
        summary: "Unfollow a school",
        description: "Unfollows the school's profile using the school ID",
      })
      .use([middleware.dancer(), throttle("unfollow", 30)]);

    router
      .get("/:id/metadata", [GetMetadataController])
      .openapi({
        summary: "Get school metadata",
        description: "Returns the school's metadata",
      })
      .use([middleware.dancer()]);

    router
      .post("/:id/interest", [ShowInterestController])
      .openapi({
        summary: "Show interest in a school",
        description:
          "A dancer can show interest in a school up to 3 times. This endpoint will increment the interest count for the school, and send a notification to the school.",
      })
      .use([middleware.dancer(), middleware.subscribed()]);
  })
  .use(middleware.auth())
  .prefix("schools")
  .openapi({ tags: ["Schools"] });
