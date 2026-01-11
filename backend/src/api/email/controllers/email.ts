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

    async markUnRead(ctx) {
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

        if (emailStatus[0].is_read == true) {
          result = await strapi
            .documents("api::email-status.email-status")
            .update({
              documentId: emailStatus[0].documentId,
              data: {
                is_read: false,
                read_at: null,
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

    // Approve Surat Jalan
    async approveSuratJalan(ctx) {
      try {
        const { documentId } = ctx.params;
        const user = ctx.state.user;

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        // Ambil email dengan related email_statuses
        const email = await strapi.documents("api::email.email").findOne({
          documentId,
          populate: {
            surat_jalan: true,
            email_statuses: {
              populate: {
                user: {
                  populate: ["role"],
                },
              },
            },
          },
        });

        if (!email) {
          console.log("Ada kesalahan dalam request (email tidak ditemukan)");
          return ctx.notFound("Email not found");
        }

        // Update Email
        await strapi.documents("api::email.email").update({
          documentId,
          data: {
            isHaveStatus: true,
          },
          status: "published",
        });

        // Update Surat Jalan
        await strapi.documents("api::surat-jalan.surat-jalan").update({
          documentId: email.surat_jalan.documentId,
          data: {
            status_surat: "Approve",
          },
          status: "published",
        });

        // Reset is_read status pada semua email_status user Admin untuk email ini
        if (email.email_statuses && email.email_statuses.length > 0) {
          const adminStatusList = email.email_statuses.filter(
            (status) =>
              status.user &&
              status.user.role &&
              status.user.role.name === "Admin"
          );

          for (const adminStatus of adminStatusList) {
            await strapi.documents("api::email-status.email-status").update({
              documentId: adminStatus.documentId,
              data: {
                is_read: false,
              },
              status: "published",
            });
          }
        }

        console.log("Request Approve Berhasil ✅");

        return ctx.send({
          message: "Request Approve Berhasil ✅",
        });
      } catch (error) {
        console.error("Error in Approve:", error);
        return ctx.badRequest("Failed to approve surat", {
          error: error.message,
        });
      }
    },

    async approveBeritaBongkaran(ctx) {
      try {
        const { documentId } = ctx.params;
        const { signature, signaturePenerima } = ctx.request.body;
        const user = ctx.state.user;

        console.log("📥 Received data:", { signature, signaturePenerima });

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
          populate: {
            surat_jalan: {
              populate: {
                mengetahui: true,
                penerima: true,
              },
            },
            recipient: true,
            sender: true,
            email_statuses: {
              populate: {
                user: {
                  populate: ["role"],
                },
              },
            },
          },
        });

        const users = await strapi
          .documents("plugin::users-permissions.user")
          .findMany({
            populate: {
              role: true,
            },
          });

        const adminUser = users.find((item) => item.role.name == "Admin");
        const spvUser = users.find((item) => item.role.name == "Spv");

        if (!email) {
          console.log("❌ Email tidak ditemukan");
          return ctx.notFound("Email not found");
        }

        // Update email
        await strapi.documents("api::email.email").update({
          documentId: documentId,
          data: {
            recipient: `${adminUser.documentId}`,
            isHaveStatus: true,
          },
          status: "published",
        });

        // ===== PERBAIKAN UTAMA: Ambil data existing dulu =====
        const existingMengetahui = email.surat_jalan.mengetahui || {};
        console.log("Existing mengetahui", existingMengetahui);
        const existingPenerima = email.surat_jalan.penerima || {};

        // Cek apakah existingMengetahui dan existingPenerima benar-benar ada (bukan empty object)
        const hasMengetahui =
          existingMengetahui &&
          Object.keys(existingMengetahui).length > 0 &&
          !signaturePenerima;
        console.log("Has Mnegetahui", hasMengetahui);
        const hasPenerima =
          signaturePenerima &&
          Object.keys(existingPenerima).length > 0 &&
          !signature;

        // Tentukan status_surat berdasarkan kondisi:
        // - Jika existingMengetahui ada → "In Progress"
        // - Jika existingMengetahui tidak ada tetapi existingPenerima ada → "Approve"
        let statusSurat = null;
        if (hasMengetahui) {
          statusSurat = "In Progress";
        } else if (hasPenerima) {
          statusSurat = "Approve";
        }

        // ===== UPDATE SURAT JALAN =====
        await strapi.documents("api::surat-jalan.surat-jalan").update({
          documentId: email.surat_jalan.documentId,
          data: {
            ...(statusSurat && { status_surat: statusSurat }),
            ...(signature && {
              mengetahui: {
                ...existingMengetahui,
                ttd_mengetahui: signature,
              },
            }),
            ...(signaturePenerima && {
              penerima: {
                ...existingPenerima,
                ttd_penerima: signaturePenerima,
              },
            }),
          },
          status: "published",
        });

        let email_statuses = email.email_statuses.filter(
          (item) => item.user.role.name === "Vendor"
        );

        // Reset is_read untuk Vendor
        if (email_statuses.length > 0) {
          await strapi.documents("api::email-status.email-status").update({
            documentId: email_statuses[0].documentId,
            data: {
              is_read: false,
            },
            status: "published",
          });
        }

        // Create new email status for Spv (jika belum ada)
        const hasSpvStatus = email.email_statuses.find(
          (item) => item.user.documentId === spvUser.documentId
        );

        if (!hasSpvStatus && spvUser) {
          await strapi.documents("api::email-status.email-status").create({
            data: {
              email: email.documentId,
              user: `${spvUser.documentId}`,
            },
            status: "published",
          });
        }

        // Hanya create email status untuk Admin jika existingMengetahui ada
        const hasAdminStatus = email.email_statuses.find(
          (item) => item.user.documentId === adminUser.documentId
        );

        if (!hasAdminStatus && hasMengetahui) {
          await strapi.documents("api::email-status.email-status").create({
            data: {
              email: email.documentId,
              user: `${adminUser.documentId}`,
            },
            status: "published",
          });
        }

        return ctx.send({
          message: "Request Approve Berhasil ✅",
          data: {
            emailId: email.documentId,
            status: "Approve",
          },
        });
      } catch (error) {
        console.error("❌ Error in Approve:", error);
        return ctx.badRequest("Failed to approve surat", {
          error: error.message,
        });
      }
    },

    // Reject Surat Jalan
    async rejectSuratJalan(ctx) {
      try {
        const { documentId } = ctx.params;
        const { pesan } = ctx.request.body;
        const user = ctx.state.user;

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const users = await strapi
          .documents("plugin::users-permissions.user")
          .findMany({
            populate: {
              role: true,
            },
          });

        const adminUser = users.find((item) => item.role.name == "Admin");

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
          populate: {
            surat_jalan: true,
          },
        });

        let emailStatus = await strapi
          .documents("api::email-status.email-status")
          .findMany({
            filters: {
              email: {
                documentId: email.documentId,
              },
              user: {
                documentId: `${adminUser.documentId}`,
              },
            },
          });

        if (email) {
          await strapi.documents("api::email.email").update({
            documentId: documentId,
            data: {
              isHaveStatus: true,
              pesan,
            },
            status: "published",
          });

          await strapi.documents("api::surat-jalan.surat-jalan").update({
            documentId: email.surat_jalan.documentId,
            data: {
              status_surat: "Reject",
            },
            status: "published",
          });

          await strapi.documents("api::email-status.email-status").update({
            documentId: emailStatus[0].documentId,
            data: {
              is_read: false,
            },
          });

          console.log("Request Approve Berhasil ✅");
        } else {
          console.log("Ada kesalahan dalam request");
        }

        return ctx.send({
          message: "Request Approve Berhasil ✅",
        });
      } catch (error) {
        console.error("Error in Approve:", error);
        return ctx.badRequest("Failed to approve surat", {
          error: error.message,
        });
      }
    },

    async rejectBeritaBongkaran(ctx) {
      try {
        const { documentId } = ctx.params;
        const { pesan } = ctx.request.body;
        const user = ctx.state.user;

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
          populate: {
            surat_jalan: true,
            recipient: true,
            sender: true,
            email_statuses: {
              populate: {
                user: {
                  populate: ["role"],
                },
              },
            },
          },
        });

        if (email) {
          await strapi.documents("api::email.email").update({
            documentId: documentId,
            data: {
              isHaveStatus: true,
              pesan,
            },

            status: "published",
          });

          await strapi.documents("api::surat-jalan.surat-jalan").update({
            documentId: email.surat_jalan.documentId,
            data: {
              status_surat: "Reject",
            },
            status: "published",
          });

          let email_statuses = email.email_statuses.filter(
            (item) => item.user.role.name === "Vendor"
          );

          await strapi.documents("api::email-status.email-status").update({
            documentId: email_statuses[0].documentId,
            data: {
              is_read: false,
            },
            status: "published",
          });

          console.log("Request Approve Berhasil ✅");
        } else {
          console.log("Ada kesalahan dalam request");
        }

        return ctx.send({
          message: "Request Approve Berhasil ✅",
        });
      } catch (error) {
        console.error("Error in Approve:", error);
        return ctx.badRequest("Failed to approve surat", {
          error: error.message,
        });
      }
    },

    async approveBeritaPemeriksaan(ctx) {
      try {
        const { documentId } = ctx.params;
        const { signaturePenyediaBarang, signaturesMengetahui } =
          ctx.request.body;
        const user = ctx.state.user;

        console.log("📥 Received data:", {
          signaturePenyediaBarang,
          signaturesMengetahui,
        });

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const users = await strapi
          .documents("plugin::users-permissions.user")
          .findMany({
            populate: {
              role: true,
            },
          });

        const spvUser = users.find((item) => item.role.name == "Spv");

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
          populate: {
            surat_jalan: {
              populate: {
                penyedia_barang: true,
                pemeriksa_barang: {
                  populate: {
                    mengetahui: true,
                  },
                },
              },
            },
            recipient: true,
            sender: true,
            email_statuses: {
              populate: {
                user: {
                  populate: ["role"],
                },
              },
            },
          },
        });

        if (!email) {
          console.log("❌ Email tidak ditemukan");
          return ctx.notFound("Email not found");
        }

        // Update email
        await strapi.documents("api::email.email").update({
          documentId: documentId,
          data: {
            isHaveStatus: true,
          },
          status: "published",
        });

        // Update surat jalan
        await strapi.documents("api::surat-jalan.surat-jalan").update({
          documentId: email.surat_jalan.documentId,
          data: {
            status_surat: "Approve",
          },
          status: "published",
        });

        // Reset is_read untuk Admin (sender)
        let email_statuses = email.email_statuses.filter(
          (item) => item.user.role.name === "Admin"
        );

        if (email_statuses.length > 0) {
          await strapi.documents("api::email-status.email-status").update({
            documentId: email_statuses[0].documentId,
            data: {
              is_read: false,
            },
            status: "published",
          });
        }

        // Create new email status for Spv (jika belum ada)
        const hasSpvStatus = email.email_statuses.find(
          (item) => item.user.documentId === spvUser.documentId
        );

        if (!hasSpvStatus && spvUser) {
          await strapi.documents("api::email-status.email-status").create({
            data: {
              email: email.documentId,
              user: spvUser.documentId,
            },
            status: "published",
          });
        }

        return ctx.send({
          message: "Request Approve Berhasil ✅",
          data: {
            emailId: email.documentId,
            status: "Approve",
          },
        });
      } catch (error) {
        console.error("❌ Error in Approve Berita Pemeriksaan:", error);
        return ctx.badRequest("Failed to approve berita pemeriksaan", {
          error: error.message,
        });
      }
    },

    async rejectBeritaPemeriksaan(ctx) {
      try {
        const { documentId } = ctx.params;
        const { pesan } = ctx.request.body;
        const user = ctx.state.user;

        // Validasi user
        if (!user) {
          return ctx.unauthorized(
            "You must be logged in to perform this action"
          );
        }

        const email = await strapi.documents("api::email.email").findOne({
          documentId: documentId,
          populate: {
            surat_jalan: true,
            recipient: true,
            sender: true,
            email_statuses: {
              populate: {
                user: {
                  populate: ["role"],
                },
              },
            },
          },
        });

        if (!email) {
          console.log("❌ Email tidak ditemukan");
          return ctx.notFound("Email not found");
        }

        // Update email
        await strapi.documents("api::email.email").update({
          documentId: documentId,
          data: {
            isHaveStatus: true,
            pesan,
          },
          status: "published",
        });

        // Update surat jalan status menjadi Reject
        await strapi.documents("api::surat-jalan.surat-jalan").update({
          documentId: email.surat_jalan.documentId,
          data: {
            status_surat: "Reject",
          },
          status: "published",
        });

        // Reset is_read untuk Admin (sender)
        let email_statuses = email.email_statuses.filter(
          (item) => item.user.role.name === "Admin"
        );

        if (email_statuses.length > 0) {
          await strapi.documents("api::email-status.email-status").update({
            documentId: email_statuses[0].documentId,
            data: {
              is_read: false,
            },
            status: "published",
          });
        }

        console.log("Request Reject Berhasil ✅");

        return ctx.send({
          message: "Request Reject Berhasil ✅",
          data: {
            emailId: email.documentId,
            status: "Reject",
          },
        });
      } catch (error) {
        console.error("❌ Error in Reject Berita Pemeriksaan:", error);
        return ctx.badRequest("Failed to reject berita pemeriksaan", {
          error: error.message,
        });
      }
    },
  })
);
