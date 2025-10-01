import { ExperienceTimingType } from '../schemas/experience.schema';

export type ExperienceTimelineStatus =
  | 'locked'
  | 'scheduled'
  | 'available'
  | 'past_due'
  | 'completed';

export interface TimelineExperienceInput {
  id: string;
  sequence: number;
  timingType: ExperienceTimingType;
  delayDays?: number;
  lengthDays?: number;
  startDate?: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
  completionRequired: boolean;
  prerequisiteId?: string;
  endWithParent?: boolean;
}

export interface ExperienceTimelineProgressSnapshot {
  completedAt?: Date;
}

export interface BuildExperienceTimelineOptions {
  experiences: TimelineExperienceInput[];
  progressByExperienceId?: Map<string, ExperienceTimelineProgressSnapshot>;
  userAnchor: Date;
  now?: Date;
}

export interface ExperienceTimelineEntry {
  experienceId: string;
  timingType: ExperienceTimingType;
  sequence: number;
  delayDays: number;
  completionRequired: boolean;
  availableAt?: Date;
  dueAt?: Date;
  completedAt?: Date;
  status: ExperienceTimelineStatus;
  anchorExperienceId?: string;
  anchorKind: 'user' | 'available' | 'completed';
  notes: string[];
}

export function buildExperienceTimeline(
  options: BuildExperienceTimelineOptions,
): ExperienceTimelineEntry[] {
  const progressMap =
    options.progressByExperienceId ?? new Map<string, ExperienceTimelineProgressSnapshot>();
  const now = options.now ?? new Date();
  const sorted = [...options.experiences].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return a.sequence - b.sequence;
    }
    return a.id.localeCompare(b.id);
  });

  const entries: ExperienceTimelineEntry[] = [];
  const entryById = new Map<string, ExperienceTimelineEntry>();

  for (const experience of sorted) {
    const previousEntry = entries.length ? entries[entries.length - 1] : undefined;
    const completionSnapshot = progressMap.get(experience.id);
    const completedAt = completionSnapshot?.completedAt;

    const notes: string[] = [];
    let availableAt: Date | undefined;
    let dueAt: Date | undefined;
    let anchorExperienceId: string | undefined;
    let anchorKind: 'user' | 'available' | 'completed' = 'user';

    if (experience.timingType === ExperienceTimingType.DelayAfterPrevious) {
      const anchorDelay = experience.delayDays ?? 0;
      let anchorTime: Date | undefined;

      if (previousEntry) {
        anchorExperienceId = previousEntry.experienceId;
        if (experience.completionRequired) {
          anchorKind = 'completed';
          anchorTime = previousEntry.completedAt;
          if (!anchorTime) {
            notes.push('Waiting for completion of the previous experience.');
          }
        } else {
          anchorKind = 'available';
          anchorTime = previousEntry.availableAt;
          if (!anchorTime) {
            notes.push('Waiting for previous experience to become available.');
          }
        }
      } else {
        anchorKind = 'user';
        anchorTime = options.userAnchor;
      }

      if (anchorTime) {
        availableAt = addDays(anchorTime, anchorDelay);
      }

      if (experience.prerequisiteId) {
        const parentEntry = entryById.get(experience.prerequisiteId);
        if (parentEntry && parentEntry.dueAt && experience.endWithParent) {
          dueAt = parentEntry.dueAt;
        }
      }
    } else if (
      experience.timingType === ExperienceTimingType.StartDateAndLength
    ) {
      if (experience.startDate) {
        availableAt = combineDateAndTime(
          experience.startDate,
          experience.startTime,
        );
        const inclusiveDays = Math.max(1, experience.lengthDays ?? 1);
        const endDate = addDays(availableAt, inclusiveDays - 1);
        const appliedEndTime = experience.endTime ?? experience.startTime;
        dueAt = combineDateAndTime(endDate, appliedEndTime);
      } else {
        notes.push('startDate is required for start_date_and_length timing.');
      }
    } else if (experience.timingType === ExperienceTimingType.DateRange) {
      if (experience.startDate) {
        availableAt = combineDateAndTime(
          experience.startDate,
          experience.startTime,
        );
      } else {
        notes.push('startDate is required for date_range timing.');
      }

      if (experience.endDate) {
        dueAt = combineDateAndTime(experience.endDate, experience.endTime);
      } else {
        notes.push('endDate is required for date_range timing.');
      }
    }

    const entry: ExperienceTimelineEntry = {
      experienceId: experience.id,
      timingType: experience.timingType,
      sequence: experience.sequence,
      delayDays: experience.delayDays ?? 0,
      completionRequired: experience.completionRequired,
      availableAt,
      dueAt,
      completedAt,
      anchorExperienceId,
      anchorKind,
      notes,
      status: 'locked',
    };

    entry.status = resolveStatus(entry, now);

    if (entry.status === 'locked' && entry.notes.length === 0) {
      entry.notes.push('Experience is waiting on prerequisite timing.');
    }

    entries.push(entry);
    entryById.set(experience.id, entry);
  }

  return entries;
}

function resolveStatus(
  entry: ExperienceTimelineEntry,
  now: Date,
): ExperienceTimelineStatus {
  if (entry.completedAt) {
    return 'completed';
  }

  if (!entry.availableAt) {
    return 'locked';
  }

  if (entry.dueAt && entry.dueAt < now) {
    return 'past_due';
  }

  if (entry.availableAt > now) {
    return 'scheduled';
  }

  return 'available';
}

function combineDateAndTime(date: Date, time?: string): Date {
  const result = new Date(date.getTime());
  if (!time) {
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }

  const [hours, minutes, seconds] = parseTimeParts(time);
  result.setUTCHours(hours, minutes, seconds, 0);
  return result;
}

function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function parseTimeParts(value: string): [number, number, number] {
  const parts = value.split(':');
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);
  const seconds = Number(parts[2] ?? 0);
  return [hours, minutes, seconds];
}
