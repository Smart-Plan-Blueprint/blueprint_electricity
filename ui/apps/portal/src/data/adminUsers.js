export const demoAdminUsers = [
  {
    name: "Smart Plan Admin",
    email: "admin@smartplanblueprint.net",
    password: "admin1234",
    role: "admin"
  },
  {
    name: "Reporting Analyst",
    email: "reports@smartplanblueprint.net",
    password: "reports1234",
    role: "analyst"
  }
];

export function authenticateAdmin(email, password) {
  const target = String(email || "").trim().toLowerCase();
  return demoAdminUsers.find(
    (user) => user.email.toLowerCase() === target && user.password === password
  ) || null;
}
