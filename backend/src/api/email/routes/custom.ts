export default {
  routes: [
    {
      method: "PUT",
      path: "/emails/:documentId/mark-read",
      handler: "email.markAsRead",
    },
    {
      method: "PUT",
      path: "/emails/:documentId/mark-bookmarked",
      handler: "email.markAsBookmarked",
    },
    {
      method: "DELETE",
      path: "/emails/:documentId",
      handler: "email.deleteEmail",
    },
    {
      method: "PUT",
      path: "/emails/approve/:documentId",
      handler: "email.approveSuratJalan",
    },
    {
      method: "PUT",
      path: "/emails/reject/:documentId",
      handler: "email.rejectSuratJalan",
    },
    {
      method: "PUT",
      path: "/emails/approveberitabongkaran/:documentId",
      handler: "email.approveBeritaBongkaran",
    },
    {
      method: "PUT",
      path: "/emails/rejectberitabongkaran/:documentId",
      handler: "email.rejectBeritaBongkaran",
    },
  ],
};
