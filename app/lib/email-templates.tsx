import { ReactElement } from 'react'

interface WeddingInvitationEmailProps {
  weddingName: string
  weddingDate: string
  weddingLocation: string
  adminName: string
  loginUrl: string
  signupUrl: string
}

export function renderWeddingInvitationEmail({
  weddingName,
  weddingDate,
  weddingLocation,
  adminName,
  loginUrl,
  signupUrl
}: WeddingInvitationEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Wedding Management Invitation</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ec4899; font-size: 28px; margin-bottom: 10px;">
              WeddingShare
            </h1>
            <p style="color: #666; font-size: 16px;">
              Wedding Management Invitation
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">
              You've been invited to manage a wedding!
            </h2>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px;">
                Wedding Details:
              </h3>
              <p style="margin-bottom: 5px;">
                <strong>Name:</strong> ${weddingName}
              </p>
              <p style="margin-bottom: 5px;">
                <strong>Date:</strong> ${new Date(weddingDate).toLocaleDateString()}
              </p>
              <p style="margin-bottom: 5px;">
                <strong>Location:</strong> ${weddingLocation}
              </p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Hello ${adminName}, you have been invited to manage this wedding on WeddingShare. 
              As a wedding admin, you'll be able to upload photos, manage guests, and oversee 
              the entire wedding gallery.
            </p>

            <div style="text-align: center; margin-bottom: 25px;">
              <a
                href="${signupUrl}"
                style="
                  background-color: #ec4899;
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: bold;
                  display: inline-block;
                "
              >
                Create Account & Access Wedding
              </a>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center;">
              If you already have an account, you can <a href="${loginUrl}" style="color: #ec4899;">sign in here</a>.<br />
              If the button doesn't work, copy and paste this link into your browser:<br />
              <span style="word-break: break-all;">${signupUrl}</span>
            </p>
          </div>

          <div style="text-align: center; font-size: 14px; color: #666;">
            <p>
              This invitation was sent by WeddingShare.<br />
              If you have any questions, please contact the wedding organizer.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}
