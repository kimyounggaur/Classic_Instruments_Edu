"""Reproducible SQLite contract check for migration, CAS writes and audit isolation."""
import json
import pathlib
import sqlite3

root = pathlib.Path(__file__).resolve().parents[2]
connection = sqlite3.connect(":memory:")
connection.execute("PRAGMA foreign_keys=ON")
for migration in sorted((root / "drizzle").glob("*.sql")):
    connection.executescript(migration.read_text())

audit_sql = """INSERT INTO review_audit (id,user_id,review_id,action,detail_json,created_at)
SELECT json_extract(value,'$.id'),json_extract(value,'$.userId'),json_extract(value,'$.reviewId'),
json_extract(value,'$.action'),json_extract(value,'$.detailJson'),json_extract(value,'$.createdAt')
FROM json_each(?) WHERE changes() > 0"""
events = [dict(id="event1",userId="alice",reviewId="review1",action="submitted",detailJson="{}",createdAt="2026-10-14")]
with connection:
    changed = connection.execute("INSERT OR IGNORE INTO user_states VALUES (?,?,1,?) RETURNING revision", ("alice", "{}", "2026-10-14")).fetchall()
    connection.execute(audit_sql, (json.dumps(events),))
assert changed == [(1,)]
assert connection.execute("SELECT count(*) FROM review_audit").fetchone()[0] == 1

for actor, expected_revision in [("alice", 0), ("bob", 1)]:
    with connection:
        changed = connection.execute("UPDATE user_states SET state_json=?,revision=?,updated_at=? WHERE user_id=? AND revision=? RETURNING revision", ("{}", 2, "2026-10-14", actor, expected_revision)).fetchall()
        events[0]["id"] = f"rejected-{actor}"
        connection.execute(audit_sql, (json.dumps(events),))
    assert not changed
assert connection.execute("SELECT revision FROM user_states WHERE user_id='alice'").fetchone()[0] == 1
assert connection.execute("SELECT count(*) FROM review_audit").fetchone()[0] == 1

# A failed audit insertion rolls back its paired state update.
try:
    with connection:
        connection.execute("UPDATE user_states SET revision=2 WHERE user_id='alice'")
        events[0]["id"] = "event1"
        connection.execute(audit_sql, (json.dumps(events),))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Duplicate event should fail")
assert connection.execute("SELECT revision FROM user_states WHERE user_id='alice'").fetchone()[0] == 1
print("PASS: migrations; compare-and-swap; stale conflict; user isolation; atomic audit rollback")
