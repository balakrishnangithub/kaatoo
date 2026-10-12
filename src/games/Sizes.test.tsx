/**
 * Regression tests for the sizes game:
 *
 *   Layout — the row must fit the field on every supported device, stay
 *   strictly descending, and never shrink below a tappable floor.
 *
 *   Choreography — every visible change must be caused by a tap and happen
 *   visibly: a correct tap places the item (no ghost-fade), the completed
 *   staircase celebrates and leaves as one object, and stale timers from a
 *   previous game can never mutate a fresh one ("items changed by
 *   themselves"). The glide itself is FLIP movement — verified in a real
 *   browser, not jsdom.
 */
