# Aaradhya Setu - Booking Workflow & Notifications

This is my submission for the Aaradhya Setu SDE Intern assignment (Option 3). It's a Next.js and MongoDB app for managing Puja bookings across four stages and logging automated WhatsApp updates on each status change.

## How it works

Bookings move strictly in order:
`Booking Confirmed -> Puja Started -> Puja Completed -> Video Available`

The transition rules are checked on the backend (`PATCH /api/bookings/[id]/advance`) so stages can't be skipped or updated from a stale state. Whenever a booking is created or moved forward, the server renders the message template with the devotee's name, Puja name, booking ID, temple, and video link (on the last stage), then saves the notification in MongoDB.

What's included in the dashboard:
- Filter bookings by stage or search by booking ID, devotee name, or Puja
- Create new bookings (starts at `Booking Confirmed` and logs the first message)
- Advance bookings step-by-step with optional notes and a message preview before sending
- Add a video URL when moving to `Video Available` (uses a placeholder link if left empty)
- Check the WhatsApp thread per booking or view the full notification history tab

## Branches

- `main`: Mock WhatsApp notifications, as asked in the assignment. Only needs a MongoDB URI to run.
- `feat/live-whatsapp`: Real outbound WhatsApp messages via Twilio. Since Twilio's trial sandbox blocks free-form text (error `21654`), it supports `ContentSid` templates and falls back to mock mode if Twilio env vars aren't set.

## Running locally

Built with Next.js (App Router), MongoDB (Mongoose), and Tailwind CSS.

1. Clone the repo and install dependencies:
```bash
git clone [https://github.com/Shailja-Jha/aaradhya-setu-workflow.git](https://github.com/Shailja-Jha/aaradhya-setu-workflow.git)
cd aaradhya-setu-workflow
npm install