import { getCliClient } from 'sanity/cli'
import { runIngestion } from './pilot-ingest'

async function verify() {
  const client = getCliClient({ apiVersion: '2024-01-01' })

  console.log('\n#####################################################')
  console.log('### STEP 1: EXECUTE RUN #1 (Initial Ingestion)   ###')
  console.log('#####################################################')
  const run1 = await runIngestion('Run #1')

  console.log('\n#####################################################')
  console.log('### STEP 2: EXECUTE RUN #2 (Idempotency Re-run)  ###')
  console.log('#####################################################')
  const run2 = await runIngestion('Run #2')

  console.log('\n#####################################################')
  console.log('### STEP 3: GROQ REFERENCE RESOLUTION VALIDATION  ###')
  console.log('#####################################################')

  // Query 1: Projects with expanded technologies and experience
  const projectQuery = await client.fetch(`*[_type == "project"] | order(name asc) {
    _id,
    name,
    category,
    status,
    "experienceCompany": experience->company,
    "technologies": technologies[]->name
  }`)
  console.log('\n[GROQ 1: Projects & Joined References]:\n', JSON.stringify(projectQuery, null, 2))

  // Query 2: Experiences with expanded technologies
  const expQuery = await client.fetch(`*[_type == "experience"] | order(startDate desc) {
    _id,
    company,
    role,
    startDate,
    "technologies": technologies[]->name
  }`)
  console.log('\n[GROQ 2: Experiences & Joined Technologies]:\n', JSON.stringify(expQuery, null, 2))

  // Query 3: Achievements with joined experience
  const achQuery = await client.fetch(`*[_type == "achievement"] | order(title asc) {
    _id,
    title,
    metric,
    "company": experience->company
  }`)
  console.log('\n[GROQ 3: Achievements & Joined Experience]:\n', JSON.stringify(achQuery, null, 2))

  // Query 4: Architecture Decisions (ADRs) with joined technologies
  const adrQuery = await client.fetch(`*[_type == "architectureDecision"] | order(adrNumber asc) {
    _id,
    adrNumber,
    title,
    status,
    "technologies": technologies[]->name
  }`)
  console.log('\n[GROQ 4: Architecture Decisions & Joined Technologies]:\n', JSON.stringify(adrQuery, null, 2))

  console.log('\n#####################################################')
  console.log('### STEP 4: IDEMPOTENCY AUDIT SUMMARY            ###')
  console.log('#####################################################')
  console.log(`Count BEFORE Run #1: ${run1.countBefore}`)
  console.log(`Count AFTER Run #1:  ${run1.countAfter}`)
  console.log(`Count AFTER Run #2:  ${run2.countAfter}`)

  const isIdempotent = run1.countAfter === 20 && run2.countAfter === 20
  console.log(`Idempotency Verified: ${isIdempotent ? '✅ SUCCESS (20 -> 20, 0 duplicates)' : '❌ FAILURE'}`)

  if (!isIdempotent) {
    throw new Error(`Idempotency check failed: expected 20 documents after both runs, got ${run2.countAfter}`)
  }
}

verify().catch((err) => {
  console.error('Fatal error during verification:', err)
  process.exit(1)
})
