# QuickNotes API Design

## Endpoints

| Method | Path | Description | Success Status |
|--------|------|-------------|----------------|
| `GET` | `/notes` | List all notes for the authenticated user. | `200 OK` |
| `GET` | `/notes/{id}` | Retrieve a specific note by its ID. | `200 OK` |
| `POST` | `/notes` | Create a new note. | `201 Created` |
| `PUT` | `/notes/{id}` | Completely replace an existing note. | `200 OK` |
| `DELETE` | `/notes/{id}` | Delete a specific note. | `204 No Content` |
| `GET` | `/notes?tag={tag}` | List notes filtered by a specific tag. | `200 OK` |

## Request & Response Examples

### Create a Note (`POST /notes`)
**Request Body:**
```json
{
  "title": "Buy milk",
  "body": "2 litres, low fat",
  "tags": ["personal", "errands"]
}

-**Response Body (201 Created):
{
  "id": 42,
  "title": "Buy milk",
  "body": "2 litres, low fat",
  "tags": ["personal", "errands"],
  "createdAt": "2023-10-25T10:00:00Z"
}

### List Notes (GET /notes)
Response Body (200 OK):
[
  {
    "id": 42,
    "title": "Buy milk",
    "body": "2 litres, low fat",
    "tags": ["personal", "errands"],
    "createdAt": "2023-10-25T10:00:00Z"
  }
]

### Error Status Codes
### Status Code
### Description
### Example Scenario
400 Bad Request
The request is malformed or missing required fields.
Sending POST /notes without a "title" field.

401 Unauthorized
The request lacks a valid authentication token.
Making a request without a Bearer token in the Authorization header.

403 Forbidden
The user is authenticated but lacks permission for this action.
Trying to DELETE a note that belongs to another user.

404 Not Found
The requested resource does not exist.
Requesting GET /notes/999 when note 999 does not exist.

500 Internal Server Error
An unexpected error occurred on the server.
The database connection fails while trying to save a note.

### Example Error Response Body:
{
  "error": "Bad Request",
  "message": "The 'title' field is required and cannot be empty."
}


