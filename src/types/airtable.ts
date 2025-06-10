import { z } from "zod"

// Zod schemas for Airtable API responses

/**
 * Schema for Airtable field values
 * Airtable fields can be various types: string, number, boolean, array, etc.
 */
export const AirtableFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional()
    })
  ),
  z.object({
    url: z.string(),
    filename: z.string().optional()
  }),
  z.array(
    z.object({
      url: z.string(),
      filename: z.string().optional()
    })
  ),
  z.null()
])

/**
 * Schema for Airtable record fields
 */
export const AirtableFieldsSchema = z.record(
  z.string(),
  AirtableFieldValueSchema
)

/**
 * Schema for a single Airtable record
 */
export const AirtableRecordSchema = z
  .object({
    id: z.string(),
    createdTime: z.string(),
    fields: AirtableFieldsSchema
  })
  .strict()

/**
 * Schema for Airtable table response
 */
export const AirtableTableResponseSchema = z
  .object({
    records: z.array(AirtableRecordSchema),
    offset: z.string().optional()
  })
  .strict()

/**
 * Schema for Airtable base metadata
 */
export const AirtableBaseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    permissionLevel: z.string()
  })
  .strict()

/**
 * Schema for Airtable table metadata
 */
export const AirtableTableMetadataSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    primaryFieldId: z.string()
  })
  .strict()

/**
 * Schema for Airtable field metadata
 */
export const AirtableFieldMetadataSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().optional()
  })
  .strict()

/**
 * Schema for query options
 */
export const AirtableQueryOptionsSchema = z
  .object({
    fields: z.array(z.string()).optional(),
    filterByFormula: z.string().optional(),
    maxRecords: z.number().optional(),
    pageSize: z.number().optional(),
    sort: z
      .array(
        z.object({
          field: z.string(),
          direction: z.enum(["asc", "desc"]).optional()
        })
      )
      .optional(),
    view: z.string().optional(),
    cellFormat: z.enum(["json", "string"]).optional(),
    timeZone: z.string().optional(),
    userLocale: z.string().optional()
  })
  .strict()
