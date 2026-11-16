const { pool } = require('../config/db');
const { TfIdfVectorizer, tokenize } = require('../utils/tfidf');
const { extractAttributesFromText } = require('../utils/entityExtractor');

class RecommenderService {
  async getRecommendations(params, currentUser) {
    const {
      query = '',
      task_type: explicitTask,
      domain: explicitDomain,
      data_type: explicitDataType,
      difficulty_level: explicitDifficulty,
      limit = 5
    } = params;

    // 1. Natural Language Entity Extraction:
    // Extract implicit attributes from user natural language prompt
    const extracted = extractAttributesFromText(query);
    const targetTask = explicitTask || extracted.task_type;
    const targetDomain = explicitDomain || extracted.domain;
    const targetDataType = explicitDataType || extracted.data_type;
    const targetDifficulty = explicitDifficulty || extracted.difficulty_level;

    // 2. Fetch all approved datasets from MySQL with ratings and downloads
    const querySql = `
      SELECT 
        d.dataset_id,
        d.dataset_name,
        d.description,
        d.source_url,
        d.license,
        d.file_name,
        d.file_size_bytes,
        d.file_format,
        d.domain,
        d.task_type,
        d.data_type,
        d.difficulty_level,
        d.access_level,
        d.approval_status,
        d.quality_score,
        c.name AS category_name,
        COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS avg_rating,
        COUNT(DISTINCT r.rating_id) AS total_ratings,
        COUNT(DISTINCT dl.download_id) AS total_downloads,
        (
          SELECT GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ')
          FROM Dataset_Tags dt
          JOIN Tags t ON dt.tag_id = t.tag_id
          WHERE dt.dataset_id = d.dataset_id
        ) AS tags
      FROM Datasets d
      JOIN Categories c ON d.category_id = c.category_id
      LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      WHERE d.approval_status = 'APPROVED'
      GROUP BY d.dataset_id, c.name
    `;

    const [datasets] = await pool.execute(querySql);
    if (datasets.length === 0) {
      return {
        extracted_attributes: extracted,
        active_filters: {
          task_type: targetTask || null,
          domain: targetDomain || null,
          data_type: targetDataType || null,
          difficulty_level: targetDifficulty || null
        },
        recommendations: []
      };
    }

    // 3. User Authorization & Access Resolution
    const approvedDatasetIds = new Set();
    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        datasets.forEach((d) => approvedDatasetIds.add(d.dataset_id));
      } else {
        const [accessGrants] = await pool.execute(
          "SELECT dataset_id FROM AccessRequests WHERE user_id = ? AND status = 'APPROVED'",
          [currentUser.userId]
        );
        accessGrants.forEach((row) => approvedDatasetIds.add(row.dataset_id));
      }
    }

    // 4. TF-IDF Text Vectorization Setup
    const datasetCorpora = datasets.map((d) => {
      const tagStr = d.tags || '';
      return `${d.dataset_name} ${d.domain} ${d.task_type} ${d.data_type} ${d.difficulty_level} ${tagStr} ${d.description}`;
    });

    const vectorizer = new TfIdfVectorizer(datasetCorpora);
    const queryTokens = tokenize(query);
    const queryVector = queryTokens.length > 0 ? vectorizer.vectorize(query) : null;

    // 5. Evaluate Weighted Scoring & Semantic Similarity
    const scoredDatasets = datasets.map((d, index) => {
      const reasons = [];
      const scoreBreakdown = {
        task_points: 0,
        domain_points: 0,
        data_type_points: 0,
        difficulty_points: 0,
        quality_points: 0,
        rating_points: 0,
        total_weighted_points: 0,
        tfidf_similarity_percentage: 0
      };

      // Factor 1: Task Type match = 30 points
      if (targetTask && d.task_type.toLowerCase() === targetTask.toLowerCase().trim()) {
        scoreBreakdown.task_points = 30;
        reasons.push(`Task Match: Exact match for "${d.task_type}" (+30/30 pts)`);
      } else {
        reasons.push(`Task: No match (${d.task_type} vs requested ${targetTask || 'None'}) (+0/30 pts)`);
      }

      // Factor 2: Domain match = 25 points
      if (targetDomain && d.domain.toLowerCase() === targetDomain.toLowerCase().trim()) {
        scoreBreakdown.domain_points = 25;
        reasons.push(`Domain Match: Exact match for "${d.domain}" (+25/25 pts)`);
      } else {
        reasons.push(`Domain: No match (${d.domain} vs requested ${targetDomain || 'None'}) (+0/25 pts)`);
      }

      // Factor 3: Data Type match = 20 points
      if (targetDataType && d.data_type.toLowerCase() === targetDataType.toLowerCase().trim()) {
        scoreBreakdown.data_type_points = 20;
        reasons.push(`Data Type Match: Exact match for "${d.data_type}" (+20/20 pts)`);
      } else {
        reasons.push(`Data Type: No match (${d.data_type} vs requested ${targetDataType || 'None'}) (+0/20 pts)`);
      }

      // Factor 4: Difficulty Level match = 10 points
      if (targetDifficulty && d.difficulty_level.toUpperCase() === targetDifficulty.toUpperCase().trim()) {
        scoreBreakdown.difficulty_points = 10;
        reasons.push(`Difficulty Match: Exact match for "${d.difficulty_level}" (+10/10 pts)`);
      } else {
        reasons.push(`Difficulty: No match (${d.difficulty_level} vs requested ${targetDifficulty || 'None'}) (+0/10 pts)`);
      }

      // Factor 5: Dataset Quality = 10 points
      // TRANSPARENCY RULE: Do not invent quality scores. If quality is NULL, handle transparently.
      if (d.quality_score !== null && d.quality_score !== undefined) {
        const qualityPts = Math.min(10, Math.max(0, (Number(d.quality_score) / 10) * 10));
        scoreBreakdown.quality_points = Number(qualityPts.toFixed(1));
        reasons.push(`Evaluated Dataset Quality: ${d.quality_score}/10.0 (+${scoreBreakdown.quality_points}/10 pts)`);
      } else {
        scoreBreakdown.quality_points = 0;
        reasons.push(`Dataset Quality: Not formally evaluated (0/10 pts - transparent unassumed baseline)`);
      }

      // Factor 6: Community Rating = 5 points (avg_rating / 5 * 5)
      if (d.avg_rating > 0) {
        const ratingPts = (Number(d.avg_rating) / 5) * 5;
        scoreBreakdown.rating_points = Number(ratingPts.toFixed(1));
        reasons.push(`Community User Rating: ${d.avg_rating}/5.0 stars (+${scoreBreakdown.rating_points}/5 pts)`);
      } else {
        scoreBreakdown.rating_points = 0;
        reasons.push(`Community User Rating: Unrated (+0/5 pts)`);
      }

      // Calculate Total Structured Weighted Points (Max 100)
      scoreBreakdown.total_weighted_points = Number(
        (
          scoreBreakdown.task_points +
          scoreBreakdown.domain_points +
          scoreBreakdown.data_type_points +
          scoreBreakdown.difficulty_points +
          scoreBreakdown.quality_points +
          scoreBreakdown.rating_points
        ).toFixed(1)
      );

      // Compute TF-IDF Semantic Cosine Similarity
      let tfidfSimilarity = 0;
      const matchedTerms = [];
      if (queryVector && queryVector.size > 0) {
        const docVector = vectorizer.vectorize(datasetCorpora[index]);
        const cosSim = TfIdfVectorizer.cosineSimilarity(queryVector, docVector);
        tfidfSimilarity = Number((cosSim * 100).toFixed(1));

        // Find overlapping terms for explainability
        for (const token of queryTokens) {
          if (docVector.has(token)) {
            matchedTerms.push(token);
          }
        }

        if (tfidfSimilarity > 0) {
          reasons.push(
            `TF-IDF Cosine Similarity: ${tfidfSimilarity}% (Overlapping keywords: ${matchedTerms.slice(0, 4).join(', ') || 'semantic context'})`
          );
        }
      }
      scoreBreakdown.tfidf_similarity_percentage = tfidfSimilarity;

      // Compute Overall Combined Match Percentage:
      // If natural language query was provided, combine 60% structured weighted score + 40% TF-IDF cosine similarity.
      // If only attribute filters were provided, match percentage equals total weighted score.
      let matchPercentage = 0;
      if (queryVector && queryVector.size > 0) {
        matchPercentage = Math.round(
          scoreBreakdown.total_weighted_points * 0.6 + tfidfSimilarity * 0.4
        );
      } else {
        matchPercentage = Math.round(scoreBreakdown.total_weighted_points);
      }
      matchPercentage = Math.min(100, Math.max(0, matchPercentage));

      // Access permission status
      const hasAccess = d.access_level === 'PUBLIC' || approvedDatasetIds.has(d.dataset_id);

      return {
        ...d,
        tags: d.tags ? d.tags.split(', ') : [],
        has_access: hasAccess,
        match_percentage: matchPercentage,
        score_breakdown: scoreBreakdown,
        matched_keywords: matchedTerms,
        reasons
      };
    });

    // 6. Ranking: Sort primarily by match_percentage descending, secondarily by weighted score, then ratings
    scoredDatasets.sort((a, b) => {
      if (b.match_percentage !== a.match_percentage) {
        return b.match_percentage - a.match_percentage;
      }
      if (b.score_breakdown.total_weighted_points !== a.score_breakdown.total_weighted_points) {
        return b.score_breakdown.total_weighted_points - a.score_breakdown.total_weighted_points;
      }
      return b.avg_rating - a.avg_rating;
    });

    const safeLimit = Math.max(1, Math.min(20, parseInt(limit, 10) || 5));
    const rankedResults = scoredDatasets.slice(0, safeLimit).map((item, idx) => ({
      ...item,
      ranking: idx + 1
    }));

    return {
      extracted_attributes: extracted,
      active_filters: {
        task_type: targetTask || null,
        domain: targetDomain || null,
        data_type: targetDataType || null,
        difficulty_level: targetDifficulty || null
      },
      recommendations: rankedResults
    };
  }
}

module.exports = new RecommenderService();
