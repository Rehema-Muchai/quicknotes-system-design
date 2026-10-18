# QuickNotes System Architecture

## Requirements
- **Functional:** Users can create, read, update, delete, and search notes. Users can tag notes. Data must persist across sessions and devices.
- **Non-Functional:** The system must support 1 million users, maintain 99.9% availability, serve read requests in < 200ms, and securely authenticate all users.

## Load Estimates (1 Million Users)
- **Daily Active Users (DAU):** 1,000,000 × 20% = 200,000 DAU.
- **Writes (Creates/Updates):** 200,000 users × 5 notes/day = 1,000,000 writes/day ≈ **10 writes/sec** (peak: ~50 writes/sec).
- **Reads (Views/Searches):** 200,000 users × 20 views/day = 4,000,000 reads/day ≈ **40 reads/sec** (peak: ~200 reads/sec).
- **Storage:** 1,000,000 notes/day × 500 bytes/note = 500 MB/day ≈ **180 GB/year**.
- **Conclusion:** The system is **read-heavy** (4:1 ratio). We must optimize for fast reads using caching and read replicas.

## Architecture Diagram
```text
                               ┌─────────┐
                  ┌──────────> │   DNS   │
                  │            └─────────┘
  ┌───────────────┴──────┐  static assets  ┌──────────────────────┐
  │  User Browser / App  │ ──────────────> │  CDN (HTML, CSS, JS) │
  └───────────────┬──────┘                 └──────────────────────
                  │ API calls (HTTPS)
                  v
           ┌───────────────┐
           │ Load Balancer │
           └──────┬────────┘
             ┌────┴─────┬──────────┐
             v          v          v
        ┌────────┐ ┌────────┐ ┌────────┐       ┌──────────────┐
        │ App 1  │ │ App 2  │ │ App 3  │ ────> │ Cache (Redis)│
        └───┬────┘ └───┬────┘ └───┬────┘       └──────────────┘
            │ writes   │ reads    │ jobs
            v          v          v
      ┌──────────┐ ┌──────────┐ ┌───────┐    ┌──────────────────┐
      │ Primary  │ │ Read     │ │ Queue │──> │ Worker (e.g.,    │
      │   DB     │ │ Replicas │ └───────┘    │ email/exports)   │
      └──────────┘ └──────────┘              └──────────────────┘

## Component Explanations
-** CDN: Serves static frontend files from edge servers close to the user to reduce latency.
-** Load Balancer: Distributes incoming API traffic evenly across healthy app servers to prevent overload.
-** App Servers: Stateless servers that handle business logic, authentication, and coordinate with the cache and database.
-** Cache (Redis): Stores frequently accessed note lists in memory to serve reads in ~1ms, reducing database load.
-** Primary Database: The single source of truth that handles all write operations to ensure data consistency.
-** Read Replicas: Copies of the primary database that handle the high volume of read requests, keeping the primary free for writes.
-** Message Queue: Holds background jobs (like sending email notifications) so the app server can respond to the user immediately.
-** Worker: A background process that picks up jobs from the queue and executes them asynchronously.

## Request Flows
1. GET /notes: The Load Balancer routes the request to an App Server. The server checks the Redis Cache. On a hit, it returns the data immediately (~1ms). On a miss, it queries a Read Replica (~20ms), saves the result to Redis with a TTL, and returns the data.
2. POST /notes: The Load Balancer routes the request to an App Server. The server validates the data, writes the new note to the Primary Database, invalidates the user's note list in the Redis Cache (to prevent stale data), and returns a 201 Created response.

## Trade-offs & Avoiding Single Points of Failure (SPOF)
-** Trade-off 1: Speed vs. Freshness (Eventual Consistency). Using a Cache and Read Replicas makes reads incredibly fast, but introduces a tiny replication lag. A user might not see their newly created note in a feed for a few milliseconds. For a notes app, this is an acceptable trade-off for massive performance gains.
-** Trade-off 2: Simplicity vs. Scalability. Adding a Message Queue and Workers adds operational complexity (more things to monitor). However, it is necessary to prevent slow background tasks (like generating PDFs) from blocking the App Server and degrading the user experience during traffic spikes.
-** SAvoiding SPOFs: We avoid SPOFs by having multiple App Servers behind a Load Balancer (if one dies, traffic reroutes), Read Replicas (if the primary fails, a replica can be promoted), and deploying the CDN across multiple geographic regions.