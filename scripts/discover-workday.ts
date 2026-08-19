import { inferWorkdayFeedUrl, validateWorkdayFeed } from "../src/lib/ats/workday";

async function main() {
  const careersUrls = process.argv.slice(2);
  if (careersUrls.length === 0) throw new Error("Usage: pnpm workday:discover -- <workday-careers-url> [...]");

  for (const careersUrl of careersUrls) {
    try {
      const feedUrl = inferWorkdayFeedUrl(careersUrl);
      const result = await validateWorkdayFeed(feedUrl);
      console.log(JSON.stringify({ careersUrl, feedUrl, valid: true, dataAnalystMatches: result.total }));
    } catch (error) {
      console.log(JSON.stringify({ careersUrl, valid: false, error: error instanceof Error ? error.message : String(error) }));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
