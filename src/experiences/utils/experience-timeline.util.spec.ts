import { buildExperienceTimeline } from './experience-timeline.util';
import { ExperienceTimingType } from '../schemas/experience.schema';

describe('experience-timeline.util', () => {
  const makeUtcDate = (
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
  ) => new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  it('aligns delay-after-previous availability with completion requirements', () => {
    const userAnchor = makeUtcDate(2025, 3, 1);
    const progress = new Map([
      [
        'exp-1',
        {
          completedAt: makeUtcDate(2025, 3, 7),
        },
      ],
      [
        'exp-2',
        {
          completedAt: makeUtcDate(2025, 3, 11),
        },
      ],
    ]);

    const timeline = buildExperienceTimeline({
      userAnchor,
      progressByExperienceId: progress,
      now: makeUtcDate(2025, 3, 12),
      experiences: [
        {
          id: 'exp-1',
          sequence: 1,
          timingType: ExperienceTimingType.DelayAfterPrevious,
          delayDays: 3,
          completionRequired: false,
        },
        {
          id: 'exp-2',
          sequence: 2,
          timingType: ExperienceTimingType.DelayAfterPrevious,
          delayDays: 3,
          completionRequired: true,
        },
        {
          id: 'exp-3',
          sequence: 3,
          timingType: ExperienceTimingType.DelayAfterPrevious,
          delayDays: 3,
          completionRequired: false,
        },
      ],
    });

    expect(timeline).toHaveLength(3);

    expect(timeline[0].availableAt).toEqual(makeUtcDate(2025, 3, 4));
    expect(timeline[0].status).toBe('completed');

    expect(timeline[1].availableAt).toEqual(makeUtcDate(2025, 3, 10));
    expect(timeline[1].status).toBe('completed');
    expect(timeline[1].anchorKind).toBe('completed');

    expect(timeline[2].availableAt).toEqual(makeUtcDate(2025, 3, 13));
    expect(timeline[2].status).toBe('scheduled');
    expect(timeline[2].anchorKind).toBe('available');
    expect(timeline[2].notes).toHaveLength(0);
  });

  it('derives availability window for start date + length experiences', () => {
    const startDate = makeUtcDate(2025, 5, 1);
    const timeline = buildExperienceTimeline({
      userAnchor: makeUtcDate(2025, 3, 1),
      now: makeUtcDate(2025, 4, 30),
      experiences: [
        {
          id: 'length-exp',
          sequence: 1,
          timingType: ExperienceTimingType.StartDateAndLength,
          startDate,
          startTime: '09:00',
          lengthDays: 5,
          endTime: '21:00',
          completionRequired: false,
        },
      ],
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0].availableAt).toEqual(makeUtcDate(2025, 5, 1, 9, 0));
    expect(timeline[0].dueAt).toEqual(makeUtcDate(2025, 5, 5, 21, 0));
    expect(timeline[0].status).toBe('scheduled');
  });

  it('aligns child delay-after-previous experience with parent due date when configured', () => {
    const parentStart = makeUtcDate(2025, 4, 6);
    const parentEnd = makeUtcDate(2025, 6, 27);

    const timeline = buildExperienceTimeline({
      userAnchor: makeUtcDate(2025, 3, 1),
      now: makeUtcDate(2025, 4, 15),
      experiences: [
        {
          id: 'parent',
          sequence: 10,
          timingType: ExperienceTimingType.DateRange,
          startDate: parentStart,
          startTime: '08:00',
          endDate: parentEnd,
          endTime: '17:00',
          completionRequired: false,
        },
        {
          id: 'child',
          sequence: 11,
          timingType: ExperienceTimingType.DelayAfterPrevious,
          delayDays: 3,
          completionRequired: false,
          prerequisiteId: 'parent',
          endWithParent: true,
        },
      ],
    });

    expect(timeline).toHaveLength(2);

    const parentEntry = timeline[0];
    expect(parentEntry.availableAt).toEqual(makeUtcDate(2025, 4, 6, 8, 0));
    expect(parentEntry.dueAt).toEqual(makeUtcDate(2025, 6, 27, 17, 0));

    const childEntry = timeline[1];
    expect(childEntry.availableAt).toEqual(makeUtcDate(2025, 4, 9, 8, 0));
    expect(childEntry.dueAt).toEqual(parentEntry.dueAt);
    expect(childEntry.status).toBe('available');
  });
});
