'use client';

import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { initEmailJS } from '@/lib/emailjs-init';
import Link from 'next/link';

// EmailJS credentials from InvitationContext
const EMAILJS_SERVICE_ID = 'service_lw2p126';
const EMAILJS_TEMPLATE_ID = 'template_d4qe5ym';
const EMAILJS_PUBLIC_KEY = 'b0P2yJHz_ZMo3cVlS';

export default function TestEmailJSPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error',
    message: string
  }>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Initialize EmailJS
    initEmailJS();
  }, []);
  
  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus({
        type: 'error',
        message: 'Please enter an email address'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus({
        type: 'loading',
        message: 'Sending test email...'
      });
      
      // Create test parameters
      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0],
        from_name: 'Test Sender',
        invitation_link: `${window.location.origin}/invitation/accept?token=test-token-123`,
        role: 'edit',
        message: 'This is a test invitation email.',
        reply_to: 'test@example.com',
        to: email
      };
      
      console.log('Sending test email with params:', templateParams);
      
      // Send the test email
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('Test email result:', result);
      
      setStatus({
        type: 'success',
        message: `Test email sent successfully to ${email}! Status: ${result.text}`
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      let errorMsg = 'Failed to send test email.';
      
      if (error && typeof error === 'object' && 'text' in error) {
        errorMsg += ` Server response: ${(error as {text: string}).text}`;
      }
      
      setStatus({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkTemplateVariables = () => {
    const templateVariables = [
      'to_email',
      'to_name',
      'from_name',
      'invitation_link',
      'role',
      'message',
      'reply_to',
      'to'
    ];
    
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Required Template Variables</h2>
        <p className="mb-4">Make sure your EmailJS template includes these variables:</p>
        <ul className="list-disc pl-5 space-y-1">
          {templateVariables.map(variable => (
            <li key={variable} className="font-mono text-sm">
              {variable}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">EmailJS Test Page</h1>
      <p className="mb-6">Use this page to test your EmailJS configuration and template.</p>
      
      <div className="mb-6">
        <Link href="/invitations" className="text-blue-600 hover:underline">
          ← Back to Invitations
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Send Test Email</h2>
        
        <form onSubmit={handleTestEmail}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Test Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </Button>
          
          {status.message && (
            <div 
              className={`mt-4 p-3 rounded ${
                status.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : status.type === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {status.message}
            </div>
          )}
        </form>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">EmailJS Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Service ID</h3>
            <div className="py-2 px-3 bg-gray-50 rounded border border-gray-200 font-mono">
              {EMAILJS_SERVICE_ID}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Template ID</h3>
            <div className="py-2 px-3 bg-gray-50 rounded border border-gray-200 font-mono">
              {EMAILJS_TEMPLATE_ID}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Public Key</h3>
            <div className="py-2 px-3 bg-gray-50 rounded border border-gray-200 font-mono">
              {EMAILJS_PUBLIC_KEY}
            </div>
          </div>
          
          <div className="pt-4">
            <a 
              href="https://dashboard.emailjs.com/admin/templates"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open EmailJS Dashboard
            </a>
          </div>
        </div>
        
        {checkTemplateVariables()}
      </div>
    </div>
  );
} 