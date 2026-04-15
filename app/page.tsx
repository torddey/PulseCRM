/**
 * Main CRM Dashboard Page
 * 
 * This is the heart of the Proactive AI Relationship Manager
 * Features:
 * 1. Client Health Dashboard (Green/Yellow/Red status)
 * 2. Smart Follow-Up Engine with automated reminders
 * 3. Complaint Tracker with zero chaos
 * 4. AI Assistant with smart suggestions
 * 5. Interaction Memory - complete communication history
 */

'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, MessageSquare, Zap } from 'lucide-react'
import { WhatsAppSender } from '@/components/whatsapp-sender'
import { CLIENT_SERVICE_OPTIONS, normalizeClientServices } from '@/lib/client-services'

const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [followUps, setFollowUps] = useState<any[]>([])
  const [complaints, setComplaints] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState('PENDING')
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('OPEN')
  const [interactionTypeFilter, setInteractionTypeFilter] = useState('ALL')
  const [followUpSortOrder, setFollowUpSortOrder] = useState('ASC')
  const [complaintSortOrder, setComplaintSortOrder] = useState('DESC')
  const [interactionSortOrder, setInteractionSortOrder] = useState('DESC')
  const [insightStatusFilter, setInsightStatusFilter] = useState('PENDING')
  const [followUpsVisibleCount, setFollowUpsVisibleCount] = useState(10)
  const [complaintsVisibleCount, setComplaintsVisibleCount] = useState(10)
  const [interactionsVisibleCount, setInteractionsVisibleCount] = useState(10)
  const [insightsVisibleCount, setInsightsVisibleCount] = useState(10)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [isComplaintOpen, setIsComplaintOpen] = useState(false)
  const [isInteractionOpen, setIsInteractionOpen] = useState(false)
  const [isSubmittingClient, setIsSubmittingClient] = useState(false)
  const [addClientError, setAddClientError] = useState('')
  const [actionError, setActionError] = useState('')
  const [addClientForm, setAddClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    services: [] as string[],
    notes: '',
  })
  const [stats, setStats] = useState({
    totalClients: 0,
    healthyClients: 0,
    atRiskClients: 0,
    pendingFollowUps: 0,
    openComplaints: 0,
  })
  const [followUpForm, setFollowUpForm] = useState({
    clientId: '',
    title: '',
    scheduledFor: '',
    method: 'EMAIL',
    description: '',
  })
  const [complaintForm, setComplaintForm] = useState({
    clientId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER',
  })
  const [interactionForm, setInteractionForm] = useState({
    clientId: '',
    type: 'NOTE',
    subject: '',
    content: '',
    handledBy: '',
    sentiment: 'NEUTRAL',
  })
  const [selectedWhatsAppClientId, setSelectedWhatsAppClientId] = useState('')
  const [whatsAppStatus, setWhatsAppStatus] = useState('')
  const [whatsAppStatusError, setWhatsAppStatusError] = useState('')

  const selectedWhatsAppClient = clients.find((client: any) => client.id === selectedWhatsAppClientId)

  const formatDateTime = (value?: string | Date) => {
    if (!value) return 'Not set'
    return new Date(value).toLocaleString()
  }

  const sortByDate = (items: any[], dateKey: string, order: string) => {
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a?.[dateKey] ?? 0).getTime()
      const bTime = new Date(b?.[dateKey] ?? 0).getTime()
      return aTime - bTime
    })
    return order === 'DESC' ? sorted.reverse() : sorted
  }

  const getFollowUpStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800'
      case 'SENT':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'SKIPPED':
        return 'bg-slate-200 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getComplaintStatusClass = (status: string) => {
    switch (status) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-green-100 text-green-800'
      case 'NEGATIVE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const visibleFollowUps = sortByDate(
    followUpStatusFilter === 'ALL'
      ? followUps
      : followUps.filter((followUp: any) => followUp.status === followUpStatusFilter),
    'scheduledFor',
    followUpSortOrder
  )

  const visibleComplaints = sortByDate(
    complaintStatusFilter === 'OPEN'
      ? complaints.filter((complaint: any) => ['PENDING', 'IN_PROGRESS', 'URGENT'].includes(complaint.status))
      : complaintStatusFilter === 'ALL'
        ? complaints
        : complaints.filter((complaint: any) => complaint.status === complaintStatusFilter),
    'createdAt',
    complaintSortOrder
  )

  const visibleInteractions = sortByDate(
    interactionTypeFilter === 'ALL'
      ? interactions
      : interactions.filter((interaction: any) => interaction.type === interactionTypeFilter),
    'createdAt',
    interactionSortOrder
  )
  const visibleInsights = sortByDate(
    insightStatusFilter === 'ALL'
      ? insights
      : insightStatusFilter === 'PENDING'
        ? insights.filter((insight: any) => !insight.actedUpon)
        : insights.filter((insight: any) => insight.actedUpon),
    'createdAt',
    'DESC'
  )

  const pagedFollowUps = visibleFollowUps.slice(0, followUpsVisibleCount)
  const pagedComplaints = visibleComplaints.slice(0, complaintsVisibleCount)
  const pagedInteractions = visibleInteractions.slice(0, interactionsVisibleCount)
  const pagedInsights = visibleInsights.slice(0, insightsVisibleCount)

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!selectedWhatsAppClientId && clients.length > 0) {
      setSelectedWhatsAppClientId(clients[0].id)
    }
  }, [clients, selectedWhatsAppClientId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [clientsRes, followUpsRes, pendingFollowUpsRes, complaintsRes, interactionsRes, insightsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/followups?limit=200'),
        fetch('/api/followups?status=PENDING'),
        fetch('/api/complaints?limit=200'),
        fetch('/api/interactions?limit=200'),
        fetch('/api/insights?limit=200'),
      ])

      const clientsPayload = await clientsRes.json()
      const followUpsPayload = await followUpsRes.json()
      const pendingFollowUpsPayload = await pendingFollowUpsRes.json()
      const complaintsPayload = await complaintsRes.json()
      const interactionsPayload = await interactionsRes.json()
      const insightsPayload = await insightsRes.json()
      const clientsData = clientsPayload.success ? clientsPayload.data ?? [] : []
      const followUpsData = followUpsPayload.success ? followUpsPayload.data ?? [] : []
      const complaintsData = complaintsPayload.success ? complaintsPayload.data ?? [] : []
      const interactionsData = interactionsPayload.success ? interactionsPayload.data ?? [] : []
      const insightsData = insightsPayload.success ? insightsPayload.data ?? [] : []

      setClients(clientsData)
      setFollowUps(followUpsData)
      setComplaints(complaintsData)
      setInteractions(interactionsData)
      setInsights(insightsData)
      setStats({
        totalClients: clientsData.length,
        healthyClients: clientsData.filter((client: any) => client.healthStatus === 'GREEN').length,
        atRiskClients: clientsData.filter((client: any) => client.healthStatus === 'RED').length,
        pendingFollowUps: pendingFollowUpsPayload.success ? (pendingFollowUpsPayload.data?.length ?? 0) : 0,
        openComplaints: complaintsPayload.success ? (complaintsPayload.stats?.openComplaints ?? 0) : 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setClients([])
      setFollowUps([])
      setComplaints([])
      setInteractions([])
      setInsights([])
      setStats({
        totalClients: 0,
        healthyClients: 0,
        atRiskClients: 0,
        pendingFollowUps: 0,
        openComplaints: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddClient = () => {
    setAddClientError('')
    setIsAddClientOpen(true)
  }

  const handleAddClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddClientError('')
    setIsSubmittingClient(true)

    if (!addClientForm.name.trim() || !addClientForm.email.trim()) {
      setAddClientError('Name and email are required')
      setIsSubmittingClient(false)
      return
    }

    const normalizedPhone = addClientForm.phone.trim()
    const normalizedServices = normalizeClientServices(addClientForm.services)
    if (normalizedPhone && !E164_PHONE_REGEX.test(normalizedPhone)) {
      setAddClientError('Phone must be in E.164 format (e.g., +233550106970) or left blank')
      setIsSubmittingClient(false)
      return
    }

    if (normalizedServices.length === 0) {
      setAddClientError('Select at least one requested service')
      setIsSubmittingClient(false)
      return
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addClientForm, phone: normalizedPhone, services: normalizedServices }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save client')
      }

      setAddClientForm({ name: '', email: '', phone: '', company: '', services: [], notes: '' })
      setIsAddClientOpen(false)
      setActiveTab('overview')
      await fetchDashboardData()
    } catch (error: any) {
      setAddClientError(error.message || 'Failed to save client')
    } finally {
      setIsSubmittingClient(false)
    }
  }

  const handleCreateFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError('')
    const response = await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followUpForm),
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) {
      setActionError(payload.error || 'Failed to create follow-up')
      return
    }
    setIsFollowUpOpen(false)
    setFollowUpForm({ clientId: '', title: '', scheduledFor: '', method: 'EMAIL', description: '' })
    await fetchDashboardData()
  }

  const handleCreateComplaint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError('')
    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintForm),
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) {
      setActionError(payload.error || 'Failed to create complaint')
      return
    }
    setIsComplaintOpen(false)
    setComplaintForm({ clientId: '', title: '', description: '', priority: 'MEDIUM', category: 'OTHER' })
    await fetchDashboardData()
  }

  const handleCreateInteraction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError('')
    const response = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interactionForm),
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) {
      setActionError(payload.error || 'Failed to create interaction')
      return
    }
    setIsInteractionOpen(false)
    setInteractionForm({
      clientId: '',
      type: 'NOTE',
      subject: '',
      content: '',
      handledBy: '',
      sentiment: 'NEUTRAL',
    })
    await fetchDashboardData()
  }

  const handleWhatsAppSent = async ({ messageSid }: { messageSid?: string }) => {
    setWhatsAppStatus('')
    setWhatsAppStatusError('')

    await fetchDashboardData()

    if (!messageSid) {
      return
    }

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const finalStatuses = new Set(['DELIVERED', 'UNDELIVERED', 'FAILED'])
    const maxAttempts = 6

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const statusRes = await fetch(`/api/whatsapp/status?messageSid=${encodeURIComponent(messageSid)}`)
        const statusPayload = await statusRes.json()
        if (!statusRes.ok || !statusPayload.success) {
          throw new Error(statusPayload.error || 'Unable to check message status')
        }

        const currentStatus = String(statusPayload.status ?? 'queued').toUpperCase()
        setWhatsAppStatus(currentStatus)

        if (finalStatuses.has(currentStatus)) {
          return
        }
      } catch (error: any) {
        // Keep polling despite transient errors and show final known issue if attempts are exhausted.
        if (attempt === maxAttempts - 1) {
          setWhatsAppStatusError(error.message || 'Unable to check message status')
        }
      }

      if (attempt < maxAttempts - 1) {
        await sleep(2500)
      }
    }
  }

  const handleInsightStatusChange = async (insightId: string, actedUpon: boolean) => {
    setActionError('')
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, actedUpon }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update insight')
      }
      setInsights((prev) =>
        prev.map((insight: any) =>
          insight.id === insightId ? { ...insight, actedUpon } : insight
        )
      )
    } catch (error: any) {
      setActionError(error.message || 'Failed to update insight')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Impakers AI Relationship Manager
        </h1>
        <p className="text-lg text-slate-600">
          AI-powered client engagement & relationship management system.
        </p>
        {loading ? <p className="text-sm text-slate-500 mt-2">Loading latest client data...</p> : null}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Clients */}
        <Card
          className="border-l-4 border-l-blue-500 cursor-pointer transition hover:shadow-md"
          onClick={() => setActiveTab('clients')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setActiveTab('clients')
            }
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalClients}</div>
            <p className="text-xs text-slate-500 mt-1">Active relationships · Click to view list</p>
          </CardContent>
        </Card>

        {/* Healthy Clients (Green) */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.healthyClients}</div>
            <p className="text-xs text-slate-500 mt-1">Happy & engaged</p>
          </CardContent>
        </Card>

        {/* At Risk Clients (Red) */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.atRiskClients}</div>
            <p className="text-xs text-slate-500 mt-1">Need urgent action</p>
          </CardContent>
        </Card>

        {/* Pending Follow-Ups */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Follow-Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingFollowUps}</div>
            <p className="text-xs text-slate-500 mt-1">Pending actions</p>
          </CardContent>
        </Card>

        {/* Open Complaints */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.openComplaints}</div>
            <p className="text-xs text-slate-500 mt-1">Unresolved issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="clients">👥 Clients</TabsTrigger>
          <TabsTrigger value="followups">🔁 Follow-Ups</TabsTrigger>
          <TabsTrigger value="complaints">📂 Complaints</TabsTrigger>
          <TabsTrigger value="ai-insights">🧠 AI Insights</TabsTrigger>
          <TabsTrigger value="interactions">📞 Interactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Client Health Dashboard */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Client Health Dashboard
                </CardTitle>
                <CardDescription>
                  Real-time status of all your clients - Green (Happy), Yellow (Inactive), Red (At Risk)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Green - Healthy Clients */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-semibold text-slate-900">Healthy Clients</p>
                        <p className="text-sm text-slate-600">Engaged and satisfied</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{stats.healthyClients}</div>
                  </div>

                  {/* Yellow - Inactive Clients */}
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <div>
                        <p className="font-semibold text-slate-900">Inactive Clients</p>
                        <p className="text-sm text-slate-600">Need attention soon</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                  </div>

                  {/* Red - At Risk Clients */}
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <div>
                        <p className="font-semibold text-slate-900">At Risk Clients</p>
                        <p className="text-sm text-slate-600">Urgent action required</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.atRiskClients}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={handleOpenAddClient}>
                  <Users className="w-4 h-4 mr-2" />
                  Add New Client
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setActiveTab('interactions')
                    setIsInteractionOpen(true)
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Log Interaction
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setActiveTab('followups')
                    setIsFollowUpOpen(true)
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Follow-Up
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setActiveTab('complaints')
                    setIsComplaintOpen(true)
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report Complaint
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('ai-insights')}>
                  <Zap className="w-4 h-4 mr-2" />
                  View AI Suggestions
                </Button>

                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm font-medium text-slate-700">Send WhatsApp Message</p>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={selectedWhatsAppClientId}
                    onChange={(event) => setSelectedWhatsAppClientId(event.target.value)}
                    disabled={clients.length === 0}
                  >
                    {clients.length === 0 ? <option value="">No clients available</option> : null}
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {selectedWhatsAppClient ? (
                    <WhatsAppSender
                      clientId={selectedWhatsAppClient.id}
                      clientName={selectedWhatsAppClient.name}
                      clientPhone={selectedWhatsAppClient.phone || 'No phone'}
                      onMessageSent={handleWhatsAppSent}
                    />
                  ) : null}

                  {whatsAppStatus ? (
                    <p className="text-xs text-green-700">Delivery status: {whatsAppStatus}</p>
                  ) : null}
                  {whatsAppStatusError ? (
                    <p className="text-xs text-red-600">{whatsAppStatusError}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Clients
              </CardTitle>
              <CardDescription>
                Full list of active client relationships in your CRM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No clients found yet.</p>
                  <p className="text-sm text-slate-500 mt-2">Use Add New Client to create your first client record.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client: any) => (
                    <div key={client.id} className="rounded-lg border p-4 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{client.name}</p>
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{client.healthStatus}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {client.email}
                        {client.phone ? ` | ${client.phone}` : ''}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Company: {client.company || 'N/A'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(client.services ?? []).length > 0 ? (
                          (client.services ?? []).map((service: string) => (
                            <span key={`${client.id}-${service}`} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">No services selected</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Interactions: {client.interactionCount || 0} | Open complaints: {client.openComplaints || 0} | Pending follow-ups: {client.pendingFollowUps || 0}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-Ups Tab */}
        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Smart Follow-Up Engine
              </CardTitle>
              <CardDescription>
                Automatically reminds staff to check on clients. Sends WhatsApp/SMS follow-ups automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="followup-filter">Status</Label>
                  <select
                    id="followup-filter"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={followUpStatusFilter}
                    onChange={(event) => {
                      setFollowUpStatusFilter(event.target.value)
                      setFollowUpsVisibleCount(10)
                    }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SENT">Sent</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="SKIPPED">Skipped</option>
                    <option value="ALL">All</option>
                  </select>
                  <Label htmlFor="followup-sort">Sort</Label>
                  <select
                    id="followup-sort"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={followUpSortOrder}
                    onChange={(event) => {
                      setFollowUpSortOrder(event.target.value)
                      setFollowUpsVisibleCount(10)
                    }}
                  >
                    <option value="ASC">Oldest first</option>
                    <option value="DESC">Newest first</option>
                  </select>
                </div>
                <Button onClick={() => setIsFollowUpOpen(true)}>Schedule New Follow-Up</Button>
              </div>

              {visibleFollowUps.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No follow-ups found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedFollowUps.map((followUp: any) => (
                    <div key={followUp.id} className="rounded-lg border p-4 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{followUp.title}</p>
                        <span className={`text-xs px-2 py-1 rounded ${getFollowUpStatusClass(followUp.status)}`}>{followUp.status}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Client: {followUp.client?.name || 'Unknown'} | Method: {followUp.method}
                      </p>
                      {followUp.description ? <p className="text-sm text-slate-700 mt-2">{followUp.description}</p> : null}
                      <p className="text-xs text-slate-500 mt-2">Scheduled: {formatDateTime(followUp.scheduledFor)}</p>
                    </div>
                  ))}
                </div>
              )}
              {visibleFollowUps.length > followUpsVisibleCount ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => setFollowUpsVisibleCount((count) => count + 10)}>
                    Load more follow-ups
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Complaint Tracker (Zero Chaos)
              </CardTitle>
              <CardDescription>
                Logs every issue, assigns status (Pending/Resolved/Urgent), sends reminders until resolved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="complaint-filter">Status</Label>
                  <select
                    id="complaint-filter"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={complaintStatusFilter}
                    onChange={(event) => {
                      setComplaintStatusFilter(event.target.value)
                      setComplaintsVisibleCount(10)
                    }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="URGENT">Urgent</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="ALL">All</option>
                  </select>
                  <Label htmlFor="complaint-sort">Sort</Label>
                  <select
                    id="complaint-sort"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={complaintSortOrder}
                    onChange={(event) => {
                      setComplaintSortOrder(event.target.value)
                      setComplaintsVisibleCount(10)
                    }}
                  >
                    <option value="DESC">Newest first</option>
                    <option value="ASC">Oldest first</option>
                  </select>
                </div>
                <Button onClick={() => setIsComplaintOpen(true)}>Report New Complaint</Button>
              </div>

              {visibleComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No complaints found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedComplaints.map((complaint: any) => (
                    <div key={complaint.id} className="rounded-lg border p-4 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{complaint.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${getComplaintStatusClass(complaint.status)}`}>{complaint.status}</span>
                          <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">{complaint.priority}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Client: {complaint.client?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-700 mt-2">{complaint.description}</p>
                      <p className="text-xs text-slate-500 mt-2">Logged: {formatDateTime(complaint.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
              {visibleComplaints.length > complaintsVisibleCount ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => setComplaintsVisibleCount((count) => count + 10)}>
                    Load more complaints
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Assistant (Your Secret Weapon)
              </CardTitle>
              <CardDescription>
                Suggests what to say, when to follow up, which clients are at risk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Label htmlFor="insight-filter">Status</Label>
                <select
                  id="insight-filter"
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={insightStatusFilter}
                  onChange={(event) => {
                    setInsightStatusFilter(event.target.value)
                    setInsightsVisibleCount(10)
                  }}
                >
                  <option value="PENDING">Pending action</option>
                  <option value="ACTED">Acted upon</option>
                  <option value="ALL">All</option>
                </select>
              </div>

              {visibleInsights.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No AI insights available yet</p>
                  <p className="text-sm text-slate-500 mt-2">Add clients and interactions to get AI-powered suggestions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedInsights.map((insight: any) => (
                    <div key={insight.id} className="rounded-lg border p-4 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{insight.title}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            insight.actedUpon ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {insight.actedUpon ? 'Acted upon' : 'Pending action'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Type: {insight.type} | Confidence: {insight.confidence}%</p>
                      <p className="text-sm text-slate-700 mt-2">{insight.description}</p>
                      {insight.suggestedAction ? (
                        <p className="text-sm text-blue-700 mt-2">Suggested action: {insight.suggestedAction}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                        <p className="text-xs text-slate-500">Created: {formatDateTime(insight.createdAt)}</p>
                        <Button
                          variant={insight.actedUpon ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleInsightStatusChange(insight.id, !insight.actedUpon)}
                        >
                          {insight.actedUpon ? 'Mark as pending' : 'Mark as acted'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {visibleInsights.length > insightsVisibleCount ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => setInsightsVisibleCount((count) => count + 10)}>
                    Load more insights
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Interaction Memory
              </CardTitle>
              <CardDescription>
                Complete history of all client communications - calls, messages, complaints, meetings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="interaction-filter">Type</Label>
                  <select
                    id="interaction-filter"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={interactionTypeFilter}
                    onChange={(event) => {
                      setInteractionTypeFilter(event.target.value)
                      setInteractionsVisibleCount(10)
                    }}
                  >
                    <option value="ALL">All</option>
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="MEETING">Meeting</option>
                    <option value="NOTE">Note</option>
                    <option value="FEEDBACK">Feedback</option>
                  </select>
                  <Label htmlFor="interaction-sort">Sort</Label>
                  <select
                    id="interaction-sort"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={interactionSortOrder}
                    onChange={(event) => {
                      setInteractionSortOrder(event.target.value)
                      setInteractionsVisibleCount(10)
                    }}
                  >
                    <option value="DESC">Newest first</option>
                    <option value="ASC">Oldest first</option>
                  </select>
                </div>
                <Button onClick={() => setIsInteractionOpen(true)}>Log New Interaction</Button>
              </div>

              {visibleInteractions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No interactions found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedInteractions.map((interaction: any) => (
                    <div key={interaction.id} className="rounded-lg border p-4 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{interaction.subject || interaction.type}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{interaction.type}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getSentimentClass(interaction.sentiment)}`}>{interaction.sentiment}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Client: {interaction.client?.name || 'Unknown'} | Handled by: {interaction.handledBy}
                      </p>
                      <p className="text-sm text-slate-700 mt-2">{interaction.content}</p>
                      <p className="text-xs text-slate-500 mt-2">Logged: {formatDateTime(interaction.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
              {visibleInteractions.length > interactionsVisibleCount ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => setInteractionsVisibleCount((count) => count + 10)}>
                    Load more interactions
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🔁 Smart Follow-Up</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Automatically reminds staff to check on clients. Sends WhatsApp/SMS follow-ups.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📂 Complaint Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Logs every issue, tracks status, sends reminders until resolved.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🧠 AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Suggests what to say, when to follow up, which clients are at risk.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📊 Health Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Green (happy), Yellow (inactive), Red (at risk) - never lose a client silently.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📞 Interaction Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Complete history of calls, messages, complaints - no more "what did they say?"
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client record so you can start tracking interactions and follow-ups.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Name</Label>
              <Input
                id="client-name"
                value={addClientForm.name}
                onChange={(event) => setAddClientForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={addClientForm.email}
                onChange={(event) => setAddClientForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                value={addClientForm.phone}
                onChange={(event) => setAddClientForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-company">Company</Label>
              <Input
                id="client-company"
                value={addClientForm.company}
                onChange={(event) => setAddClientForm((prev) => ({ ...prev, company: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-notes">Notes</Label>
              <Textarea
                id="client-notes"
                value={addClientForm.notes}
                onChange={(event) => setAddClientForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Requested Services</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
                {CLIENT_SERVICE_OPTIONS.map((service) => (
                  <label key={service} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={addClientForm.services.includes(service)}
                      onChange={(event) =>
                        setAddClientForm((prev) => ({
                          ...prev,
                          services: event.target.checked
                            ? [...prev.services, service]
                            : prev.services.filter((selectedService) => selectedService !== service),
                        }))
                      }
                    />
                    {service}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">Select one or more services the client requested.</p>
            </div>

            {addClientError ? <p className="text-sm text-red-600">{addClientError}</p> : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddClientOpen(false)}
                disabled={isSubmittingClient}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingClient}>
                {isSubmittingClient ? 'Saving...' : 'Save Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-Up</DialogTitle>
            <DialogDescription>Create a follow-up task for a client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFollowUp} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={followUpForm.clientId}
                onChange={(event) => setFollowUpForm((prev) => ({ ...prev, clientId: event.target.value }))}
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={followUpForm.title}
                onChange={(event) => setFollowUpForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>When</Label>
              <Input
                type="datetime-local"
                value={followUpForm.scheduledFor}
                onChange={(event) => setFollowUpForm((prev) => ({ ...prev, scheduledFor: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={followUpForm.method}
                onChange={(event) => setFollowUpForm((prev) => ({ ...prev, method: event.target.value }))}
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="CALL">Call</option>
                <option value="IN_PERSON">In Person</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={followUpForm.description}
                onChange={(event) => setFollowUpForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFollowUpOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Follow-Up</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isComplaintOpen} onOpenChange={setIsComplaintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Complaint</DialogTitle>
            <DialogDescription>Log a new complaint and assign severity.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateComplaint} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={complaintForm.clientId}
                onChange={(event) => setComplaintForm((prev) => ({ ...prev, clientId: event.target.value }))}
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={complaintForm.title}
                onChange={(event) => setComplaintForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={complaintForm.description}
                onChange={(event) => setComplaintForm((prev) => ({ ...prev, description: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={complaintForm.priority}
                onChange={(event) => setComplaintForm((prev) => ({ ...prev, priority: event.target.value }))}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComplaintOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Complaint</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isInteractionOpen} onOpenChange={setIsInteractionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
            <DialogDescription>Store a conversation or touchpoint with a client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInteraction} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={interactionForm.clientId}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, clientId: event.target.value }))}
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={interactionForm.type}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, type: event.target.value }))}
                required
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="MEETING">Meeting</option>
                <option value="NOTE">Note</option>
                <option value="FEEDBACK">Feedback</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Handled By</Label>
              <Input
                value={interactionForm.handledBy}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, handledBy: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={interactionForm.subject}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, subject: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={interactionForm.content}
                onChange={(event) => setInteractionForm((prev) => ({ ...prev, content: event.target.value }))}
                required
              />
            </div>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInteractionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Interaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
