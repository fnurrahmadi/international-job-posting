import assert from "node:assert/strict";
import test from "node:test";
import { classifyRole, classifySeniority, isPotentialRoleTitle, roleCategoryForFamily } from "../src/lib/jobs/role-classifier";

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

test("classifies data, ML, and product management without moving analytics roles", () => {
  assert.equal(classifyRole("Senior Data Scientist")?.roleFamily, "data_science");
  assert.equal(classifyRole("Analytics Engineer")?.roleFamily, "data_engineering");
  assert.equal(classifyRole("Staff Machine Learning Engineer")?.roleFamily, "machine_learning");
  assert.equal(classifyRole("Technical Product Manager")?.roleFamily, "product_management");
  assert.equal(classifyRole("Product Owner")?.roleFamily, "product_management");
  assert.equal(classifyRole("Product Data Analyst")?.roleFamily, "product_analytics");
  assert.equal(roleCategoryForFamily("product_analytics"), "analytics");
  assert.equal(roleCategoryForFamily("data_engineering"), "data_ml");
  assert.equal(roleCategoryForFamily("product_management"), "product");
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
