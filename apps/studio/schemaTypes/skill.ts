import { defineType, defineField } from 'sanity'

export const skill = defineType({
  name: 'skill',
  title: 'Skill & Technology',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
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
          { title: 'Languages & Frameworks', value: 'languages_frameworks' },
          { title: 'Databases & Storage', value: 'databases_storage' },
          { title: 'DevOps & Cloud', value: 'devops_cloud' },
          { title: 'AI & Data Engineering', value: 'ai_data_engineering' },
          { title: 'Architecture & Leadership', value: 'architecture_leadership' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Proficiency / Experience Level',
      type: 'string',
      description: 'Optional self-assessment or experience scope (e.g. Expert, Advanced, Intermediate)',
    }),
    defineField({
      name: 'description',
      title: 'Description / Context',
      type: 'text',
      rows: 3,
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
