import { defineType, defineField } from 'sanity'

export const architectureDecision = defineType({
  name: 'architectureDecision',
  title: 'Architecture Decision Record (ADR)',
  type: 'document',
  fields: [
    defineField({
      name: 'adrNumber',
      title: 'ADR Number',
      type: 'number',
      description: 'Sequential identifier (e.g. 1, 2, ..., 9, 10)',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Accepted', value: 'accepted' },
          { title: 'Proposed', value: 'proposed' },
          { title: 'Superseded', value: 'superseded' },
          { title: 'Deprecated', value: 'deprecated' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Decision Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM-DD' },
    }),
    defineField({
      name: 'context',
      title: 'Context & Problem Statement',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'decision',
      title: 'Decision Made',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rationale',
      title: 'Rationale / Why this decision was chosen',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'consequences',
      title: 'Consequences (Positive & Negative Trade-offs)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'technologies',
      title: 'Related Technologies',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'skill' }],
        },
      ],
    }),
    defineField({
      name: 'legacySourceId',
      title: 'Legacy Source ID',
      type: 'string',
      readOnly: true,
      description: 'Provenance ID from original knowledge base / docstore',
    }),
    defineField({
      name: 'legacyFile',
      title: 'Legacy Source File',
      type: 'string',
      readOnly: true,
      description: 'Source markdown file path for traceability',
    }),
  ],
  preview: {
    select: {
      adrNumber: 'adrNumber',
      title: 'title',
      status: 'status',
    },
    prepare({ adrNumber, title, status }) {
      return {
        title: `ADR-${String(adrNumber).padStart(4, '0')}: ${title}`,
        subtitle: `Status: ${status}`,
      }
    },
  },
})
