export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { loadSettingsIntoEnv } = await import("./lib/settings");
    loadSettingsIntoEnv();
  } catch (err) {
    // This hook runs on the cold start of every serverless function. If it
    // rejects, Next.js surfaces it as an unhandled rejection and the whole
    // function dies with a 500 — so a bootstrap failure must stay local.
    console.error("[instrumentation] settings bootstrap skipped:", err);
  }
}
