---
title: The invariant belongs in the schema
description: Why the most important business rule in your application should be enforced by the database, not by your service layer.
published: 2026-07-02
topic: Engineering
stratum: grid
---

Every application has one rule that must never be violated. Two bookings cannot hold
the same slot. Stock cannot go negative. A module cannot exceed its capacity.

Almost every application enforces that rule in the wrong place.

## The race you cannot see

The natural implementation reads then writes:

```sql
SELECT count(*) FROM booking WHERE slot = :slot;  -- 0, we are clear
INSERT INTO booking (slot) VALUES (:slot);        -- go ahead
```

Between those two statements is a window. Under load, two requests both read zero and
both insert. The rule is violated, no error is raised, and the bug reproduces only when
the system is busy — which is to say, in production and never in review.

## Let the database arbitrate

Postgres can express the rule directly:

```sql
CONSTRAINT no_overlap EXCLUDE USING gist (
    resource_id WITH =,
    slot        WITH &&
) WHERE (status = 'CONFIRMED')
```

Now an overlapping insert is _impossible_ at any isolation level. The application does
an optimistic insert and translates the constraint violation into a 409.

Three things follow. There is no window. There is no application-held lock, so
unrelated resources never contend. And the guarantee survives a refactor, a second
service, or somebody running an UPDATE by hand at 2am — none of which respect your
service layer.
