import { getSql } from "../src/lib/db/client";
import { sendPendingAlerts } from "../src/lib/alerts/send";

sendPendingAlerts()
  .then(async (result) => { console.log(`Alert searches sent: ${result.sent}`); await getSql().end(); })
  .catch((error) => { console.error(error); process.exitCode = 1; });
