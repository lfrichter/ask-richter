import { defineType, defineField } from 'sanity'

export const education = defineType({
  name: 'education',
  title: 'Education & Certifications',
  type: 'document',
  fields: [
    defineField({
      name: 'institution',
      title: 'Institution / Issuing Organization',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'degree',
      title: 'Degree / Certificate Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Postgraduate Degree', value: 'postgraduate' },
          { title: 'Bachelor Degree / Foundation', value: 'bachelor' },
          { title: 'Certification', value: 'certification' },
          { title: 'Course / Specialization', value: 'course' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
    }),
    defineField({
      name: 'endDate',
      title: 'End / Issue Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
    }),
    defineField({
      name: 'credentialId',
      title: 'Credential ID',
      type: 'string',
    }),
    defineField({
      name: 'credentialUrl',
      title: 'Credential Verification URL',
      type: 'url',
    }),
    defineField({
      name: 'description',
      title: 'Description / Academic Summary',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'coursework',
      title: 'Topics & Coursework Covered',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'skills',
      title: 'Associated Skills',
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
      title: 'degree',
      subtitle: 'institution',
    },
  },
})
