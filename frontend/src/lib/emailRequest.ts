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

  const resStatusEmail = await fetch(`${apiUrl}/api/email-statuses/${emailStatusId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    resEmail,
    resStatusEmail
  }
};
