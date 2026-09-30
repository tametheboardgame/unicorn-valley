import { describe, expect, it } from 'vitest';
import { buildSunbeamNoticeBoard } from './SunbeamNoticeBoardModel';

describe('SunbeamNoticeBoardModel', () => {
  it('builds a varied reusable local notice set', () => {
    const notices = buildSunbeamNoticeBoard({
      timeState: 'afternoon',
      fountainRepaired: false,
    });

    expect(notices).toHaveLength(5);
    expect(new Set(notices.map(({ id }) => id)).size).toBe(5);
    expect(notices.some(({ id }) => id === 'story-house')).toBe(true);
    expect(notices.some(({ id }) => id === 'chess')).toBe(true);
  });

  it('changes the current notice with village time', () => {
    const morning = buildSunbeamNoticeBoard({
      timeState: 'morning',
      fountainRepaired: false,
    });
    const night = buildSunbeamNoticeBoard({
      timeState: 'night',
      fountainRepaired: false,
    });

    expect(morning.find(({ id }) => id === 'today')?.title).not.toBe(
      night.find(({ id }) => id === 'today')?.title,
    );
    expect(night.find(({ id }) => id === 'today')?.body).toContain('east path');
  });

  it('reflects the fountain repair state', () => {
    const before = buildSunbeamNoticeBoard({
      timeState: 'afternoon',
      fountainRepaired: false,
    });
    const after = buildSunbeamNoticeBoard({
      timeState: 'afternoon',
      fountainRepaired: true,
    });

    expect(before.find(({ id }) => id === 'fountain')?.title).toContain('parts');
    expect(after.find(({ id }) => id === 'fountain')?.title).toContain('chiming');
  });

  it('turns the hidden map corner into an in-world board discovery', () => {
    const notices = buildSunbeamNoticeBoard({
      timeState: 'morning',
      fountainRepaired: false,
      mapCornerFoundNow: true,
    });

    expect(notices[0].id).toBe('map-corner');
    expect(notices[0].body).toContain('Tansy');
  });

  it('contains no development or roadmap language', () => {
    const notices = buildSunbeamNoticeBoard({
      timeState: 'sunset',
      fountainRepaired: true,
      mapCornerFoundNow: true,
    });
    const copy = notices
      .flatMap(({ eyebrow, title, summary, body, footer }) => [
        eyebrow,
        title,
        summary,
        body,
        footer,
      ])
      .join(' ')
      .toLowerCase();

    for (const forbidden of ['roadmap', 'development', 'placeholder', 'todo', 'h3.11']) {
      expect(copy).not.toContain(forbidden);
    }
  });
});
