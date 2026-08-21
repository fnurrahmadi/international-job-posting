import assert from "node:assert/strict";
import test from "node:test";
import { classifyRole, classifySeniority, isPotentialRoleTitle } from "../src/lib/jobs/role-classifier";

test("classifies target analytics role families", () => {
  assert.equal(classifyRole("Senior Analyst – Commercial Strategy & Pricing")?.roleFamily, "pricing_revenue");
  assert.equal(classifyRole("Business Intelligence Analyst")?.roleFamily, "business_analytics");
  assert.equal(classifyRole("Product Data Analyst")?.roleFamily, "product_analytics");
  assert.equal(classifyRole("Decision Scientist")?.roleFamily, "data_analytics");
  assert.equal(classifyRole("Workforce Planning Analyst")?.roleFamily, "operations_analytics");
  assert.equal(classifyRole("Product Insights Lead")?.roleFamily, "product_analytics");
  assert.equal(classifyRole("Strategic Finance Analyst")?.roleFamily, "pricing_revenue");
  assert.equal(classifyRole("Fraud Analytics Specialist")?.roleFamily, "data_analytics");
  assert.equal(classifyRole("Backend Engineer"), null);
});

test("uses description evidence for unconventional analytics titles", () => {
  const description = "Build SQL dashboards, analyze marketplace performance metrics, and deliver data-driven insights.";
  assert.equal(classifyRole("Marketplace Performance Specialist", description)?.roleFamily, "operations_analytics");
  assert.equal(classifyRole("Commercial Insights Partner", description)?.roleFamily, "pricing_revenue");
  assert.equal(classifyRole("Backend Engineer", description), null);
  assert.equal(isPotentialRoleTitle("Customer Intelligence Consultant"), true);
});

test("classifies seniority", () => {
  assert.equal(classifySeniority("Senior Data Analyst"), "SENIOR");
  assert.equal(classifySeniority("Analytics Lead"), "LEAD");
  assert.equal(classifySeniority("Data Analyst"), "MID");
});
