/**
 * email-status controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::email-status.email-status",
  ({ strapi }) => ({
    async find(ctx) {
      const queryParams = ctx.query;

      const emailStatus = await strapi.documents("api::email-status.email-status").findMany({
        ...queryParams,
        pagination: {
          pageSize: -1,
        },
        status: "published",
      });

      return ctx.send({ data: emailStatus });
    },
  })
);
