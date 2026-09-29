import { defineType, defineField } from 'sanity'

export const achievement = defineType({
  name: 'achievement',
  title: 'Achievement & Metric',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Achievement Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'metric',
      title: 'Key Metric / Impact Number',
      type: 'string',
      description: 'e.g. +30% User Retention, 10x Page Load Speed, 40% Response Time Reduction, 200k+ Records',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Performance Optimization', value: 'performance' },
          { title: 'Product & Business Growth', value: 'growth' },
          { title: 'Security & Reliability', value: 'security_reliability' },
          { title: 'DevOps & CI/CD Pipeline', value: 'devops_ci_cd' },
          { title: 'AI & Automation Innovation', value: 'ai_automation' },
        ],
      },
    }),
    defineField({
      name: 'context',
      title: 'Context & Impact Details',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'experience',
      title: 'Associated Experience',
      type: 'reference',
      to: [{ type: 'experience' }],
      description: 'Reference to company/experience where impact was achieved (if applicable)',
    }),
    defineField({
      name: 'project',
      title: 'Associated Project',
      type: 'reference',
      to: [{ type: 'project' }],
      description: 'Reference to software project where impact was achieved (if applicable)',
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
      title: 'title',
      subtitle: 'metric',
    },
  },
})
