/**
 * TF-IDF (Term Frequency - Inverse Document Frequency) and Cosine Similarity Engine
 * Pure mathematical implementation without external AI or Python dependencies.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t',
  'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having',
  'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
  'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'dataset', 'data', 'need', 'want', 'looking', 'please'
]);

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

class TfIdfVectorizer {
  constructor(documents = []) {
    this.documents = documents.map(tokenize);
    this.vocabulary = new Set();
    this.idf = new Map();
    this._computeIdf();
  }

  _computeIdf() {
    const totalDocs = this.documents.length;
    if (totalDocs === 0) return;

    // Build vocabulary & calculate Document Frequency (DF)
    const docFreq = new Map();
    for (const docTokens of this.documents) {
      const uniqueInDoc = new Set(docTokens);
      for (const token of uniqueInDoc) {
        this.vocabulary.add(token);
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    // Smooth IDF formulation: ln(1 + (N / (1 + DF)))
    for (const [term, count] of docFreq.entries()) {
      const idfValue = Math.log(1 + (totalDocs / (1 + count)));
      this.idf.set(term, idfValue);
    }
  }

  vectorize(text) {
    const tokens = tokenize(text);
    const vector = new Map();

    if (tokens.length === 0) return vector;

    // Term Frequency (TF)
    const tf = new Map();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // TF-IDF = (count / total_tokens) * IDF
    for (const [term, count] of tf.entries()) {
      const termIdf = this.idf.get(term) || Math.log(1 + (this.documents.length || 1));
      const termTf = count / tokens.length;
      vector.set(term, termTf * termIdf);
    }

    return vector;
  }

  static cosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.size === 0 || vectorB.size === 0) {
      return 0.0;
    }

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (const val of vectorA.values()) {
      normA += val * val;
    }
    for (const val of vectorB.values()) {
      normB += val * val;
    }

    for (const [term, weightA] of vectorA.entries()) {
      const weightB = vectorB.get(term);
      if (weightB) {
        dotProduct += weightA * weightB;
      }
    }

    if (normA === 0 || normB === 0) return 0.0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0.0, Math.min(1.0, similarity));
  }
}

module.exports = {
  tokenize,
  TfIdfVectorizer
};
