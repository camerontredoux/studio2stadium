import transmit from "@adonisjs/transmit/services/main";

transmit.authorize<{ slug: string }>(
  "orgs/:slug/callbacks",
  async (ctx, { slug }) => {
    if (!ctx.auth.user) return false;
    const org = ctx.org;
    if (!org || org.slug !== slug) return false;
    const membership = ctx.orgMembership;
    return membership?.role === "admin";
  }
);
