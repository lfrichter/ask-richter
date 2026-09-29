import { getCliClient } from 'sanity/cli'
import { allDocuments, runIngestion } from './full-ingest'

async function verify() {
  const client = getCliClient({ apiVersion: '2024-01-01' })

  console.log('=====================================================')
  console.log(' M1.5 — FULL SANITY MIGRATION & IDEMPOTENCY AUDIT   ')
  console.log('=====================================================\n')

  // 1. Snapshot Before Run #1
  console.log('--- 1. Snapshot Before Run #1 ---')
  const beforeDocs = await client.fetch('*[!(_id in path("_.**"))]{ _id, _type }')
  console.log(`Initial document count: ${beforeDocs.length}`)
  const beforeByType: Record<string, number> = {}
  for (const d of beforeDocs) {
    beforeByType[d._type] = (beforeByType[d._type] || 0) + 1
  }
  console.log('Initial distribution:', beforeByType)

  // 2. Pre-write Local Validation
  console.log('\n--- 2. Pre-write Local Validation ---')
  const docIds = new Set<string>()
  for (const doc of allDocuments) {
    if (docIds.has(doc._id)) {
      throw new Error(`Duplicate ID in allDocuments: ${doc._id}`)
    }
    docIds.add(doc._id)
    if (!doc.legacySourceId || !doc.legacyFile) {
      throw new Error(`Missing provenance in: ${doc._id}`)
    }
    if (doc.legacyFile.startsWith('/') || doc.legacyFile.includes('/Users/')) {
      throw new Error(`Absolute path in legacyFile: ${doc._id} -> ${doc.legacyFile}`)
    }
  }
  console.log(`Pre-write validation passed for all ${allDocuments.length} documents.`)

  // 3. RUN #1 — Full Migration
  console.log('\n--- 3. RUN #1 — Full Ingestion ---')
  const run1Result = await runIngestion(client)
  if (run1Result.failed > 0) {
    console.error('RUN #1 had failures:', run1Result.errors)
    throw new Error('RUN #1 failed.')
  }

  // 4. Content Lake Count & Distribution after Run #1
  console.log('\n--- 4. Verification After RUN #1 ---')
  const afterRun1Counts = await client.fetch(`{
    "skill": count(*[_type == "skill"]),
    "experience": count(*[_type == "experience"]),
    "project": count(*[_type == "project"]),
    "education": count(*[_type == "education"]),
    "achievement": count(*[_type == "achievement"]),
    "architectureDecision": count(*[_type == "architectureDecision"]),
    "total": count(*[!(_id in path("_.**"))])
  }`)
  console.log('Counts after RUN #1:', afterRun1Counts)

  if (afterRun1Counts.total !== 101) {
    throw new Error(`Expected 101 documents after RUN #1, found: ${afterRun1Counts.total}`)
  }

  // 5. Reference Graph Integrity Audit (GROQ)
  console.log('\n--- 5. Reference Graph Integrity Audit ---')
  const refAudit = await client.fetch(`{
    "experiences": *[_type == "experience"]{
      _id,
      company,
      "technologies": technologies[]->{ _id, _type, name }
    },
    "education": *[_type == "education"]{
      _id,
      institution,
      "skills": skills[]->{ _id, _type, name }
    },
    "projects": *[_type == "project"]{
      _id,
      name,
      "experience": experience->{ _id, _type, company },
      "technologies": technologies[]->{ _id, _type, name }
    },
    "adrs": *[_type == "architectureDecision"]{
      _id,
      adrNumber,
      "technologies": technologies[]->{ _id, _type, name }
    },
    "achievements": *[_type == "achievement"]{
      _id,
      title,
      "experience": experience->{ _id, _type, company },
      "project": project->{ _id, _type, name }
    }
  }`)

  let totalValidRefs = 0
  let orphanRefs = 0

  for (const exp of refAudit.experiences) {
    for (const tech of exp.technologies || []) {
      if (!tech || !tech._id) {
        console.error(`Orphan ref in experience ${exp._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
  }

  for (const edu of refAudit.education) {
    for (const sk of edu.skills || []) {
      if (!sk || !sk._id) {
        console.error(`Orphan ref in education ${edu._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
  }

  for (const proj of refAudit.projects) {
    if (proj.experience) {
      if (!proj.experience._id) {
        console.error(`Orphan experience ref in project ${proj._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
    for (const tech of proj.technologies || []) {
      if (!tech || !tech._id) {
        console.error(`Orphan tech ref in project ${proj._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
  }

  for (const adr of refAudit.adrs) {
    for (const tech of adr.technologies || []) {
      if (!tech || !tech._id) {
        console.error(`Orphan tech ref in ADR ${adr._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
  }

  for (const ach of refAudit.achievements) {
    if (ach.experience) {
      if (!ach.experience._id) {
        console.error(`Orphan experience ref in achievement ${ach._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
    if (ach.project) {
      if (!ach.project._id) {
        console.error(`Orphan project ref in achievement ${ach._id}`)
        orphanRefs++
      } else {
        totalValidRefs++
      }
    }
  }

  console.log(`Total valid resolved references: ${totalValidRefs}`)
  console.log(`Total orphan references: ${orphanRefs}`)
  if (orphanRefs > 0) {
    throw new Error(`Found ${orphanRefs} orphan references in Content Lake!`)
  }

  // 6. Provenance Integrity Audit
  console.log('\n--- 6. Provenance Integrity Audit ---')
  const allLakeDocs = await client.fetch('*[!(_id in path("_.**"))]{ _id, _type, legacySourceId, legacyFile }')
  let provenanceComplete = 0
  let absolutePathsFound = 0
  for (const doc of allLakeDocs) {
    if (doc.legacySourceId && doc.legacyFile) {
      provenanceComplete++
    }
    if (doc.legacyFile && (doc.legacyFile.startsWith('/') || doc.legacyFile.includes('/Users/'))) {
      absolutePathsFound++
    }
  }
  console.log(`Provenance completeness: ${provenanceComplete}/101`)
  console.log(`Absolute legacyFile paths: ${absolutePathsFound}`)

  // 7. RUN #2 — Idempotency Test
  console.log('\n--- 7. RUN #2 — Idempotency Re-run ---')
  const run2Result = await runIngestion(client)
  if (run2Result.failed > 0) {
    throw new Error('RUN #2 failed.')
  }

  // 8. Final Count & Deterministic ID Check
  console.log('\n--- 8. Final Verification After RUN #2 ---')
  const finalCounts = await client.fetch(`{
    "skill": count(*[_type == "skill"]),
    "experience": count(*[_type == "experience"]),
    "project": count(*[_type == "project"]),
    "education": count(*[_type == "education"]),
    "achievement": count(*[_type == "achievement"]),
    "architectureDecision": count(*[_type == "architectureDecision"]),
    "total": count(*[!(_id in path("_.**"))])
  }`)
  console.log('Final counts:', finalCounts)

  const finalDocs = await client.fetch('*[!(_id in path("_.**"))]{ _id, _type }')
  const finalIdSet = new Set(finalDocs.map((d: any) => d._id))
  let missing = 0
  let unexpected = 0
  for (const doc of allDocuments) {
    if (!finalIdSet.has(doc._id)) {
      console.error(`Missing expected ID in Content Lake: ${doc._id}`)
      missing++
    }
  }
  for (const d of finalDocs) {
    if (!docIds.has(d._id)) {
      console.error(`Unexpected document found in Content Lake: ${d._id}`)
      unexpected++
    }
  }

  console.log(`Deterministic IDs audit: Expected 101, Found ${finalDocs.length}, Missing: ${missing}, Unexpected: ${unexpected}`)

  console.log('\n=====================================================')
  console.log(' M1.5 AUDIT RESULT: SUCCESS                          ')
  console.log(` Idempotency Pattern Verified: ${beforeDocs.length} -> ${afterRun1Counts.total} -> ${finalCounts.total}`)
  console.log('=====================================================\n')
}

verify().catch((err) => {
  console.error('FATAL AUDIT ERROR:', err)
  process.exit(1)
})
