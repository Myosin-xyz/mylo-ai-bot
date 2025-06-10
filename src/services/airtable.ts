import Airtable from "airtable"
import { z } from "zod"
import {
  AirtableRecordSchema,
  AirtableTableResponseSchema,
  AirtableQueryOptionsSchema,
  AirtableTableMetadataSchema,
  AirtableFieldMetadataSchema
} from "../types/airtable"

// Infer TypeScript types from Zod schemas
export type AirtableRecord = z.infer<typeof AirtableRecordSchema>
export type AirtableTableResponse = z.infer<typeof AirtableTableResponseSchema>
export type AirtableQueryOptions = z.infer<typeof AirtableQueryOptionsSchema>
export type AirtableTableMetadata = z.infer<typeof AirtableTableMetadataSchema>
export type AirtableFieldMetadata = z.infer<typeof AirtableFieldMetadataSchema>

/**
 * Service class for interacting with the Airtable API
 */
export class AirtableService {
  private base: Airtable.Base

  constructor(baseId?: string) {
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error("AIRTABLE_API_KEY environment variable is required")
    }

    if (!baseId && !process.env.AIRTABLE_BASE_ID) {
      throw new Error(
        "Either baseId parameter or AIRTABLE_BASE_ID environment variable is required"
      )
    }

    // Configure Airtable
    Airtable.configure({
      endpointUrl: "https://api.airtable.com",
      apiKey: process.env.AIRTABLE_API_KEY
    })

    this.base = Airtable.base(baseId || process.env.AIRTABLE_BASE_ID!)
  }

  /**
   * Get all records from a specific table
   * @param tableName - The name or ID of the Airtable table
   * @param options - Query options for filtering, sorting, etc.
   * @returns Array of records from the table
   */
  async getTableRecords(
    tableName: string,
    options?: AirtableQueryOptions
  ): Promise<{
    records: AirtableRecord[]
    error: string | null
  }> {
    try {
      if (!tableName.trim()) {
        return { records: [], error: "Table name cannot be empty" }
      }

      const validatedOptions = options
        ? AirtableQueryOptionsSchema.parse(options)
        : {}
      const records: AirtableRecord[] = []

      // Use Airtable's select method with pagination
      await this.base(tableName)
        .select({
          ...validatedOptions
        })
        .eachPage((pageRecords, fetchNextPage) => {
          pageRecords.forEach(record => {
            try {
              const validatedRecord = AirtableRecordSchema.parse({
                id: record.id,
                createdTime: record._rawJson.createdTime,
                fields: record.fields
              })
              records.push(validatedRecord)
            } catch (validationError) {
              console.warn(
                "Failed to validate record:",
                record.id,
                validationError
              )
            }
          })
          fetchNextPage()
        })

      return { records, error: null }
    } catch (error) {
      console.error("Failed to get table records:", error)
      return {
        records: [],
        error: `Failed to get records from table: ${tableName}`
      }
    }
  }

  /**
   * Get a single record by ID
   * @param tableName - The name or ID of the Airtable table
   * @param recordId - The ID of the record to retrieve
   * @returns The record data
   */
  async getRecord(
    tableName: string,
    recordId: string
  ): Promise<{
    record: AirtableRecord | null
    error: string | null
  }> {
    try {
      if (!tableName.trim() || !recordId.trim()) {
        return {
          record: null,
          error: "Table name and record ID cannot be empty"
        }
      }

      const record = await this.base(tableName).find(recordId)

      const validatedRecord = AirtableRecordSchema.parse({
        id: record.id,
        createdTime: record._rawJson.createdTime,
        fields: record.fields
      })

      return { record: validatedRecord, error: null }
    } catch (error) {
      console.error("Failed to get record:", error)
      return {
        record: null,
        error: `Failed to get record ${recordId} from table ${tableName}`
      }
    }
  }

  /**
   * Search records using a filter formula
   * @param tableName - The name or ID of the Airtable table
   * @param filterFormula - Airtable filter formula (e.g., "AND({Name} = 'John', {Age} > 25)")
   * @param options - Additional query options
   * @returns Array of matching records
   */
  async searchRecords(
    tableName: string,
    filterFormula: string,
    options?: Omit<AirtableQueryOptions, "filterByFormula">
  ): Promise<{
    records: AirtableRecord[]
    error: string | null
  }> {
    try {
      if (!tableName.trim() || !filterFormula.trim()) {
        return {
          records: [],
          error: "Table name and filter formula cannot be empty"
        }
      }

      const searchOptions: AirtableQueryOptions = {
        ...options,
        filterByFormula: filterFormula
      }

      return await this.getTableRecords(tableName, searchOptions)
    } catch (error) {
      console.error("Failed to search records:", error)
      return { records: [], error: "Failed to search records" }
    }
  }

  /**
   * Get records from a specific view
   * @param tableName - The name or ID of the Airtable table
   * @param viewName - The name or ID of the view
   * @param options - Additional query options
   * @returns Array of records from the view
   */
  async getViewRecords(
    tableName: string,
    viewName: string,
    options?: Omit<AirtableQueryOptions, "view">
  ): Promise<{
    records: AirtableRecord[]
    error: string | null
  }> {
    try {
      if (!tableName.trim() || !viewName.trim()) {
        return {
          records: [],
          error: "Table name and view name cannot be empty"
        }
      }

      const viewOptions: AirtableQueryOptions = {
        ...options,
        view: viewName
      }

      return await this.getTableRecords(tableName, viewOptions)
    } catch (error) {
      console.error("Failed to get view records:", error)
      return {
        records: [],
        error: `Failed to get records from view ${viewName}`
      }
    }
  }

  /**
   * Get specific fields from all records
   * @param tableName - The name or ID of the Airtable table
   * @param fields - Array of field names to retrieve
   * @param options - Additional query options
   * @returns Array of records with only specified fields
   */
  async getFieldsFromTable(
    tableName: string,
    fields: string[],
    options?: Omit<AirtableQueryOptions, "fields">
  ): Promise<{
    records: AirtableRecord[]
    error: string | null
  }> {
    try {
      if (!tableName.trim() || !fields.length) {
        return {
          records: [],
          error: "Table name and fields array cannot be empty"
        }
      }

      const fieldOptions: AirtableQueryOptions = {
        ...options,
        fields
      }

      return await this.getTableRecords(tableName, fieldOptions)
    } catch (error) {
      console.error("Failed to get specific fields:", error)
      return { records: [], error: "Failed to get specific fields from table" }
    }
  }

  /**
   * Get a formatted summary of records from a table
   * @param tableName - The name or ID of the Airtable table
   * @param maxRecords - Maximum number of records to include in summary
   * @returns Formatted summary string
   */
  async getTableSummary(
    tableName: string,
    maxRecords: number = 10
  ): Promise<{
    summary: string
    error: string | null
  }> {
    try {
      if (!tableName.trim()) {
        return { summary: "", error: "Table name cannot be empty" }
      }

      const { records, error } = await this.getTableRecords(tableName, {
        maxRecords
      })

      if (error) {
        return { summary: "", error }
      }

      if (records.length === 0) {
        return {
          summary: `Table "${tableName}" is empty or not found.`,
          error: null
        }
      }

      let summary = `**Table: ${tableName}**\n`
      summary += `Records found: ${records.length}\n\n`

      // Get field names from first record
      const fieldNames = Object.keys(records[0].fields)
      summary += `Fields: ${fieldNames.join(", ")}\n\n`

      // Show first few records
      records.slice(0, Math.min(3, records.length)).forEach((record, index) => {
        summary += `**Record ${index + 1}:**\n`
        Object.entries(record.fields).forEach(([key, value]) => {
          const displayValue = Array.isArray(value)
            ? value.length > 0
              ? `[${value.length} items]`
              : "[]"
            : typeof value === "object" && value !== null
            ? "[Object]"
            : String(value)
          summary += `  ${key}: ${displayValue}\n`
        })
        summary += "\n"
      })

      if (records.length > 3) {
        summary += `... and ${records.length - 3} more records.\n`
      }

      return { summary: summary.trim(), error: null }
    } catch (error) {
      console.error("Failed to get table summary:", error)
      return { summary: "", error: "Failed to get table summary" }
    }
  }
}
