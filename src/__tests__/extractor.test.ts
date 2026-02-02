import {
  extractMeetingData,
  extractFromMinutesDetail,
  extractFromCommonRecordInfo,
  sanitizeText,
  formatTimestamp,
  formatDuration,
  validateMeetingData,
  extractFromFullSummary,
  extractFromChapter,
  extractFromTimeLine,
  extractFromMulSummaryAndTodo,
  extractFromSmartTopic,
  extractFromMultiRecordFile,
} from '../utils/extractor';
import {
  MinutesDetailResponse,
  CommonRecordInfoResponse,
  GetFullSummaryResponse,
  GetChapterResponse,
  GetTimeLineResponse,
  GetMulSummaryAndTodoResponse,
  GetSmartTopicResponse,
  GetMultiRecordFileResponse,
} from '../types/meeting';

describe('Extractor Utility Functions', () => {
  describe('extractFromMinutesDetail', () => {
    it('should extract data from minutes detail response', () => {
      const mockResponse: MinutesDetailResponse = {
        code: 0,
        minutes: {
          lang: 'zh-CN',
          paragraphs: [
            {
              pid: '1',
              lang: 'zh-CN',
              start_time: 1000,
              end_time: 2000,
              sentences: [
                {
                  sid: 's1',
                  start_time: 1000,
                  end_time: 1500,
                  words: [
                    {
                      wid: 'w1',
                      start_time: 1000,
                      end_time: 1250,
                      text: '你好',
                    },
                    {
                      wid: 'w2',
                      start_time: 1250,
                      end_time: 1500,
                      text: '世界',
                    },
                  ],
                },
              ],
              speaker: {
                user_id: 'user1',
                user_name: '张三',
              },
            },
          ],
          keywords: [{ keyword: '关键词1' }, { keyword: '关键词2' }],
          chapters: [
            {
              chapter_id: 'ch1',
              title: '第一章',
              start_time: 0,
              end_time: 10000,
              summary: '第一章摘要',
            },
          ],
          summary: '会议总结',
          action_items: [
            {
              id: 'ai1',
              content: '完成项目计划',
              assignee: '李四',
            },
          ],
        },
      };

      const result = extractFromMinutesDetail(mockResponse);

      expect(result.transcript).toHaveLength(1);
      expect(result.transcript[0]).toEqual({
        pid: '1',
        start_time: 1000,
        end_time: 2000,
        text: '你好世界',
        speaker: '张三',
        speaker_id: 'user1',
      });

      expect(result.keywords).toEqual(['关键词1', '关键词2']);
      expect(result.chapters).toHaveLength(1);
      expect(result.chapters![0]).toEqual({
        id: 'ch1',
        title: '第一章',
        start_time: 0,
        end_time: 10000,
        summary: '第一章摘要',
      });

      expect(result.summary).toBe('会议总结');
      expect(result.action_items).toHaveLength(1);
      expect(result.action_items![0]).toEqual({
        id: 'ai1',
        description: '完成项目计划',
        assignee: '李四',
      });
    });

    it('should return empty object for invalid response', () => {
      const mockResponse: MinutesDetailResponse = {
        code: 1,
        minutes: undefined,
      };

      const result = extractFromMinutesDetail(mockResponse);
      expect(result).toEqual({});
    });
  });

  describe('extractFromCommonRecordInfo', () => {
    it('should extract data from common record info response', () => {
      const mockResponse: CommonRecordInfoResponse = {
        code: 0,
        data: {
          sharing_id: 'sharing123',
          pk_meeting_info_id: 'pk123',
          meeting_info: {
            subject: '会议主题',
            origin_subject: '原始主题',
            meeting_code: '123456789',
            meeting_id: 'meeting123',
            start_time: '1640995200000',
            end_time: '1640998800000',
            meeting_type: 1,
            is_rooms: false,
            is_oversea: false,
            hybrid_meeting_type: 0,
          },
          recordings: [
            {
              id: 'rec123',
              sharing_id: 'sharing123',
              name: '录制1',
              start_time: '1640995200000',
              end_time: '1640998800000',
              duration: '3600000',
              size: '1024000',
              state: 1,
            },
          ],
          meeting_members: [
            {
              app_uid: 'uid1',
              user_name: '张三',
              avatar_url: 'https://example.com/avatar.jpg',
            },
            {
              app_uid: 'uid2',
              user_name: '李四',
              avatar_url: 'https://example.com/avatar2.jpg',
            },
          ],
          share_id: 'share123',
        },
      };

      const result = extractFromCommonRecordInfo(mockResponse);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.meeting_id).toBe('meeting123');
      expect(result.metadata!.recording_id).toBe('rec123');
      expect(result.metadata!.title).toBe('会议主题');
      expect(result.metadata!.start_time).toBe(1640995200000);
      expect(result.metadata!.end_time).toBe(1640998800000);
      expect(result.metadata!.duration).toBe(3600000);
      expect(result.metadata!.share_id).toBe('share123');
      expect(result.metadata!.meeting_code).toBe('123456789');
      expect(result.metadata!.pk_meeting_info_id).toBe('pk123');

      expect(result.participants).toHaveLength(2);
      expect(result.participants![0]).toEqual({
        user_id: 'uid1',
        user_name: '张三',
        avatar_url: 'https://example.com/avatar.jpg',
      });
      expect(result.participants![1]).toEqual({
        user_id: 'uid2',
        user_name: '李四',
        avatar_url: 'https://example.com/avatar2.jpg',
      });

      expect(result.recording_info).toBeDefined();
      expect(result.recording_info!.id).toBe('rec123');
    });

    it('should return empty object for invalid response', () => {
      const mockResponse: CommonRecordInfoResponse = {
        code: 1,
        data: undefined,
      };

      const result = extractFromCommonRecordInfo(mockResponse);
      expect(result).toEqual({});
    });
  });

  describe('extractMeetingData', () => {
    it('should merge data from multiple API responses', () => {
      const minutesDetail: MinutesDetailResponse = {
        code: 0,
        minutes: {
          lang: 'zh-CN',
          paragraphs: [
            {
              pid: '1',
              lang: 'zh-CN',
              start_time: 1000,
              end_time: 2000,
              sentences: [
                {
                  sid: 's1',
                  start_time: 1000,
                  end_time: 2000,
                  words: [
                    {
                      wid: 'w1',
                      start_time: 1000,
                      end_time: 2000,
                      text: '会议开始',
                    },
                  ],
                },
              ],
              speaker: {
                user_id: 'user1',
                user_name: '张三',
              },
            },
          ],
          summary: '会议总结',
        },
      };

      const commonRecordInfo: CommonRecordInfoResponse = {
        code: 0,
        data: {
          sharing_id: 'sharing123',
          pk_meeting_info_id: 'pk123',
          meeting_info: {
            subject: '会议主题',
            meeting_code: '123456789',
            meeting_id: 'meeting123',
            start_time: '1640995200000',
            end_time: '1640998800000',
            meeting_type: 1,
            is_rooms: false,
            is_oversea: false,
            hybrid_meeting_type: 0,
          },
          recordings: [
            {
              id: 'rec123',
              sharing_id: 'sharing123',
              name: '录制1',
              start_time: '1640995200000',
              end_time: '1640998800000',
              duration: '3600000',
              size: '1024000',
              state: 1,
            },
          ],
          meeting_members: [
            {
              app_uid: 'uid1',
              user_name: '张三',
            },
          ],
        },
      };

      const result = extractMeetingData({
        minutesDetail,
        commonRecordInfo,
      });

      expect(result).toBeDefined();
      expect(result!.metadata.meeting_id).toBe('meeting123');
      expect(result!.metadata.recording_id).toBe('rec123');
      expect(result!.transcript).toHaveLength(1);
      expect(result!.summary).toBe('会议总结');
      expect(result!.participants).toHaveLength(1);
    });

    it('should handle missing data gracefully', () => {
      const result = extractMeetingData({});
      expect(result).toBeNull();
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize text to prevent XSS', () => {
      const maliciousText = '<script>alert("XSS")</script>';
      const sanitized = sanitizeText(maliciousText);
      
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle normal text correctly', () => {
      const normalText = 'Hello, World!';
      const sanitized = sanitizeText(normalText);
      
      expect(sanitized).toBe('Hello, World!');
    });

    it('should handle empty text', () => {
      const emptyText = '';
      const sanitized = sanitizeText(emptyText);
      
      expect(sanitized).toBe('');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to readable format', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
      const formatted = formatTimestamp(timestamp);
      
      // Format depends on local timezone, but should contain date/time elements
      expect(formatted).toContain('2022');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in milliseconds to readable format', () => {
      expect(formatDuration(5000)).toBe('5秒');
      expect(formatDuration(120000)).toBe('2分钟0秒');
      expect(formatDuration(7200000)).toBe('2小时0分钟');
    });
  });

  describe('validateMeetingData', () => {
    it('should validate complete meeting data', () => {
      const validData = {
        metadata: {
          meeting_id: 'meeting123',
          recording_id: 'rec123',
          title: 'Valid Meeting',
        },
        transcript: [
          {
            pid: '1',
            start_time: 1000,
            end_time: 2000,
            text: 'Test transcript',
            speaker: 'Speaker',
          },
        ],
        captured_at: Date.now(),
      };

      const result = validateMeetingData(validData as any);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {
        metadata: {
          meeting_id: '',
          recording_id: '',
          title: '未命名会议',
        },
        transcript: [],
        captured_at: Date.now(),
      };

      const result = validateMeetingData(invalidData as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少会议 ID 或录制 ID');
      expect(result.errors).toContain('没有转写数据');
    });
  });

  describe('extractFromFullSummary', () => {
    it('should extract full summary data', () => {
      const mockResponse: GetFullSummaryResponse = {
        code: 0,
        data: {
          full_summary: '这是一份完整的会议纪要',
          summary_deal_status: 2,
          lang: 'zh-CN',
        },
      };

      const result = extractFromFullSummary(mockResponse);
      expect(result.full_summary).toEqual({
        full_summary: '这是一份完整的会议纪要',
        summary_deal_status: 2,
        lang: 'zh-CN',
      });
    });

    it('should return empty for invalid response', () => {
      const mockResponse: GetFullSummaryResponse = {
        code: 1,
        data: undefined,
      };

      const result = extractFromFullSummary(mockResponse);
      expect(result).toEqual({});
    });
  });

  describe('extractFromChapter', () => {
    it('should extract chapter details', () => {
      const mockResponse: GetChapterResponse = {
        code: 0,
        data: {
          chapter_list: [
            {
              chapter_id: 'ch1',
              title: '第一章',
              start_time: 0,
              end_time: 10000,
              summary: '第一章摘要',
              chapter_type: 1,
              lang: 'zh-CN',
            },
          ],
        },
      };

      const result = extractFromChapter(mockResponse);
      expect(result.chapter_details).toHaveLength(1);
      expect(result.chapter_details![0]).toEqual({
        chapter_id: 'ch1',
        title: '第一章',
        start_time: 0,
        end_time: 10000,
        summary: '第一章摘要',
        chapter_type: 1,
        lang: 'zh-CN',
      });
    });

    it('should return empty for invalid response', () => {
      const mockResponse: GetChapterResponse = {
        code: 1,
        data: undefined,
      };

      const result = extractFromChapter(mockResponse);
      expect(result).toEqual({});
    });
  });

  describe('extractFromTimeLine', () => {
    it('should extract timeline events', () => {
      const mockResponse: GetTimeLineResponse = {
        code: 0,
        data: {
          timeline_list: [
            {
              event_id: 'ev1',
              event_time: 5000,
              event_type: 1,
              event_title: '事件标题',
              event_content: '事件内容',
              participants: ['张三', '李四'],
            },
          ],
        },
      };

      const result = extractFromTimeLine(mockResponse);
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline![0]).toEqual({
        event_id: 'ev1',
        event_time: 5000,
        event_type: 1,
        event_title: '事件标题',
        event_content: '事件内容',
        participants: ['张三', '李四'],
      });
    });

    it('should return empty for invalid response', () => {
      const mockResponse: GetTimeLineResponse = {
        code: 1,
        data: undefined,
      };

      const result = extractFromTimeLine(mockResponse);
      expect(result).toEqual({});
    });
  });

  describe('extractFromMulSummaryAndTodo', () => {
    it('should extract multiple summary types', () => {
      const mockResponses = {
        topicSummary: {
          code: 0,
          data: {
            topic_summary: {
              begin_summary: '开始总结',
              sub_points: [
                {
                  title: '要点1',
                  content: '要点内容1',
                },
              ],
              end_summary: '结束总结',
              summary_status: 2,
              lang: 'zh-CN',
              model_status: 1,
            },
          },
        } as GetMulSummaryAndTodoResponse,
        chapterSummary: {
          code: 0,
          data: {
            chapter_summary: {
              summary_list: [
                {
                  chapter_id: 'ch1',
                  chapter_title: '章节标题',
                  summary: '章节摘要',
                  start_time: 0,
                  end_time: 10000,
                },
              ],
              summary_status: 2,
              lang: 'zh-CN',
              model_status: 1,
            },
          },
        } as GetMulSummaryAndTodoResponse,
        speakerSummary: {
          code: 0,
          data: {
            speaker_summary: {
              speakers_opinions: [
                {
                  speaker_id: 'sp1',
                  sub_points: [
                    {
                      sub_point_title: '观点标题',
                      sub_point_vec_items: [
                        {
                          point: '具体观点',
                          refs: [],
                        },
                      ],
                    },
                  ],
                },
              ],
              custom_summary: '自定义摘要',
              orig_custom_summary: '原始摘要',
              summary_status: 2,
              lang: 'zh-CN',
              model_status: 1,
            },
            todo: {
              todo_list: [
                {
                  todo_id: 'td1',
                  todo_name: '待办事项',
                  todo_time: '2022-01-01',
                  background: '背景信息',
                  persons: ['张三'],
                  engine_type: 1,
                  sort_by: 1,
                },
              ],
              todo_status: 2,
            },
          },
        } as GetMulSummaryAndTodoResponse,
      };

      const result = extractFromMulSummaryAndTodo(mockResponses);
      
      expect(result.topic_summary_data).toBeDefined();
      expect(result.chapter_summary_data).toBeDefined();
      expect(result.speaker_summary_data).toBeDefined();
      expect(result.todo_items).toHaveLength(1);
    });

    it('should handle missing responses', () => {
      const result = extractFromMulSummaryAndTodo({});
      expect(result).toEqual({});
    });
  });

  describe('extractFromSmartTopic', () => {
    it('should extract smart topics', () => {
      const mockResponse: GetSmartTopicResponse = {
        code: 0,
        data: {
          topic_infos: [
            {
              topic_id: 'tp1',
              topic_name: '话题名称',
              start_time: '1640995200000',
              end_time: '1640995300000',
              percentage: 10,
              scope: [
                {
                  pid: 'p1',
                  start_time: '1640995200000',
                  end_time: '1640995250000',
                },
              ],
            },
          ],
        },
      };

      const result = extractFromSmartTopic(mockResponse);
      expect(result.smart_topics).toHaveLength(1);
      expect(result.smart_topics![0]).toEqual({
        topic_id: 'tp1',
        topic_name: '话题名称',
        start_time: '1640995200000',
        end_time: '1640995300000',
        percentage: 10,
        scope: [
          {
            pid: 'p1',
            start_time: '1640995200000',
            end_time: '1640995250000',
          },
        ],
      });
    });

    it('should return empty for invalid response', () => {
      const mockResponse: GetSmartTopicResponse = {
        code: 1,
        data: undefined,
      };

      const result = extractFromSmartTopic(mockResponse);
      expect(result).toEqual({});
    });
  });

  describe('extractFromMultiRecordFile', () => {
    it('should extract recording files', () => {
      const mockResponse: GetMultiRecordFileResponse = {
        code: 0,
        data: {
          file_list: [
            {
              file_id: 'f1',
              file_type: 'video',
              file_name: 'recording.mp4',
              file_size: 1024000,
              download_url: 'https://example.com/download',
              duration: 3600000,
              format: 'mp4',
              quality: 'hd',
            },
          ],
        },
      };

      const result = extractFromMultiRecordFile(mockResponse);
      expect(result.recording_files).toHaveLength(1);
      expect(result.recording_files![0]).toEqual({
        file_id: 'f1',
        file_type: 'video',
        file_name: 'recording.mp4',
        file_size: 1024000,
        download_url: 'https://example.com/download',
        duration: 3600000,
        format: 'mp4',
        quality: 'hd',
      });
    });

    it('should return empty for invalid response', () => {
      const mockResponse: GetMultiRecordFileResponse = {
        code: 1,
        data: undefined,
      };

      const result = extractFromMultiRecordFile(mockResponse);
      expect(result).toEqual({});
    });
  });
});