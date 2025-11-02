Q: I'm looking for a way of creating objects to reflect the data of an SqlLite database. Maybe using an npm component, maybe by defining the stucture using yaml.

A: Short answer — pick one:
Lightweight: define TypeScript interfaces + a small mapper that converts DB rows to typed objects (no extra deps).
Type-safe ORM (recommended): use Drizzle ORM with your better-sqlite3 driver — generates TS types from schema and gives typed queries.
Full schema-first generator: use Prisma (prisma schema file → migrations + generated TS client).
Schema-in-YAML: possible but requires a generator (you’d write YAML → translate to SQL or Prisma schema with a small script).



Q: I have 7 or 8 data tables, 5-10 attributes per table, and probably at most hundreds of rows per table (a few thousand max). Is Drizzle worth the overhead?
A:For your scale (7-8 tables, hundreds of rows), Drizzle's benefits likely outweigh its minimal overhead. Here's why:
* Type Safety Benefits
    Catch typos in column names at compile time
    Automatic type updates when schema changes
    Proper typing for nullable columns
    IDE autocompletion for table/column names
* Low Overhead
    Drizzle is very lightweight compared to ORMs like Prisma
    Works directly with your existing better-sqlite3 driver
    No runtime overhead for type information (types are compile-time only)
* Migration Path
    Can gradually adopt - start with just schema definitions
    Keep your existing queries initially
    Migrate to typed queries as you update code