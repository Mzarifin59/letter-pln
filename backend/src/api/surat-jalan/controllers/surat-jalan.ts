/**
 * surat-jalan controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::surat-jalan.surat-jalan",
  ({ strapi }) => ({
    async find(ctx) {
      const queryParams = ctx.query;

      const suratJalan = await strapi
        .documents("api::surat-jalan.surat-jalan")
        .findMany({
          ...queryParams,
          limit: -1,
        });

      return ctx.send({ data: suratJalan });
    },
  })
);
