export default {
  async beforeDelete(event) {
    const { where } = event.params;
    const recordId = where.id;

    if (!recordId) {
      console.log("No record ID provided for delete.");
      return;
    }

    // Ambil surat jalan beserta relasi emails menggunakan id
    const suratJalan = await strapi
      .documents("api::surat-jalan.surat-jalan")
      .findFirst({
        filters: {
          id: recordId,
        },
        populate: {
          emails: true,
        },
      });

    // Cek apakah surat jalan ditemukan
    if (!suratJalan) {
      console.log(`Surat jalan with id ${recordId} not found.`);
      return;
    }

    // Cek apakah ada emails yang terelasi
    if (!suratJalan?.emails || suratJalan.emails.length === 0) {
      console.log("No emails found for this surat jalan.");
      return;
    }

    // Loop untuk setiap email
    for (const emailRelation of suratJalan.emails) {
      // Ambil detail email beserta email_statuses
      const email = await strapi.documents("api::email.email").findOne({
        documentId: emailRelation.documentId,
        populate: {
          email_statuses: true,
        },
      });

      if (!email) {
        console.log(
          `Email with documentId ${emailRelation.documentId} not found.`
        );
        continue;
      }

      // Hapus semua email_statuses yang terelasi
      if (email.email_statuses && email.email_statuses.length > 0) {
        for (const emailStatus of email.email_statuses) {
          await strapi.documents("api::email-status.email-status").delete({
            documentId: emailStatus.documentId,
          });
          console.log(`Deleted email status: ${emailStatus.documentId}`);
        }
      }

      // Hapus email
      await strapi.documents("api::email.email").delete({
        documentId: email.documentId,
      });
      console.log(`Deleted email: ${email.documentId}`);
    }

    console.log("All related emails and email statuses have been deleted.");
  },
};