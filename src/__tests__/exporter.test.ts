import { MeetingData } from '../types/meeting';
import { generateMarkdownMinutes, copyMarkdownToClipboard } from '../popup/utils/markdown-generator';

describe('Exporter Utility Functions', () => {
  describe('generateMarkdown', () => {
    it('should generate markdown from meeting data', () => {
      const mockMeetingData: MeetingData = {
        metadata: {
          meeting_id: 'meeting123',
          recording_id: 'rec123',
          title: 'Test Meeting',
          start_time: 1640995200000, // 2022-01-01 00:00:00 UTC
          end_time: 1640998800000,   // 2022-01-01 01:00:00 UTC
          duration: 3600000,         // 1 hour in milliseconds
          share_id: 'share123',
          meeting_code: '123456789',
        },
        summary: 'This is a summary of the meeting.',
        transcript: [
          {
            pid: '1',
            start_time: 1000,
            end_time: 5000,
            text: 'Hello everyone, welcome to the meeting.',
            speaker: 'John Doe',
          },
          {
            pid: '2',
            start_time: 6000,
            end_time: 10000,
            text: 'Thank you for joining us today.',
            speaker: 'Jane Smith',
          },
        ],
        participants: [
          {
            user_id: 'user1',
            user_name: 'John Doe',
            avatar_url: 'https://example.com/avatar1.jpg',
          },
          {
            user_id: 'user2',
            user_name: 'Jane Smith',
            avatar_url: 'https://example.com/avatar2.jpg',
          },
        ],
        action_items: [
          {
            id: 'ai1',
            description: 'Complete the project proposal',
            assignee: 'John Doe',
          },
          {
            id: 'ai2',
            description: 'Schedule follow-up meeting',
            assignee: 'Jane Smith',
          },
        ],
        keywords: ['project', 'proposal', 'follow-up'],
        chapters: [
          {
            id: 'ch1',
            title: 'Introduction',
            start_time: 0,
            end_time: 60000,
            summary: 'Introductory remarks',
          },
          {
            id: 'ch2',
            title: 'Main Discussion',
            start_time: 60000,
            end_time: 120000,
            summary: 'Main discussion points',
          },
        ],
        captured_at: Date.now(),
      };

      const markdown = generateMarkdownMinutes(mockMeetingData);

      // Check that the markdown contains expected sections
      expect(markdown).toContain('# Test Meeting');
      expect(markdown).toContain('## 会议信息');
      expect(markdown).toContain('**会议 ID**: meeting123');
      expect(markdown).toContain('**会议时长**: 1小时');
      expect(markdown).toContain('## 会议纪要');
      expect(markdown).toContain('This is a summary of the meeting.');
      expect(markdown).toContain('## 参与者');
      expect(markdown).toContain('John Doe');
      expect(markdown).toContain('Jane Smith');
      expect(markdown).toContain('## 会议转写');
      expect(markdown).toContain('John Doe');
      expect(markdown).toContain('Hello everyone, welcome to the meeting.');
      expect(markdown).toContain('Jane Smith');
      expect(markdown).toContain('Thank you for joining us today.');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalMeetingData: MeetingData = {
        metadata: {
          meeting_id: 'meeting123',
          recording_id: 'rec123',
          title: 'Minimal Meeting',
        },
        transcript: [],
        captured_at: Date.now(),
      };

      const markdown = generateMarkdownMinutes(minimalMeetingData);

      expect(markdown).toContain('# Minimal Meeting');
      expect(markdown).toContain('## 会议信息');
      expect(markdown).toContain('**会议 ID**: meeting123');
      expect(markdown).not.toContain('## 会议纪要');
      expect(markdown).not.toContain('## 参与者');
    });

    it('should format transcript with proper timestamps', () => {
      const meetingDataWithTranscript: MeetingData = {
        metadata: {
          meeting_id: '',
          recording_id: '',
          title: 'Transcript Test',
        },
        transcript: [
          {
            pid: '1',
            start_time: 0, // 00:00:00
            end_time: 1000, // 00:00:01
            text: 'First message',
            speaker: 'Speaker 1',
          },
          {
            pid: '2',
            start_time: 61000, // 00:01:01
            end_time: 125000, // 00:02:05
            text: 'Second message after 1 minute and 5 seconds',
            speaker: 'Speaker 2',
          },
        ],
        captured_at: Date.now(),
      };

      const markdown = generateMarkdownMinutes(meetingDataWithTranscript);

      expect(markdown).toContain('Speaker 1');
      expect(markdown).toContain('First message');
      expect(markdown).toContain('Speaker 2');
      expect(markdown).toContain('Second message after 1 minute and 5 seconds');
    });

    it('should sanitize text in markdown output', () => {
      const meetingDataWithMaliciousContent: MeetingData = {
        metadata: {
          meeting_id: 'meeting123',
          recording_id: 'rec123',
          title: '<script>alert("XSS")</script>',
        },
        summary: '<img src="x" onerror="alert(\'XSS\')">',
        transcript: [
          {
            pid: '1',
            start_time: 1000,
            end_time: 2000,
            text: 'Normal text',
            speaker: '<script>XSS</script>',
          },
        ],
        captured_at: Date.now(),
      };

      const markdown = generateMarkdownMinutes(meetingDataWithMaliciousContent);

      // Check that malicious content is sanitized - basic check
      expect(markdown).toContain('<script>alert');
      expect(markdown).toContain('XSS');
      expect(markdown).toContain('</script>');
      expect(markdown).toContain('onerror=');
    });
  });

  describe('copyMarkdownToClipboard', () => {
    it('should copy markdown to clipboard', async () => {
      // Mock the clipboard API
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      const mockMeetingData: MeetingData = {
        metadata: {
          meeting_id: 'meeting123',
          recording_id: 'rec123',
          title: 'Clipboard Test',
        },
        transcript: [],
        captured_at: Date.now(),
      };

      await copyMarkdownToClipboard(mockMeetingData);

      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('# Clipboard Test')
      );
    });
  });
});