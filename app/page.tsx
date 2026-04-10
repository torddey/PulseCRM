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

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, MessageSquare, Zap } from 'lucide-react'

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    healthyClients: 0,
    atRiskClients: 0,
    pendingFollowUps: 0,
    openComplaints: 0,
  })

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // In a real app, this would fetch from your API
      // For now, we'll show the structure
      setStats({
        totalClients: 0,
        healthyClients: 0,
        atRiskClients: 0,
        pendingFollowUps: 0,
        openComplaints: 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          🚀 Proactive AI Relationship Manager
        </h1>
        <p className="text-lg text-slate-600">
          Never lose a client silently again. AI-powered client engagement & relationship management.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Clients */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalClients}</div>
            <p className="text-xs text-slate-500 mt-1">Active relationships</p>
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
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
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
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Add New Client
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Log Interaction
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Follow-Up
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report Complaint
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  View AI Suggestions
                </Button>
              </CardContent>
            </Card>
          </div>
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
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No pending follow-ups at the moment</p>
                <Button className="mt-4">Schedule New Follow-Up</Button>
              </div>
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
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No open complaints</p>
                <Button className="mt-4">Report New Complaint</Button>
              </div>
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
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No AI insights available yet</p>
                <p className="text-sm text-slate-500 mt-2">Add clients and interactions to get AI-powered suggestions</p>
              </div>
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
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No interactions recorded yet</p>
                <Button className="mt-4">Log New Interaction</Button>
              </div>
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
    </div>
  )
}
