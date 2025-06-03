import z from "zod"

// Zod schemas for Notion API responses
export const NotionRichTextSchema = z.object({
  type: z.string(),
  text: z
    .object({
      content: z.string()
    })
    .optional(),
  plain_text: z.string()
})

export const NotionPropertySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.array(NotionRichTextSchema).optional(),
  rich_text: z.array(NotionRichTextSchema).optional()
})

export const NotionPageSchema = z.object({
  id: z.string(),
  properties: z.record(z.string(), NotionPropertySchema),
  url: z.string(),
  created_time: z.string(),
  last_edited_time: z.string()
})

export const NotionBlockContentSchema = z.object({
  rich_text: z.array(NotionRichTextSchema)
})

export const NotionBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  paragraph: NotionBlockContentSchema.optional(),
  heading_1: NotionBlockContentSchema.optional(),
  heading_2: NotionBlockContentSchema.optional(),
  heading_3: NotionBlockContentSchema.optional(),
  bulleted_list_item: NotionBlockContentSchema.optional(),
  numbered_list_item: NotionBlockContentSchema.optional()
})

export const NotionDatabaseQuerySchema = z.object({
  results: z.array(NotionPageSchema),
  next_cursor: z.string().nullable(),
  has_more: z.boolean()
})
