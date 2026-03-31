import API from "./api";

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const uploadAvatarToR2 = async (file, ownerName = "user") => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("ownerName", slug(ownerName) || "user");

  try {
    const response = await API.post("/uploads/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response?.data?.url || null;
  } catch (error) {
    const message = error?.response?.data?.message || "Avatar upload failed";
    throw new Error(message);
  }
};
