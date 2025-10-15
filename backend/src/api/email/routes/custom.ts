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
  ],
};
