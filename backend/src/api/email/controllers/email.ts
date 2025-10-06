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
      try {
        const { documentId } = ctx.params;
        const user = ctx.state.user;

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
        });

        let emailStatus = await strapi
          .documents("api::email-status.email-status")
          .findMany({
            filters: {
              email: {
                documentId: email.documentId,
              },
              user: {
                documentId: user.documentId,
              },
            },
          });

        let result;

        if (emailStatus[0].is_read == false) {
          result = await strapi
            .documents("api::email-status.email-status")
            .update({
              documentId: emailStatus[0].documentId,
              data: {
                is_read: true,
                read_at: new Date(),
              },
              status : 'published',
            });
        }

        return ctx.send({
          data: result,
          message: "Email marked as read successfully",
        });
      } catch (error) {
        console.error("Error in markAsRead:", error);
        return ctx.badRequest("Failed to mark email as read", {
          error: error.message,
        });
      }
    },

    async markAsBookmarked(ctx) {
      try {
        const { documentId } = ctx.params;
        const user = ctx.state.user;

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
        });

        let emailStatus = await strapi
          .documents("api::email-status.email-status")
          .findMany({
            filters: {
              email: {
                documentId: email.documentId,
              },
              user: {
                documentId: user.documentId,
              },
            },
          });

        let result;

        if (emailStatus[0].is_read == false) {
          result = await strapi
            .documents("api::email-status.email-status")
            .update({
              documentId: emailStatus[0].documentId,
              data: {
                is_bookmarked: true,
                bookmarked_at: new Date(),
              },
              status : 'published',
            });
        }

        return ctx.send({
          data: result,
          message: "Email marked as bookmarked successfully",
        });
      } catch (error) {
        console.error("Error in markAsBookmarked:", error);
        return ctx.badRequest("Failed to mark email as bookmarked", {
          error: error.message,
        });
      }
    },
  })
);
