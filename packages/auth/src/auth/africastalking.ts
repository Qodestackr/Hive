import AfricasTalking from 'africastalking'

const isProd = process.env['NODE_ENV'] === 'production' as const;

const credentials = {
    apiKey: "AT.NEW",//isProd ? process.env.AT_API_KEY! : process.env.AT_SANDBOX_API_KEY!,
    username: isProd ? process.env.AT_USERNAME! : 'sandbox',
}

const at = AfricasTalking(credentials)

export const atSMS: any = at.SMS
