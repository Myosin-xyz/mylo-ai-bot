# Airtable Integration

This document explains how to use the Airtable integration in the Mylo AI Bot to read data from different Airtable tables.

## Setup

### 1. Get Your Airtable API Key

1. Go to [https://airtable.com/account](https://airtable.com/account)
2. In the API section, click "Generate API key"
3. Copy your API key

### 2. Get Your Base ID

1. Go to your Airtable base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The Base ID is the part starting with `app` (e.g., `appXXXXXXXXXXXXXX`)

### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
```

## Usage

### Telegram Bot Commands

Once configured, you can use these commands in your Telegram bot:

#### `/table <table_name>`

Get a summary of an Airtable table with field names and sample records.

**Example:**

```
/table Contacts
```

#### `/filter <table_name> <filter_formula>`

Search records using Airtable filter formulas.

**Examples:**

```
/filter Contacts {Name} = 'John Doe'
/filter Projects AND({Status} = 'Active', {Priority} = 'High')
/filter Tasks NOT({Completed} = TRUE())
```

#### Natural Language Earnings Queries

Ask Mylo about your earnings using natural language:

**Examples:**

```
Hey Mylo, how much have I earned?
Hey Mylo, what have I made in May?
Hey Mylo, my earnings for June
```

**How it works:**

- Checks the Treasury table in your Airtable base
- Finds records where the Telegram column matches your username
- Sums Payout values separately for USDC and tokens (based on Currency column)
- Filters by month if specified (looks for month name in "Paid out" column)
- Returns a formatted earnings summary

**Required Treasury Table Structure:**

- `Telegram`: Column containing Telegram usernames
- `Payout`: Column with numerical payout amounts
- `Currency`: Column indicating "USDC" or "TOKEN"/"TOKENS"
- `Paid out`: Column containing dates (e.g., "May 25", "June 25")

## Programmatic Usage

### Basic Usage

```typescript
import { AirtableService } from "./services/airtable"

// Initialize service
const airtable = new AirtableService()

// Get all records from a table
const { records, error } = await airtable.getTableRecords("Contacts")

if (error) {
  console.error("Error:", error)
} else {
  console.log(`Found ${records.length} records`)
  records.forEach(record => {
    console.log("Record ID:", record.id)
    console.log("Fields:", record.fields)
  })
}
```

### Advanced Queries

```typescript
// Search with filter
const { records } = await airtable.searchRecords(
  "Contacts",
  "AND({Status} = 'Active', {City} = 'New York')",
  { maxRecords: 50 }
)

// Get specific fields only
const { records } = await airtable.getFieldsFromTable(
  "Contacts",
  ["Name", "Email", "Phone"],
  { maxRecords: 100 }
)

// Get records from a view
const { records } = await airtable.getViewRecords(
  "Projects",
  "Active Projects",
  { sort: [{ field: "Due Date", direction: "asc" }] }
)

// Get a single record
const { record } = await airtable.getRecord("Contacts", "rec1234567890")
```

## API Reference

### AirtableService Methods

#### `getTableRecords(tableName, options?)`

Get all records from a table with optional query parameters.

**Parameters:**

- `tableName` (string): Name or ID of the table
- `options` (AirtableQueryOptions, optional): Query options

**Returns:** `{ records: AirtableRecord[], error: string | null }`

#### `getRecord(tableName, recordId)`

Get a single record by ID.

**Parameters:**

- `tableName` (string): Name or ID of the table
- `recordId` (string): ID of the record

**Returns:** `{ record: AirtableRecord | null, error: string | null }`

#### `searchRecords(tableName, filterFormula, options?)`

Search records using an Airtable filter formula.

**Parameters:**

- `tableName` (string): Name or ID of the table
- `filterFormula` (string): Airtable filter formula
- `options` (AirtableQueryOptions, optional): Additional query options

**Returns:** `{ records: AirtableRecord[], error: string | null }`

#### `getViewRecords(tableName, viewName, options?)`

Get records from a specific view.

**Parameters:**

- `tableName` (string): Name or ID of the table
- `viewName` (string): Name or ID of the view
- `options` (AirtableQueryOptions, optional): Additional query options

**Returns:** `{ records: AirtableRecord[], error: string | null }`

#### `getFieldsFromTable(tableName, fields, options?)`

Get specific fields from all records.

**Parameters:**

- `tableName` (string): Name or ID of the table
- `fields` (string[]): Array of field names to retrieve
- `options` (AirtableQueryOptions, optional): Additional query options

**Returns:** `{ records: AirtableRecord[], error: string | null }`

#### `getTableSummary(tableName, maxRecords?)`

Get a formatted summary of a table.

**Parameters:**

- `tableName` (string): Name or ID of the table
- `maxRecords` (number, optional): Maximum records to include (default: 10)

**Returns:** `{ summary: string, error: string | null }`

### Query Options

The `AirtableQueryOptions` interface supports:

```typescript
{
  fields?: string[]              // Specific fields to return
  filterByFormula?: string       // Filter formula
  maxRecords?: number           // Maximum number of records
  pageSize?: number             // Number of records per page
  sort?: Array<{                // Sort options
    field: string
    direction?: 'asc' | 'desc'
  }>
  view?: string                 // View name or ID
  cellFormat?: 'json' | 'string' // Cell format
  timeZone?: string             // Time zone
  userLocale?: string           // User locale
}
```

## Filter Formula Examples

Airtable uses its own formula syntax for filtering. Here are common examples:

### Basic Comparisons

```javascript
{Name} = 'John Doe'
{Age} > 25
{Status} != 'Inactive'
{Email} != BLANK()
```

### Logical Operators

```javascript
AND(({ Status } = "Active"), ({ City } = "New York"))
OR(({ Priority } = "High"), ({ Priority } = "Critical"))
NOT(({ Completed } = TRUE()))
```

### Text Functions

```javascript
SEARCH('gmail', {Email}) > 0
LEN({Description}) > 100
LEFT({Name}, 1) = 'A'
```

### Date Functions

```javascript
{Created} > '2023-01-01'
DATETIME_DIFF(TODAY(), {Due Date}, 'days') < 7
IS_AFTER({Start Date}, TODAY())
```

### Array Functions

```javascript
{Tags} != BLANK()
ARRAYJOIN({Categories}, ', ')
```

## Testing

Run the Airtable integration tests:

```bash
npm run test:airtable    # Test basic Airtable functionality
npm run test:earnings    # Test earnings calculation specifically
```

This will test all major functionality including:

- Service initialization
- Table summary retrieval
- Search with filters
- Earnings calculation (USDC vs tokens)
- Monthly earnings filtering
- User handle matching

## Error Handling

All methods return an object with both `records`/`record`/`summary` and `error` fields. Always check for errors:

```typescript
const { records, error } = await airtable.getTableRecords("MyTable")

if (error) {
  console.error("Airtable error:", error)
  // Handle error appropriately
  return
}

// Use records safely
console.log(`Got ${records.length} records`)
```

## Security Notes

- Never commit your API key to version control
- Use environment variables for all sensitive configuration
- Consider using Airtable's permission system to limit API access
- Be mindful of rate limits (5 requests per second per base)

## Troubleshooting

### Common Issues

1. **"AIRTABLE_API_KEY environment variable is required"**

   - Make sure you've added your API key to the `.env` file

2. **"Either baseId parameter or AIRTABLE_BASE_ID environment variable is required"**

   - Add your base ID to the `.env` file

3. **"Failed to get records from table"**

   - Check that the table name is correct
   - Verify the table exists in your base
   - Ensure your API key has access to the base

4. **Filter formula errors**

   - Verify your formula syntax matches Airtable's documentation
   - Use proper field name syntax with curly braces: `{Field Name}`
   - Check for typos in field names

5. **View not found**
   - Ensure the view name is spelled correctly
   - Views are case-sensitive
   - Use quotes for view names with spaces

### Debug Mode

To enable detailed logging, add this to your code:

```typescript
// Enable debug logging
process.env.AIRTABLE_DEBUG = "true"
```
