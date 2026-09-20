export interface LoggedInUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "faculty";
}

export function getLoggedInUser(): LoggedInUser | null {
  const storedUser = localStorage.getItem(
    "campusconnect_user"
  );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    localStorage.removeItem(
      "campusconnect_user"
    );

    return null;
  }
}