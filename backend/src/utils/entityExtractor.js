/**
 * NLP Parameter Extraction Utility
 * Extracts structured attributes (task, domain, data type, difficulty)
 * from natural language user requirement prompts.
 */

const DOMAIN_KEYWORDS = {
  'Agriculture': ['agriculture', 'agricultural', 'farming', 'crop', 'wine', 'viticulture', 'food', 'beverage', 'agrarian'],
  'Healthcare': ['healthcare', 'health', 'medical', 'medicine', 'cardiology', 'heart', 'cancer', 'oncology', 'biopsy', 'clinical', 'patient', 'disease', 'diagnosis', 'lesion', 'diagnostic'],
  'Life Sciences': ['life sciences', 'biology', 'botany', 'botanical', 'plant', 'iris', 'flower', 'species', 'genomics', 'ecology'],
  'Social Sciences': ['social sciences', 'social', 'education', 'student', 'school', 'academic', 'grades', 'achievement', 'demographic', 'psychology'],
  'Computer Vision': ['computer vision', 'vision', 'image', 'photo', 'picture', 'fna', 'digitized'],
  'NLP': ['nlp', 'natural language', 'text', 'linguistics', 'sentiment']
};

const TASK_KEYWORDS = {
  'Classification': ['classification', 'classify', 'classifier', 'categorize', 'diagnostic', 'predict category', 'multivariate', 'binary'],
  'Regression': ['regression', 'regress', 'predict score', 'grades', 'continuous', 'numerical prediction', 'forecasting'],
  'Clustering': ['clustering', 'cluster', 'unsupervised', 'grouping', 'k-means']
};

const DATA_TYPE_KEYWORDS = {
  'Tabular': ['tabular', 'table', 'csv', 'columns', 'features', 'relational', 'attributes', 'numeric'],
  'Image': ['image', 'images', 'visual', 'photo', 'pixels'],
  'Text': ['text', 'corpus', 'nlp', 'documents'],
  'Time-Series': ['time series', 'temporal', 'sequential']
};

const DIFFICULTY_KEYWORDS = {
  'BEGINNER': ['beginner', 'beginner-level', 'novice', 'starter', 'easy', 'simple', 'classroom', 'introduction', 'introductory'],
  'INTERMEDIATE': ['intermediate', 'intermediate-level', 'moderate', 'medium', 'clinical'],
  'ADVANCED': ['advanced', 'advanced-level', 'expert', 'complex', 'high-dimensional', 'genomic']
};

function extractAttributesFromText(queryText) {
  if (!queryText || typeof queryText !== 'string') {
    return {};
  }

  const lower = queryText.toLowerCase();
  const extracted = {};

  // 1. Domain Detection
  for (const [domainName, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      extracted.domain = domainName;
      break;
    }
  }

  // 2. Task Detection
  for (const [taskName, keywords] of Object.entries(TASK_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      extracted.task_type = taskName;
      break;
    }
  }

  // 3. Data Type Detection
  for (const [typeName, keywords] of Object.entries(DATA_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      extracted.data_type = typeName;
      break;
    }
  }

  // 4. Difficulty Detection
  for (const [diffLevel, keywords] of Object.entries(DIFFICULTY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      extracted.difficulty_level = diffLevel;
      break;
    }
  }

  return extracted;
}

module.exports = {
  extractAttributesFromText
};
