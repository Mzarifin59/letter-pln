export default {
  routes: [
    {
      method: 'PUT',
      path: '/emails/:id/mark-read',
      handler: 'email.markAsRead',
    },
  ]
};