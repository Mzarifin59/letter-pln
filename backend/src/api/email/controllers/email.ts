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
              status: "published",
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

        console.log("EmailStatus:", emailStatus);

        let result;

        if (emailStatus[0].is_bookmarked == false) {
          result = await strapi
            .documents("api::email-status.email-status")
            .update({
              documentId: emailStatus[0].documentId,
              data: {
                is_bookmarked: true,
                bookmarked_at: new Date(),
              },
              status: "published",
            });
        } else {
          result = await strapi
            .documents("api::email-status.email-status")
            .update({
              documentId: emailStatus[0].documentId,
              data: {
                is_bookmarked: false,
                bookmarked_at: null,
              },
              status: "published",
            });
        }

        console.log("result:", result);

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

    async deleteEmail(ctx) {
      try {
        const { documentId } = ctx.params;

        if (!documentId) {
          return ctx.badRequest("Missing email documentId");
        }

        const email = await strapi.documents("api::email.email").findOne({
          documentId,
          populate: ["surat_jalan"],
        });

        if (!email) {
          return ctx.notFound("Email not found");
        }

        const emailStatuses = await strapi
          .documents("api::email-status.email-status")
          .findMany({
            filters: {
              email: { documentId },
            },
          });

        for (const status of emailStatuses) {
          await strapi
            .documents("api::email-status.email-status")
            .delete({ documentId: status.documentId });
        }

        // Hapus email itu sendiri
        await strapi.documents("api::email.email").delete({ documentId });

        return ctx.send({
          message: "Email and related statuses deleted successfully",
          data: {
            deletedEmail: documentId,
            deletedStatuses: emailStatuses.map((s) => s.documentId),
          },
        });
      } catch (error) {
        console.error("Error deleting email:", error);
        return ctx.internalServerError("Failed to delete email", {
          error: error.message,
        });
      }
    },
  })
);
