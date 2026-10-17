/**
 * University name normalization and utility functions
 */

/**
 * Normalize university name to title case for consistent storage
 * @param {string} universityName - Raw university name input
 * @returns {string} - Normalized university name
 */
const normalizeUniversityName = (universityName) => {
  if (!universityName || typeof universityName !== 'string') {
    return '';
  }

  // Trim whitespace and convert to lowercase first
  const cleaned = universityName.trim().toLowerCase();
  
  // Split by spaces and capitalize each word
  const words = cleaned.split(/\s+/);
  const normalized = words.map(word => {
    // Handle special cases for common university terms
    const specialCases = {
      'of': 'of',
      'and': 'and',
      'the': 'the',
      'in': 'in',
      'at': 'at',
      'for': 'for'
    };
    
    // Keep articles and prepositions lowercase unless they're the first word
    if (words.indexOf(word) > 0 && specialCases[word]) {
      return specialCases[word];
    }
    
    // Capitalize first letter of each word
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  return normalized;
};

/**
 * Check if two university names match (case-insensitive)
 * @param {string} name1 - First university name
 * @param {string} name2 - Second university name
 * @returns {boolean} - True if names match
 */
const universitiesMatch = (name1, name2) => {
  if (!name1 || !name2) return false;
  return name1.toLowerCase().trim() === name2.toLowerCase().trim();
};

/**
 * Validate university name format
 * @param {string} universityName - University name to validate
 * @returns {object} - Validation result with isValid and message
 */
const validateUniversityName = (universityName) => {
  if (!universityName || typeof universityName !== 'string') {
    return {
      isValid: false,
      message: 'University name is required'
    };
  }

  const trimmed = universityName.trim();
  
  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: 'University name must be at least 3 characters long'
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      message: 'University name must be less than 100 characters'
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const validPattern = /^[a-zA-Z\s\-'\.]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      message: 'University name can only contain letters, spaces, hyphens, apostrophes, and periods'
    };
  }

  return {
    isValid: true,
    message: 'Valid university name'
  };
};

/**
 * Get unique universities from a list of users
 * @param {Array} users - Array of user objects with university_name
 * @returns {Array} - Array of unique normalized university names
 */
const getUniqueUniversities = (users) => {
  if (!Array.isArray(users)) return [];
  
  const universities = new Set();
  users.forEach(user => {
    if (user.university_name) {
      universities.add(normalizeUniversityName(user.university_name));
    }
  });
  
  return Array.from(universities).sort();
};

module.exports = {
  normalizeUniversityName,
  universitiesMatch,
  validateUniversityName,
  getUniqueUniversities
};
