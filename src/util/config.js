import MoneyButtonConfigBuilder from '@moneybutton/config'

const config = new MoneyButtonConfigBuilder()
  .addValue('NETWORK', process.env.NETWORK)
  .addValue(
    'MONEY_BUTTON_WEBAPP_PROXY_URI',
    process.env.MONEY_BUTTON_WEBAPP_PROXY_URI
  )
  .addValue(
    'MONEY_BUTTON_PUBLIC_CLIENT_IDENTIFIER',
    process.env.MONEY_BUTTON_PUBLIC_CLIENT_IDENTIFIER
  )
  .addValue(
    'MONEY_BUTTON_CONFIDENTIAL_CLIENT_IDENTIFIER',
    process.env.MONEY_BUTTON_CONFIDENTIAL_CLIENT_IDENTIFIER
  )
  .addValue(
    'MONEY_BUTTON_CONFIDENTIAL_CLIENT_SECRET',
    process.env.MONEY_BUTTON_CONFIDENTIAL_CLIENT_SECRET
  )
  .build()

export default config
