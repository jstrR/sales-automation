# sales-automation

## Docker build image

1. `docker build --tag sales-automation .`
1. `docker run --restart unless-stopped -p 8080:8080 -d --name ssa_server sales-automation`

## Local run

1. `npm i`
2. `npm start` or `npm run dev`

## ENV VARS

`PORT=` - port number

`TG_APP_ID=` - Telegram app id number

`TG_APP_HASH=` - Telegram app hash

`TG_APP_PHONE=` - Telegram account phone number

`TG_APP_PASSWORD=` - Telegram account password if 2FA presents (Optional)

`TG_APP_SESSION_TOKEN=` - Telegram session token

`HUBSPOT_API_TOKEN=` - Hubspot OAuth 2.0 authentication token

`HUBSPOT_OWNER_ID=` - Hubspot user id

`TIMEBASE_USER_EMAIL=` - Timebase user email

`TIMEBASE_USER_PASSWORD=` - Timebase user email
