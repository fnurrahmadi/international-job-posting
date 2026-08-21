import { getSql } from "../src/lib/db/client";
import { checkActiveJobLinks } from "../src/lib/jobs/link-health";

const limit = Number(process.env.LINK_CHECK_LIMIT ?? 100);
checkActiveJobLinks(limit)
  .then(async (result) => { console.log("Link health", result); await getSql().end(); })
  .catch((error) => { console.error(error); process.exitCode = 1; });
