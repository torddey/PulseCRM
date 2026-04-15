/**
 * WhatsApp Message Sender Component
 * 
 * Allows users to send WhatsApp messages to clients directly from the CRM
 * Integrated into client detail pages and quick actions
 * 
 * Features:
 * - Send custom messages
 * - Pre-built templates (follow-up, complaint ack, resolution)
 * - Message preview
 * - Success/error feedback
 * - Loading state during sending
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MessageCircle, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppSenderProps {
  clientId: string
  clientName: string
  clientPhone: string
  onMessageSent?: (result: { messageSid?: string }) => void
}

/**
 * Pre-built message templates
 * Users can select a template and customize it
 */
const MESSAGE_TEMPLATES = {
  follow_up: {
    title: 'Follow-Up',
    template: (name: string) =>
      `Hi ${name}, just checking in! How are things progressing? Let me know if you need anything.`,
  },
  complaint_ack: {
    title: 'Complaint Acknowledgment',
    template: (name: string) =>
      `Hi ${name}, thank you for reporting this issue. We've received your complaint and our team is looking into it. We'll get back to you shortly.`,
  },
  resolution: {
    title: 'Resolution Confirmation',
    template: (name: string) =>
      `Hi ${name}, we're happy to let you know that your issue has been resolved. Thank you for your patience!`,
  },
  general: {
    title: 'General Message',
    template: (name: string) => `Hi ${name}, `,
  },
}

export function WhatsAppSender({
  clientId,
  clientName,
  clientPhone,
  onMessageSent,
}: WhatsAppSenderProps) {
  // State management
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('general')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Handle template selection
   * Fills the message textarea with the selected template
   */
  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey)
    const template =
      MESSAGE_TEMPLATES[templateKey as keyof typeof MESSAGE_TEMPLATES]
    if (template) {
      setMessage(template.template(clientName))
    }
  }

  /**
   * Send the WhatsApp message
   * Makes API call to /api/whatsapp/send
   */
  const handleSendMessage = async () => {
    // Validate message is not empty
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      // Call the WhatsApp send API
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          message: message.trim(),
          type: selectedTemplate.toUpperCase(),
        }),
      })

      // Handle API response
      const data = await response.json()

      if (!response.ok) {
        // API returned an error
        throw new Error(data.error || 'Failed to send message')
      }

      // Success! Show confirmation
      setStatus('success')
      toast.success(`Message sent to ${clientName}`)

      // Reset form
      setMessage('')
      setSelectedTemplate('general')

      // Close dialog after short delay
      setTimeout(() => {
        setOpen(false)
        setStatus('idle')
      }, 1500)

      // Call callback if provided
      if (onMessageSent) {
        onMessageSent({ messageSid: data?.messageSid })
      }
    } catch (error) {
      // Handle error
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to send message'
      setStatus('error')
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title={`Send WhatsApp to ${clientPhone}`}
        >
          <MessageCircle className="h-4 w-4" />
          Send WhatsApp
        </Button>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send WhatsApp Message</DialogTitle>
          <DialogDescription>
            Send a message to {clientName} ({clientPhone})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateSelect(key)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedTemplate === key
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-32 resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} characters
            </p>
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-900">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Message sent successfully!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
