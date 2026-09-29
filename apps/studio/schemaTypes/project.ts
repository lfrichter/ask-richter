import { defineType, defineField } from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Software Project',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Project Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Production SaaS / Enterprise', value: 'production_saas' },
          { title: 'AI Engineering & PoC / Challenge', value: 'ai_engineering_poc' },
          { title: 'Integration Hub / Backend System', value: 'integration_hub' },
          { title: 'Mobile / Web App', value: 'web_mobile_app' },
          { title: 'Open Source / Tooling', value: 'open_source' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'experience',
      title: 'Associated Professional Experience',
      type: 'reference',
      to: [{ type: 'experience' }],
      description: 'Reference to company/experience if project was developed during a role',
    }),
    defineField({
      name: 'status',
      title: 'Project Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active / Maintained', value: 'active' },
          { title: 'Completed', value: 'completed' },
          { title: 'Archived', value: 'archived' },
        ],
      },
    }),
    defineField({
      name: 'summary',
      title: 'Short Summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'description',
      title: 'Detailed Description',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'architecture',
      title: 'Architecture & Technical Decisions',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'challenges',
      title: 'Engineering Challenges & Solutions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'challenge',
              title: 'Challenge',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'solution',
              title: 'Solution',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'result',
              title: 'Result / Outcome',
              type: 'text',
              rows: 2,
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies & Skills',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'skill' }],
        },
      ],
    }),
    defineField({
      name: 'repositoryUrl',
      title: 'Repository URL',
      type: 'url',
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live URL',
      type: 'url',
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
      title: 'name',
      subtitle: 'category',
    },
  },
})
