/**
 * Activates Cognitory topics whose slugs match the hardcoded GradeNext curriculum,
 * then fires the curriculum sync for each affected grade+subject.
 *
 * Run: node scripts/activate_matching_topics.js
 */

import mongoose from "mongoose";
import https from "https";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

// ── Hardcoded topic keys from GradeNext curriculum.py (after _ normalisation) ──
const HARDCODED = {
  1: {
    mathematics: [
      "adding_subtracting_and_working_with_data",
      "adding_and_subtracting_within_20",
      "adding_within_100",
      "numbers_to_99",
      "geometry_and_time",
      "addition_and_subtraction_story_problems",
      "length_measurements",
    ],
  },
  2: {
    mathematics: [
      "adding_subtracting_and_data",
      "adding_and_subtracting_within_100",
      "measuring_length",
      "addition_and_subtraction_on_number_line",
      "numbers_to_1000",
      "geometry_time_and_money",
      "adding_and_subtracting_within_1000",
      "equal_groups",
    ],
  },
  3: {
    mathematics: [
      "introducing_multiplication",
      "area_and_multiplication",
      "wrapping_up_addition_subtraction_1000",
      "relating_multiplication_to_division",
      "fractions_as_numbers",
      "measuring_length_time_volume_weight",
      "two_dimensional_shapes_perimeter",
      "putting_it_all_together",
    ],
  },
  4: {
    mathematics: [
      "factors_and_multiples",
      "fraction_equivalence_comparison",
      "extending_operations_fractions",
      "hundredths_to_hundred_thousands",
      "multiplicative_comparison_measurement",
      "multiplying_dividing_multi_digit",
      "angles_angle_measurement",
      "properties_two_dimensional_shapes",
      "putting_it_all_together",
    ],
  },
  5: {
    mathematics: [
      "finding_volume",
      "fractions_as_quotients_multiplication",
      "multiplying_dividing_fractions",
      "wrapping_up_multiplication_division",
      "place_value_decimal_operations",
      "more_decimal_fraction_operations",
      "shapes_coordinate_grid",
      "putting_it_all_together",
    ],
  },
  6: {
    mathematics: [
      "reasoning_to_find_area",
      "introducing_ratios",
      "unit_rates_and_percentages",
      "dividing_fractions",
      "arithmetic_in_base_ten",
      "expressions_and_equations",
      "rational_numbers",
      "data_sets_and_distributions",
      "putting_it_all_together",
    ],
  },
  7: {
    mathematics: [
      "scale_drawings",
      "introducing_proportional_relationships",
      "measuring_circles",
      "proportional_relationships_and_percentages",
      "rational_number_arithmetic",
      "expressions_equations_and_inequalities",
      "angles_triangles_and_prisms",
      "probability_and_sampling",
      "putting_it_all_together",
    ],
  },
  8: {
    mathematics: [
      "rigid_transformations_and_congruence",
      "dilations_similarity_and_introducing_slope",
      "linear_relationships",
      "linear_equations_and_linear_systems",
      "functions_and_volume",
      "associations_in_data",
      "exponents_and_scientific_notation",
      "pythagorean_theorem_and_irrational_numbers",
      "putting_it_all_together",
    ],
  },
};

// ── Mongoose schemas (minimal) ────────────────────────────────────────────────
const subtopicSchema = new mongoose.Schema({ name: String, slug: String });
const topicSchema = new mongoose.Schema({
  name: String,
  slug: String,
  isActiveCurriculum: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  subtopics: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtopic" }],
});
const classSchema = new mongoose.Schema({ name: String });
const subjectSchema = new mongoose.Schema({ name: String, slug: String, topics: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic" }] });

const Topic = mongoose.model("Topic", topicSchema);
const Class = mongoose.model("Class", classSchema);
const Subject = mongoose.model("Subject", subjectSchema);
const Subtopic = mongoose.model("Subtopic", subtopicSchema);

function httpPost(urlStr, headers, bodyStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request({ hostname: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80), path: u.pathname + u.search, method: "POST", headers: { ...headers, "Content-Length": Buffer.byteLength(bodyStr) } }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

async function syncToGradeNext(grade, subjectSlug, allTopics) {
  const url = process.env.GRADENEXT_API_URL;
  const secret = process.env.GRADENEXT_SYNC_SECRET;
  if (!url || !secret) { console.warn("  GRADENEXT env vars not set, skipping sync"); return; }
  try {
    const body = JSON.stringify({ grade, subject: subjectSlug, topics: allTopics });
    const res = await httpPost(`${url}/api/curriculum/sync/`, { "Content-Type": "application/json", "X-Sync-Secret": secret }, body);
    console.log(`  GradeNext sync: ${res.status} — active_topics=${res.body?.active_topics ?? "?"}`);
  } catch (err) {
    console.error(`  GradeNext sync failed: ${err.message}`);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB\n");

  for (const [gradeStr, subjects] of Object.entries(HARDCODED)) {
    const grade = parseInt(gradeStr);
    for (const [subjectKey] of Object.entries(subjects)) {
      const hardcodedKeys = new Set(HARDCODED[grade][subjectKey]);

      // Find all non-deleted topics for this grade+subject
      const gradePattern = new RegExp(`\\b${grade}\\b`);
      const classes = await Class.find({ name: gradePattern });
      if (!classes.length) { console.log(`Grade ${grade}: no class found`); continue; }

      const classIds = classes.map((c) => c._id);
      const subjectDocs = await Subject.find({ slug: subjectKey });
      if (!subjectDocs.length) { console.log(`Grade ${grade} | ${subjectKey}: no subject found`); continue; }
      const subjectIds = subjectDocs.map((s) => s._id);

      const topics = await Topic.find({ class: { $in: classIds }, subject: { $in: subjectIds }, deletedAt: null })
        .populate("subtopics", "name slug")
        .sort({ createdAt: 1 });

      if (!topics.length) { console.log(`Grade ${grade} | ${subjectKey}: no topics found`); continue; }

      const matched = [], unmatched = [];
      for (const t of topics) {
        const normalized = t.slug.replace(/-/g, "_");
        if (hardcodedKeys.has(normalized)) matched.push(t);
        else unmatched.push(t);
      }

      console.log(`Grade ${grade} | ${subjectKey}:`);
      console.log(`  Total in Cognitory: ${topics.length}, Matching hardcoded: ${matched.length}, No match: ${unmatched.length}`);

      if (matched.length > 0) {
        // Activate matched topics
        const matchedIds = matched.map((t) => t._id);
        await Topic.updateMany({ _id: { $in: matchedIds } }, { $set: { isActiveCurriculum: true } });
        console.log(`  Activated ${matched.length} topics: ${matched.map((t) => t.slug).join(", ")}`);

        // Reload all topics with fresh isActiveCurriculum values
        const allTopicsReloaded = await Topic.find({ class: { $in: classIds }, subject: { $in: subjectIds }, deletedAt: null })
          .populate("subtopics", "name slug")
          .sort({ createdAt: 1 });

        const payload = allTopicsReloaded.map((t, idx) => ({
          cognitory_id: t._id.toString(),
          topic_key: t.slug,
          display_name: t.name,
          order: idx,
          is_active: t.isActiveCurriculum,
          subtopics: (t.subtopics || []).map((sub, si) => ({
            cognitory_id: sub._id.toString(),
            name: sub.name,
            order: si,
          })),
        }));

        await syncToGradeNext(grade, subjectKey, payload);
      }

      if (unmatched.length > 0) {
        console.log(`  No-match (remain inactive): ${unmatched.map((t) => t.slug).join(", ")}`);
      }
      console.log();
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
