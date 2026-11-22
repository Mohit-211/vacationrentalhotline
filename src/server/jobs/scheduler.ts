import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db";
import { serverEnv } from "@/server/env";
import { runScheduledJobs, type JobReport } from "./index";

// Runs the scheduled jobs inside the app, so the server needs no crontab:
// every app process starts this timer, and a MySQL named lock lets only one
// of them run the jobs at a time.

const INTERVAL_MS = 15 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const LOCK_NAME = "vrh_scheduled_jobs";

/** Runs the jobs unless another process is already running them (then returns null). */
export async function runScheduledJobsOnce(): Promise<JobReport | null> {
  const connection = await pool().getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK(?, 0) AS acquired", [LOCK_NAME]);
    if (rows[0]?.acquired !== 1) return null;
    try {
      return await runScheduledJobs();
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
    }
  } finally {
    connection.release();
  }
}

let started = false;

/** Starts the timer in this process (once). SCHEDULED_JOBS=off turns it off. */
export function startScheduler() {
  if (started) return;
  started = true;
  try {
    if (serverEnv().SCHEDULED_JOBS === "off") return;
  } catch (error) {
    console.error("[jobs] Not scheduling jobs: the server environment is invalid.", error);
    return;
  }
  const tick = async () => {
    try {
      const report = await runScheduledJobsOnce();
      if (report && Object.values(report).some((count) => count > 0)) console.info("[jobs] Ran", report);
    } catch (error) {
      console.error("[jobs] Run failed", error);
    }
  };
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), INTERVAL_MS).unref();
  }, FIRST_RUN_DELAY_MS).unref();
}
