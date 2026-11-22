// Runs once when a server process starts. Starts the scheduled jobs
// (src/server/jobs) in the Node.js runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./server/jobs/scheduler");
    startScheduler();
  }
}
