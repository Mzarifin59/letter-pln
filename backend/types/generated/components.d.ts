import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalMaterial extends Struct.ComponentSchema {
  collectionName: 'components_global_materials';
  info: {
    displayName: 'material';
  };
  attributes: {
    jumlah: Schema.Attribute.Integer;
    katalog: Schema.Attribute.String;
    keterangan: Schema.Attribute.String;
    nama: Schema.Attribute.String;
    satuan: Schema.Attribute.Enumeration<['PCS (Pieces)', 'Kg (Kilogram)']>;
  };
}

export interface GlobalPenerima extends Struct.ComponentSchema {
  collectionName: 'components_global_penerimas';
  info: {
    displayName: 'penerima';
  };
  attributes: {
    nama_penerima: Schema.Attribute.String;
    perusahaan_penerima: Schema.Attribute.String;
    ttd_penerima: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

export interface GlobalPengirim extends Struct.ComponentSchema {
  collectionName: 'components_global_pengirims';
  info: {
    displayName: 'pengirim';
  };
  attributes: {
    departemen_pengirim: Schema.Attribute.String;
    nama_pengirim: Schema.Attribute.String;
    ttd_pengirim: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.material': GlobalMaterial;
      'global.penerima': GlobalPenerima;
      'global.pengirim': GlobalPengirim;
    }
  }
}
