import { defineType, defineField } from 'sanity'

export const experience = defineType({
  name: 'experience',
  title: 'Professional Experience',
  type: 'document',
  fields: [
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Job Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. São Paulo, Brazil / Honolulu, Hawaii, USA / Remote',
    }),
    defineField({
      name: 'employmentType',
      title: 'Employment Type',
      type: 'string',
      options: {
        list: [
          { title: 'Full-time', value: 'full_time' },
          { title: 'Contract', value: 'contract' },
          { title: 'Part-time', value: 'part_time' },
          { title: 'Freelance', value: 'freelance' },
        ],
      },
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
      description: 'Leave empty if this is current role',
    }),
    defineField({
      name: 'isCurrent',
      title: 'Is Current Role?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'summary',
      title: 'Executive Summary',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'storytelling',
      title: 'Impact Storytelling (STAR Method)',
      type: 'object',
      fields: [
        defineField({
          name: 'situation',
          title: 'Situation (Problem & Context)',
          type: 'text',
          rows: 4,
        }),
        defineField({
          name: 'action',
          title: 'Action (Strategy & Execution)',
          type: 'text',
          rows: 5,
        }),
        defineField({
          name: 'result',
          title: 'Result (Measurable Impact)',
          type: 'text',
          rows: 4,
        }),
      ],
    }),
    defineField({
      name: 'responsibilities',
      title: 'Key Responsibilities & Highlights',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'rolesPerformed',
      title: 'Roles / Hats Performed',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'e.g. Solution Architect, DevOps Engineer, Senior Backend Developer',
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies / Skills',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'skill' }],
        },
      ],
      description: 'Direct references to skills used during this experience',
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
      title: 'company',
      subtitle: 'role',
    },
  },
})
