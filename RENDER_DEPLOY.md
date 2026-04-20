# Render Deployment Guide

## 1) Create Web Service
- Push this project to GitHub.
- In Render, click **New +** -> **Web Service**.
- Connect your GitHub repo and select this project.

## 2) Build and start commands
- Build Command: `npm install`
- Start Command: `npm start`

## 3) Required environment variables
Set these in Render -> Service -> Environment:

- `NODE_ENV=production`
- `USE_HTTPS=false`
- `MONGO_URI=<your mongodb connection string>`
- `SESSION_SECRET=<long random secret>`
- `JWT_SECRET=<long random secret>`
- `RAZORPAY_KEY_ID=<your key id>`
- `RAZORPAY_KEY_SECRET=<your key secret>`

## 4) MongoDB notes
- If using MongoDB Atlas, allow Render egress IPs or use `0.0.0.0/0` temporarily while testing.
- Use the full connection string, e.g. `mongodb+srv://...`.

## 5) First deploy checks
- Open your Render app URL.
- Confirm `/` returns 200.
- Confirm sign up/sign in works.
- Confirm database writes are happening in MongoDB.
