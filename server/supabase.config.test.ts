import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("has a valid project URL and reachable REST endpoint", async () => {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(url).toBe("https://odzeqxlrlhhiwjujdzdc.supabase.co");
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
