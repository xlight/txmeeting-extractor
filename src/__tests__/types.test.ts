import {
  isValidString,
  isValidNumber,
  isValidArray,
  parseNumber,
  parseTimestamp,
  decodeBase64,
  isMinutesDetailResponse,
  isCommonRecordInfoResponse,
  isGetFullSummaryResponse,
  isGetChapterResponse,
  isGetTimeLineResponse,
  isGetMulSummaryAndTodoResponse,
  isGetSmartTopicResponse,
  isGetMultiRecordFileResponse,
} from '../types/meeting';

describe('Type Validation Functions', () => {
  describe('isValidString', () => {
    it('should return true for non-empty strings', () => {
      expect(isValidString('hello')).toBe(true);
      expect(isValidString('  hello  ')).toBe(true);
    });

    it('should return false for empty or invalid values', () => {
      expect(isValidString('')).toBe(false);
      expect(isValidString('   ')).toBe(false);
      expect(isValidString(undefined)).toBe(false);
      expect(isValidString(null)).toBe(false);
      expect(isValidString(123)).toBe(false);
      expect(isValidString({})).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber(42)).toBe(true);
      expect(isValidNumber(3.14)).toBe(true);
      expect(isValidNumber(-10)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
      expect(isValidNumber('123')).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber(null)).toBe(false);
    });
  });

  describe('isValidArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray(['a', 'b'])).toBe(true);
      expect(isValidArray([{}])).toBe(true);
    });

    it('should return false for empty or invalid values', () => {
      expect(isValidArray([])).toBe(false);
      expect(isValidArray(undefined)).toBe(false);
      expect(isValidArray(null)).toBe(false);
      expect(isValidArray('array')).toBe(false);
      expect(isValidArray({})).toBe(false);
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber('42')).toBe(42);
      expect(parseNumber('3.14')).toBe(3.14);
      expect(parseNumber('-10')).toBe(-10);
    });

    it('should return undefined for invalid inputs', () => {
      expect(parseNumber('abc')).toBeUndefined();
      expect(parseNumber('')).toBeUndefined();
      expect(parseNumber(undefined)).toBeUndefined();
      expect(parseNumber(null)).toBeUndefined();
      expect(parseNumber({})).toBeUndefined();
    });
  });

  describe('parseTimestamp', () => {
    it('should parse valid timestamps in the range 2000-2100', () => {
      // Timestamp for Jan 1, 2022 (in milliseconds)
      const validTimestamp = 1640995200000;
      expect(parseTimestamp(validTimestamp)).toBe(validTimestamp);
      expect(parseTimestamp(String(validTimestamp))).toBe(validTimestamp);
    });

    it('should return undefined for timestamps outside the valid range', () => {
      // Timestamp for year 1970 (too early)
      expect(parseTimestamp(0)).toBeUndefined();
      // Timestamp for year 2200 (too late)
      expect(parseTimestamp(7258118400000)).toBeUndefined();
    });

    it('should return undefined for invalid inputs', () => {
      expect(parseTimestamp('invalid')).toBeUndefined();
      expect(parseTimestamp(NaN)).toBeUndefined();
    });
  });

  describe('decodeBase64', () => {
    it('should decode valid Base64 strings', () => {
      // Base64 encoded 'hello world'
      const encoded = 'aGVsbG8gd29ybGQ=';
      expect(decodeBase64(encoded)).toBe('hello world');
    });

    it('should return original string for invalid Base64', () => {
      const invalid = 'invalid_base64!';
      expect(decodeBase64(invalid)).toBe(invalid);
    });

    it('should handle regular strings', () => {
      const regular = 'hello world';
      expect(decodeBase64(regular)).toBe(regular);
    });
  });

  describe('API Response Type Guards', () => {
    describe('isMinutesDetailResponse', () => {
      it('should return true for valid MinutesDetailResponse', () => {
        const validResponse = {
          code: 0,
          minutes: {},
        };
        expect(isMinutesDetailResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          minutes: undefined,
        };
        expect(isMinutesDetailResponse(invalidResponse)).toBe(false);

        const wrongStructure = {
          status: 0,
          data: {},
        };
        expect(isMinutesDetailResponse(wrongStructure)).toBe(false);
      });
    });

    describe('isCommonRecordInfoResponse', () => {
      it('should return true for valid CommonRecordInfoResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isCommonRecordInfoResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isCommonRecordInfoResponse(invalidResponse)).toBe(false);

        const wrongStructure = {
          status: 0,
          info: {},
        };
        expect(isCommonRecordInfoResponse(wrongStructure)).toBe(false);
      });
    });

    describe('isGetFullSummaryResponse', () => {
      it('should return true for valid GetFullSummaryResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isGetFullSummaryResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isGetFullSummaryResponse(invalidResponse)).toBe(false);
      });
    });

    describe('isGetChapterResponse', () => {
      it('should return true for valid GetChapterResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isGetChapterResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isGetChapterResponse(invalidResponse)).toBe(false);
      });
    });

    describe('isGetTimeLineResponse', () => {
      it('should return true for valid GetTimeLineResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isGetTimeLineResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isGetTimeLineResponse(invalidResponse)).toBe(false);
      });
    });

    describe('isGetMulSummaryAndTodoResponse', () => {
      it('should return true for valid GetMulSummaryAndTodoResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isGetMulSummaryAndTodoResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isGetMulSummaryAndTodoResponse(invalidResponse)).toBe(false);
      });
    });

    describe('isGetSmartTopicResponse', () => {
      it('should return true for valid GetSmartTopicResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isGetSmartTopicResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isGetSmartTopicResponse(invalidResponse)).toBe(false);
      });
    });

    describe('isGetMultiRecordFileResponse', () => {
      it('should return true for valid GetMultiRecordFileResponse', () => {
        const validResponse = {
          code: 0,
          data: {},
        };
        expect(isGetMultiRecordFileResponse(validResponse)).toBe(true);
      });

      it('should return false for invalid response', () => {
        const invalidResponse = {
          code: 1,
          data: undefined,
        };
        expect(isGetMultiRecordFileResponse(invalidResponse)).toBe(false);
      });
    });
  });
});