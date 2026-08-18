# R3-WP3.6 - Nova's First Race Story

Status: **Complete**

## Outcome

Rainbow Run is now introduced through Nova rather than through an isolated race menu. Talking to Nova starts a short relationship-led quest, teaches the race controls in character, sends the player into a deliberately simpler first-run course and then brings the result back into Nova's dialogue.

Completing the story unlocks the named **Sunrise Sprint** race for repeat play.

## Nova invitation quest

The new **Nova's First Race** quest uses the existing persistent quest and relationship systems.

Its progression is:

1. talk to Nova in Rainbow Meadow;
2. finish Nova's first-run race;
3. return to Nova;
4. gain friendship with Nova;
5. unlock Sunrise Sprint.

The quest engine now supports a reusable `finish-race` objective driven by the existing `RACE_FINISHED` event. Future race stories can therefore use the same data-driven mechanism without scene-specific quest code.

## Character-led tutorial

Nova's invitation explains only the controls needed for the first run:

- the unicorn runs automatically;
- tap **JUMP** or press **Space** for obstacles;
- bright course strips provide a boost;
- reaching the finish is the objective;
- finishing place does not decide whether the first ribbon is earned.

The Rainbow Run entrance routes through the story state. Before the first race it leads into Nova's introduction, during the quest it launches the tutorial race, and after completion it opens Sunrise Sprint.

## Tutorial race variant

**Nova's First Run** is a separate, gentler course variant rather than the full race with tutorial text layered over it.

It contains:

- one opponent, Nova;
- one clearly labelled flower hurdle;
- one boost strip;
- four optional race sparkles;
- the same automatic-running and jump controls as the full race.

The smaller feature count gives the player room to understand the rhythm before the full course adds more obstacles and racers.

## Result-sensitive Nova response

The tutorial remembers whether the player crossed the line before Nova.

If the player wins, Nova explicitly recognises the first-place finish.

If Nova finishes first, the response focuses on the player having completed the course and now understanding its jump, boost and finish flow. It does not describe the result as failure and it does not block any progression.

Both outcomes unlock the same story continuation and the same named follow-up race.

## First ribbon and rewards

The existing Rainbow Run reward rules remain in force for the tutorial:

- finishing always awards participation Sparkles;
- the first completed run awards the Rainbow Run Finisher Ribbon regardless of place;
- stronger finishes may still receive the existing podium Sparkle bonus;
- progression never depends on winning.

Race keepsakes are now treated as globally owned rewards when moving between course IDs. Sunrise Sprint therefore cannot incorrectly announce that the same Finisher Ribbon or Podium Rosette is newly owned a second time.

## Sunrise Sprint unlock

Completing Nova's result conversation:

- raises Nova to the first friendship tier;
- sets the persistent Sunrise Sprint unlock flag;
- completes Nova's first-race quest.

The existing full four-racer Rainbow Run course is now named **Sunrise Sprint** and becomes the repeatable race available after the introduction.

## Automated coverage

Tests cover:

- the new race-finish quest step;
- ignoring unrelated race completion events;
- Nova quest completion and friendship reward;
- persistent Sunrise Sprint unlock;
- story phase selection;
- win/non-win result memory;
- tutorial course validation;
- the tutorial being structurally simpler than Sunrise Sprint;
- a second-place tutorial finish still receiving the first Finisher Ribbon;
- the same keepsake not being falsely reported as new on the follow-up course.

## Acceptance

- racing is introduced through Nova and her relationship quest;
- the first run is a real gentler race variant;
- finishing behind Nova still completes the tutorial and produces positive continuation;
- finishing first produces distinct dialogue without exclusive progression;
- the Finisher Ribbon is available regardless of tutorial position;
- Sunrise Sprint unlocks persistently after the story.

## Next package

**R3-WP3.7 - Race Assistance and Difficulty**
