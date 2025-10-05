/**
 * email controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::email.email",
  ({ strapi }) => ({
    async find(ctx) {
      const queryParams = ctx.query;

      const emails = await strapi.documents("api::email.email").findMany({
        ...queryParams,
        pagination: {
          pageSize: -1,
        },
        status: "published",
      });

      return ctx.send({ data: emails });
    },

    async markAsRead(ctx) {
      const { documentId } = ctx.params;
      const user = ctx.state.user;

      let emailStatus = await strapi
        .documents("api::email-status.email-status")
        .findMany({
          filters: {
            email: {
              documentId: documentId,
            },
            user: {
              documentId: user.documentId,
            },
          },
        });

      let result;

      if (emailStatus.length === 0) {
        result = await strapi
          .documents("api::email-status.email-status")
          .create({
            data: {
              email: documentId,
              user: user.documentId,
              is_read: true,
              read_at: new Date(),
            },
          });
      } else {
        result = await strapi
          .documents("api::email-status.email-status")
          .update({
            documentId: emailStatus[0].documentId,
            data: {
              is_read: true,
              read_at: new Date(),
            },
          });
      }

      return result;
    },
  })
);
