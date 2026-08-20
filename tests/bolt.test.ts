import assert from "node:assert/strict";
import test from "node:test";
import { parseBoltDetail, parseBoltListing } from "../src/lib/ats/bolt";

test("Bolt listing parser selects relevant role cards", () => {
  const html = `<div data-testid="AccordionItem"><h3><button><div>
    <div><span class="rt-high-contrast">Senior Data Analyst</span></div>
    <div><span>Data &amp; Analytics</span></div><div><span>Berlin, Germany</span></div>
  </div></button></h3><a href="/en/careers/positions/job-1/?tab=apply">Apply</a>
  <a href="/en/careers/positions/job-1/">View role</a></div>
  <div data-testid="AccordionItem"><h3><button><div><div><span>Software Engineer</span></div></div></button></h3>
  <a href="/en/careers/positions/job-2/">View role</a></div>`;
  const rows = parseBoltListing(html, "https://bolt.eu/en/careers/positions/");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, "Senior Data Analyst");
  assert.equal(rows[0].location, "Berlin, Germany");
});

test("Bolt detail parser decodes the Next.js server payload", () => {
  const payload = `0:{"description":"\\u003cp\\u003eAbout the role\\u003c/p\\u003e\\u003cp\\u003eRelocation support is available.\\u003c/p\\u003e"}`;
  const html = `<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script>`;
  const description = parseBoltDetail(html);
  assert.match(description, /About the role/);
  assert.match(description, /Relocation support is available/);
});
