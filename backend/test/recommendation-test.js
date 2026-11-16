/**
 * Phase 6 Test Suite: Intelligent Dataset Recommendation System
 * Tests weighted scoring (Task: 30, Domain: 25, Data Type: 20, Difficulty: 10, Quality: 10, Rating: 5),
 * TF-IDF text vectorization, cosine similarity, natural language attribute extraction, and ranking accuracy.
 */

const { startServer } = require('../src/server');
const { pool } = require('../src/config/db');
const { extractAttributesFromText } = require('../src/utils/entityExtractor');
const { TfIdfVectorizer } = require('../src/utils/tfidf');

const BASE_URL = 'http://localhost:5000/api';

async function runRecommendationTestSuite() {
  console.log('================================================================');
  console.log(' Starting Phase 6: AI Dataset Recommendation Test Suite        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // ------------------------------------------------------------------------
  // SECTION 1: UNIT TEST FOR ENTITY EXTRACTION & TF-IDF
  // ------------------------------------------------------------------------
  console.log('\n--- Section 1: NLP Entity Extraction & TF-IDF Vectorization ---');

  // Test 1: Attribute Extraction from user prompt
  const userPrompt = 'I need a beginner-level image classification dataset for agriculture.';
  const extracted = extractAttributesFromText(userPrompt);
  assert(
    extracted.domain === 'Agriculture' &&
    extracted.task_type === 'Classification' &&
    extracted.data_type === 'Image' &&
    extracted.difficulty_level === 'BEGINNER',
    'NLP Extractor accurately extracts Domain, Task, Data Type, and Difficulty from user prompt'
  );

  // Test 2: TF-IDF Math & Cosine Similarity
  const corpus = [
    'iris flower plant botany classification beginner',
    'heart disease clinical patient cardiology classification',
    'wine quality red white viticulture agriculture classification'
  ];
  const vectorizer = new TfIdfVectorizer(corpus);
  const vecA = vectorizer.vectorize('botany flower plant');
  const vecIris = vectorizer.vectorize(corpus[0]);
  const vecHeart = vectorizer.vectorize(corpus[1]);

  const simIris = TfIdfVectorizer.cosineSimilarity(vecA, vecIris);
  const simHeart = TfIdfVectorizer.cosineSimilarity(vecA, vecHeart);
  assert(simIris > simHeart && simIris > 0.5, 'TF-IDF Cosine Similarity correctly identifies higher lexical affinity for Iris over Heart Disease');

  // ------------------------------------------------------------------------
  // SECTION 2: END-TO-END RECOMMENDATION API TESTS
  // ------------------------------------------------------------------------
  console.log('\n--- Section 2: End-to-End Recommendation API & Ranking Accuracy ---');

  let server;
  try {
    server = await startServer();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }

  try {
    // Test Case 1: Agriculture / Wine Query
    console.log('\n[Case 1: Agriculture & Wine Quality Benchmark]');
    const res1 = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'I need a beginner-level classification dataset for agriculture viticulture wine.'
      })
    });
    const data1 = await res1.json();
    const top1 = data1.data?.recommendations?.[0];
    assert(res1.status === 200, 'POST /api/recommendations returns 200 OK');
    assert(top1 && top1.dataset_name === 'Wine Quality', 'Query 1 accurately ranks "Wine Quality" as Rank #1');
    assert(top1.score_breakdown.task_points === 30, 'Structured Task Match gives exactly 30 points');
    assert(top1.score_breakdown.domain_points === 25, 'Structured Domain Match gives exactly 25 points');
    assert(top1.score_breakdown.difficulty_points === 10, 'Structured Difficulty Match gives exactly 10 points');
    assert(top1.score_breakdown.quality_points === 0, 'Transparent Quality Handling: Unassumed quality score receives 0 pts without inventing fake numbers');

    // Test Case 2: Healthcare & Cardiology
    console.log('\n[Case 2: Healthcare & Cardiology Benchmark]');
    const res2 = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'clinical cardiology heart disease patient classification intermediate'
      })
    });
    const data2 = await res2.json();
    const top2 = data2.data?.recommendations?.[0];
    assert(top2 && top2.dataset_name.includes('Heart Disease'), 'Query 2 accurately ranks "Heart Disease (Cleveland)" as Rank #1');
    assert(top2.score_breakdown.domain_points === 25, 'Domain Match correctly grants 25 points for Healthcare');

    // Test Case 3: Life Sciences / Botany
    console.log('\n[Case 3: Life Sciences / Botany Benchmark]');
    const res3 = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'beginner botany flower plant species classification tabular'
      })
    });
    const data3 = await res3.json();
    const top3 = data3.data?.recommendations?.[0];
    assert(top3 && top3.dataset_name === 'Iris', 'Query 3 accurately ranks "Iris" as Rank #1');
    assert(top3.score_breakdown.data_type_points === 20, 'Data Type Match correctly grants 20 points for Tabular');

    // Test Case 4: Oncology & Breast Cancer Diagnostic
    console.log('\n[Case 4: Oncology & Breast Cancer Diagnostic]');
    const res4 = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'biopsy diagnostic oncology malignant lesion breast mass'
      })
    });
    const data4 = await res4.json();
    const top4 = data4.data?.recommendations?.[0];
    assert(top4 && top4.dataset_name.includes('Breast Cancer'), 'Query 4 accurately ranks "Breast Cancer Wisconsin" as Rank #1');
    assert(top4.score_breakdown.tfidf_similarity_percentage > 0, 'TF-IDF Cosine Similarity identifies overlapping diagnostic terms');

    // Test Case 5: Social Sciences & Education
    console.log('\n[Case 5: Social Sciences & Student Performance]');
    const res5 = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'student achievement secondary education exam grades regression'
      })
    });
    const data5 = await res5.json();
    const top5 = data5.data?.recommendations?.[0];
    assert(top5 && top5.dataset_name === 'Student Performance', 'Query 5 accurately ranks "Student Performance" as Rank #1');
    assert(top5.score_breakdown.task_points === 30, 'Regression task matching grants 30 points');

    // Test Case 6: Recommendation Transparency & Explanations
    console.log('\n[Case 6: Recommendation Transparency & Explanations]');
    assert(
      Array.isArray(top1.reasons) && top1.reasons.length >= 4,
      'Every recommendation includes transparent human-readable justification reasons'
    );
    assert(
      top1.has_access === true && top2.has_access === false,
      'Recommendations respect access permissions (Public has_access=true, Restricted has_access=false)'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log(` Phase 6 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    if (server) {
      server.close();
    }
    await pool.end();
  }
}

runRecommendationTestSuite();
