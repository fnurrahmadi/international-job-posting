import assert from "node:assert/strict";
import test from "node:test";
import { classifyRole, classifySeniority } from "../src/lib/jobs/role-classifier";

test("classifies target analytics role families", () => {
  assert.equal(classifyRole("Senior Analyst – Commercial Strategy & Pricing")?.roleFamily, "pricing_revenue");
  assert.equal(classifyRole("Business Intelligence Analyst")?.roleFamily, "business_analytics");
  assert.equal(classifyRole("Product Data Analyst")?.roleFamily, "product_analytics");
  assert.equal(classifyRole("Backend Engineer"), null);
});

test("classifies seniority", () => {
  assert.equal(classifySeniority("Senior Data Analyst"), "SENIOR");
  assert.equal(classifySeniority("Analytics Lead"), "LEAD");
  assert.equal(classifySeniority("Data Analyst"), "MID");
});
