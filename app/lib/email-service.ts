import resend from './resend'
import { renderWeddingInvitationEmail } from './email-templates'

/**
 * Email Service for WeddingShare
 * 
 * Development Mode:
 * - If RESEND_DEV_EMAIL is set, all emails are sent to that address
 * - User accounts are still created with the original email from forms
 * - Email content shows the intended recipient's information
 * - This allows testing email functionality with Resend's development restrictions
 */

interface SendWeddingInvitationParams {
  to: string
  weddingName: string
  weddingDate: string
  weddingLocation: string
  adminName: string
  loginUrl: string
  signupUrl: string
}

export async function sendWeddingInvitation({
  to,
  weddingName,
  weddingDate,
  weddingLocation,
  adminName,
  loginUrl,
  signupUrl
}: SendWeddingInvitationParams) {
  try {
    const html = renderWeddingInvitationEmail({
      weddingName,
      weddingDate,
      weddingLocation,
      adminName,
      loginUrl,
      signupUrl
    })

    // For development, send to RESEND_DEV_EMAIL but keep content for original recipient
    const actualRecipient = process.env.RESEND_DEV_EMAIL || to

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@weddingshare.com',
      to: [actualRecipient],
      subject: `You've been invited to manage ${weddingName}`,
      html: html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log(`Email sent successfully to ${actualRecipient} (intended for ${to})`, data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending wedding invitation:', error)
    throw error
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    // For development, send to RESEND_DEV_EMAIL but keep content for original recipient
    const actualRecipient = process.env.RESEND_DEV_EMAIL || to

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@weddingshare.com',
      to: [actualRecipient],
      subject: 'Welcome to WeddingShare!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ec4899;">Welcome to WeddingShare!</h1>
          <p>Hello ${name},</p>
          <p>Your WeddingShare account has been created successfully. You can now log in and start managing your weddings.</p>
          <p>Best regards,<br>The WeddingShare Team</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send welcome email: ${error.message}`)
    }

    console.log(`Welcome email sent successfully to ${actualRecipient} (intended for ${to})`, data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}

interface SendGuestInvitationParams {
  guestEmail: string
  guestName: string
  weddingName: string
  weddingDate: string
  weddingLocation: string
  joinUrl: string
}

export async function sendGuestInvitation({
  guestEmail,
  guestName,
  weddingName,
  weddingDate,
  weddingLocation,
  joinUrl
}: SendGuestInvitationParams) {
  try {
    // For development, send to RESEND_DEV_EMAIL but keep content for original recipient
    const actualRecipient = process.env.RESEND_DEV_EMAIL || guestEmail

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@weddingshare.com',
      to: [actualRecipient],
      subject: `You're invited to ${weddingName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ec4899; margin-bottom: 10px;">You're Invited!</h1>
            <h2 style="color: #333; margin: 0;">${weddingName}</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-top: 0;">Wedding Details</h3>
            <p><strong>Date:</strong> ${new Date(weddingDate).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${weddingLocation}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Hi ${guestName},<br><br>
            You've been invited to join the wedding celebration! Click the button below to view the wedding gallery, 
            share your photos, and RSVP to the event.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" 
               style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Join Wedding Gallery
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            This link will take you directly to the wedding gallery where you can:<br>
            • View and share photos<br>
            • RSVP to the wedding<br>
            • See wedding details and updates
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you have any questions, please contact the wedding organizers.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send guest invitation email: ${error.message}`)
    }

    console.log(`Guest invitation email sent successfully to ${actualRecipient} (intended for ${guestEmail})`, data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending guest invitation email:', error)
    throw error
  }
}

export async function sendConfirmationEmail(userEmail: string, userName: string, confirmUrl: string) {
  try {
    // For development, send to RESEND_DEV_EMAIL but keep content for original recipient
    const actualRecipient = process.env.RESEND_DEV_EMAIL || userEmail

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@weddingshare.com',
      to: [actualRecipient],
      subject: 'Confirm your WeddingShare account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ec4899; margin-bottom: 10px;">Welcome to WeddingShare!</h1>
            <h2 style="color: #333; margin: 0;">Confirm Your Account</h2>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Hi ${userName},<br><br>
            Thank you for signing up for WeddingShare! To complete your account setup, please confirm your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Confirm Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            If the button doesn't work, you can also copy and paste this link into your browser:<br>
            <a href="${confirmUrl}" style="color: #ec4899; word-break: break-all;">${confirmUrl}</a>
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <p style="margin: 0; color: #666;">
              Once you confirm your email, you'll be able to:<br>
              • Create and manage weddings<br>
              • Share photos and memories<br>
              • Invite guests to your celebrations<br>
              • Access all WeddingShare features
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This confirmation link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send confirmation email: ${error.message}`)
    }

    console.log(`Confirmation email sent successfully to ${actualRecipient} (intended for ${userEmail})`, data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    throw error
  }
}
