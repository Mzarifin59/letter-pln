import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalMaterial extends Struct.ComponentSchema {
  collectionName: 'components_global_materials';
  info: {
    displayName: 'material';
  };
  attributes: {
    isPemeriksaan: Schema.Attribute.Boolean;
    jumlah: Schema.Attribute.Integer;
    katalog: Schema.Attribute.String;
    keterangan: Schema.Attribute.String;
    lokasi: Schema.Attribute.String;
    nama: Schema.Attribute.String;
    satuan: Schema.Attribute.Enumeration<
      ['Keping', 'PCS ', 'Kg ', 'Meter', 'Liter', 'Bh', 'Set', 'Unit']
    >;
    serial_number: Schema.Attribute.String;
    tipe: Schema.Attribute.String;
  };
}

export interface GlobalMengetahui extends Struct.ComponentSchema {
  collectionName: 'components_global_mengetahuis';
  info: {
    displayName: 'mengetahui';
  };
  attributes: {
    departemen_mengetahui: Schema.Attribute.String;
    nama_mengetahui: Schema.Attribute.String;
    ttd_mengetahui: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

export interface GlobalPemeriksaBarang extends Struct.ComponentSchema {
  collectionName: 'components_global_pemeriksa_barangs';
  info: {
    displayName: 'pemeriksa_barang';
  };
  attributes: {
    departemen_pemeriksa: Schema.Attribute.String;
    mengetahui: Schema.Attribute.Component<'global.mengetahui', true>;
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

export interface GlobalPenyediaBarang extends Struct.ComponentSchema {
  collectionName: 'components_global_penyedia_barangs';
  info: {
    displayName: 'penyedia_barang';
  };
  attributes: {
    nama_penanggung_jawab: Schema.Attribute.String;
    perusahaan_penyedia_barang: Schema.Attribute.String;
    ttd_penerima: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.material': GlobalMaterial;
      'global.mengetahui': GlobalMengetahui;
      'global.pemeriksa-barang': GlobalPemeriksaBarang;
      'global.penerima': GlobalPenerima;
      'global.pengirim': GlobalPengirim;
      'global.penyedia-barang': GlobalPenyediaBarang;
    }
  }
}
