// Request for Delete email
export const deleteEmail = async ({
  apiUrl = "http://localhost:1337",
  emailStatusId,
  token,
}: {
  apiUrl?: string;
  emailStatusId: string | number;
  token?: string;
}) => {
  const res = await fetch(`${apiUrl}/api/email-statuses/${emailStatusId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        isDelete: true,
      },
    }),
  });

  return res;
};

// Request for Delete real email
export const deleteEmailReal = async ({
  apiUrl = "http://localhost:1337",
  emailStatusId,
  token,
}: {
  apiUrl?: string;
  emailStatusId: string | number;
  token?: string;
}) => {
  const resEmail = await fetch(`${apiUrl}/api/emails/${emailStatusId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const resStatusEmail = await fetch(
    `${apiUrl}/api/email-statuses/${emailStatusId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    resEmail,
    resStatusEmail,
  };
};

// Request for approve email surat jalan
export const approveEmailSurat = async ({
  apiUrl = "http://localhost:1337",
  emailId,
  token,
}: {
  apiUrl?: string;
  emailId: string | number;
  token?: string;
}) => {
  const resEmail = await fetch(`${apiUrl}/api/emails/approve/${emailId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return resEmail;
};

// Request for approve email Berita Bongkaran
export const approveBeritaBongkaran = async ({
  apiUrl = "http://localhost:1337",
  emailId,
  token,
  signature, 
  signaturePenerima,
}: {
  apiUrl?: string;
  emailId: string | number;
  token?: string;
  signature?: string,
  signaturePenerima?: string,
}) => {
  const resEmail = await fetch(`${apiUrl}/api/emails/approveberitabongkaran/${emailId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      signature: signature,
      signaturePenerima: signaturePenerima,
    }),
  });

  return resEmail;
};

// Request for reject email
export const rejectEmailSurat = async ({
  apiUrl = "http://localhost:1337",
  emailId,
  token,
  pesan,
}: {
  apiUrl?: string;
  emailId: string | number;
  token?: string;
  pesan: string;
}) => {
  const resEmail = await fetch(`${apiUrl}/api/emails/reject/${emailId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      pesan: pesan,
    }),
  });

  return resEmail;
};

// Request for reject email Berita Bongkaran
export const rejectBeritaBongkaran = async ({
  apiUrl = "http://localhost:1337",
  emailId,
  token,
  pesan,
}: {
  apiUrl?: string;
  emailId: string | number;
  token?: string;
  pesan: string;
}) => {
  const resEmail = await fetch(`${apiUrl}/api/emails/rejectberitabongkaran/${emailId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      pesan: pesan,
    }),
  });

  return resEmail;
};
