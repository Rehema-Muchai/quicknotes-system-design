# QuickNotes Data Model

## Entities and Relationships
- **users**: Stores user account information. (Primary Key: `id`)
- **notes**: Stores the content of each note. (Primary Key: `id`, Foreign Key: `user_id` -> `users.id`). **Relationship:** One-to-Many (One user has many notes).
- **tags**: Stores unique tag names. (Primary Key: `id`).
- **note_tags**: A join table linking notes and tags. (Composite Primary Key: `note_id`, `tag_id`). **Relationship:** Many-to-Many (A note can have many tags, and a tag can belong to many notes). A join table is required because relational databases cannot directly map many-to-many relationships without an intermediary.

## CREATE TABLE Statements
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

## Example SQL Queries
1. Get all notes for a specific user (with JOIN):
   SELECT n.title, n.body, n.created_at 
   FROM notes n
   JOIN users u ON n.user_id = u.id
   WHERE u.email = 'amina@example.com'
   ORDER BY n.created_at DESC;

2. Get all tags for a specific note:
   SELECT t.name 
   FROM tags t
   JOIN note_tags nt ON t.id = nt.tag_id
   WHERE nt.note_id = 42;

3. Count the number of notes per user:
   SELECT u.name, COUNT(n.id) AS note_count
   FROM users u
   LEFT JOIN notes n ON u.id = n.user_id
   GROUP BY u.id;

## Indexing Strategy
CREATE INDEX idx_notes_user_id ON notes(user_id);

**Reason:** The most common query is fetching notes for a specific user (WHERE user_id = ?). Indexing user_id allows the database to instantly locate the user's notes without scanning the entire notes table, significantly speeding up read operations.

## SQL vs NoSQL Justification
I would choose a **SQL (relational) database** for QuickNotes. The data is highly structured with strict, well-defined relationships (users own notes, notes have tags). SQL databases enforce data integrity natively through FOREIGN KEY constraints (preventing orphaned notes), UNIQUE constraints (preventing duplicate tags or emails), and ON DELETE CASCADE (automatically cleaning up join tables). A NoSQL document database would require the application layer to manually enforce these relationships, increasing the risk of data inconsistency.