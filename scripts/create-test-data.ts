import { prisma } from '@/lib/db'

async function createTestData() {
  console.log('Creating test data...')

  // Create test clients
  const client1 = await prisma.client.create({
    data: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+14155552671',
      company: 'Acme Corp',
      healthStatus: 'GREEN',
      lastInteractionDate: new Date(),
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+14155552672',
      company: 'Tech Solutions Inc',
      healthStatus: 'YELLOW',
      lastInteractionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '+14155552673',
      company: 'Global Industries',
      healthStatus: 'RED',
      lastInteractionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Created test clients:')
  console.log(`  - ${client1.name} (${client1.phone})`)
  console.log(`  - ${client2.name} (${client2.phone})`)
  console.log(`  - ${client3.name} (${client3.phone})`)

  // Create test interactions
  const interaction1 = await prisma.interaction.create({
    data: {
      clientId: client1.id,
      type: 'EMAIL',
      subject: 'Project Update',
      content: 'Great progress on the project! Everything is on track.',
      handledBy: 'Sarah',
      sentiment: 'POSITIVE',
      keyPoints: ['Project on track', 'Good progress'],
    },
  })

  const interaction2 = await prisma.interaction.create({
    data: {
      clientId: client3.id,
      type: 'CALL',
      subject: 'Complaint - Service Issue',
      content: 'Client reported issues with service delivery. Very unhappy.',
      handledBy: 'Mike',
      sentiment: 'NEGATIVE',
      keyPoints: ['Service issue', 'Unhappy client', 'Needs resolution'],
    },
  })

  console.log('✅ Created test interactions')

  // Create test follow-ups
  const followUp1 = await prisma.followUp.create({
    data: {
      clientId: client1.id,
      title: 'Check Project Status',
      description: 'Follow up on project progress',
      scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      method: 'WHATSAPP',
    },
  })

  const followUp2 = await prisma.followUp.create({
    data: {
      clientId: client2.id,
      title: 'Re-engagement Call',
      description: 'Reach out to inactive client',
      scheduledFor: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      method: 'WHATSAPP',
    },
  })

  console.log('✅ Created test follow-ups')

  console.log('\n📊 Test Data Summary:')
  console.log(`  - 3 test clients created`)
  console.log(`  - 2 test interactions created`)
  console.log(`  - 2 test follow-ups created`)
  console.log('\n✨ Test data ready for QA testing!')
  console.log('\nTest Client Details:')
  console.log(`  Client 1: ${client1.name} (${client1.phone}) - GREEN status`)
  console.log(`  Client 2: ${client2.name} (${client2.phone}) - YELLOW status`)
  console.log(`  Client 3: ${client3.name} (${client3.phone}) - RED status`)
}

createTestData()
  .catch((e) => {
    console.error('Error creating test data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
