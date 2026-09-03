export const env = {
  apiUrl: process.env.API_URL ?? "http://localhost:3100",
  adminDevBypass: process.env.ADMIN_DEV_BYPASS === "true",
  cfAccessTeamDomain: process.env.CF_ACCESS_TEAM_DOMAIN ?? "",
  cfAccessAud: process.env.CF_ACCESS_AUD ?? "",
};
