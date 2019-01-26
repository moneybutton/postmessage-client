import config from './util/config'

const BASE_URL = config.get('MONEY_BUTTON_WEBAPP_PROXY_URI')

export class PostMessageClient {
  constructor (window) {
    this.handlers = {}
    this.targetWindow = window
  }

  start = () => {
    window.addEventListener('message', this._onMessageReceived, false)
  }

  finalize = () => {
    window.removeEventListener('message', this._onMessageReceived, false)
  }

  subscribe = (topic, handler) => {
    this.handlers[topic] = handler
  }

  _onMessageReceived = (event) => {
    if (event.source !== this.targetWindow) {
      return
    }
    if (!event.data || !event.data.v1) {
      return
    }
    const message = event.data.v1
    const handler = this.handlers[message.topic]
    if (handler) {
      handler(message.payload, message.topic)
    }
  }

  send = (topic, payload, extraPayload = {}) => {
    const message = {
      v1: {
        topic,
        payload
      }
    }
    this.targetWindow.postMessage({...message, ...extraPayload}, '*')
  }

  sendInsufficientBalanceError = () => {
    const payload = {
      error: 'insufficient balance',
      popup: {
        title: 'Low Balance',
        message: 'Your balance is too low to make this payment.',
        buttonText: 'Add Money',
        buttonUrl: `${BASE_URL}/wallet`
      }
    }
    this.send('error.insufficient-balance', payload, payload)
  }

  sendUnexpectedError = (err) => {
    const payload = {
      error: 'unexpected error',
      popup: {
        title: 'Unknown Error',
        message: err.message
        // buttonText: '',
        // buttonUrl: ''
      }
    }
    this.send('error.unexpected-error', payload, payload)
  }

  sendPaymentSuccess = (payment) => {
    const payload = { payment }
    this.send('payment-success', payload, payload)
  }

  sendNotLoggedInError = (payment) => {
    const payload = {
      error: 'not logged in',
      popup: {
        title: 'Money Button',
        message: 'We believe in sound digital money for everyone in the world. Join Money Button to make this payment.',
        buttonText: 'Sign Up',
        buttonUrl: `${BASE_URL}/register`,
        buttonText2: 'Log In',
        buttonUrl2: `${BASE_URL}/login`
      }
    }
    this.send('error.not-logged-in', payload, payload)
  }

  sendCompatibilityIssue = (issue) => {
    const payload = {
      error: 'compatibility',
      message: issue.message,
      popup: {
        title: 'Compatibility',
        message: issue.message
      }
    }
    this.send('error.compatibility', payload, payload)
  }

  sendSafaryIssueHint = () => {
    const payload = {
      error: 'safari privacy',
      popup: {
        title: 'Money Button',
        message: 'We believe in sound digital money for everyone in the world. Enable Money Button on Safari to make this payment.',
        buttonUrl: 'https://blog.moneybutton.com/2018/09/24/how-to-enable-money-button-on-safari-and-ios/',
        buttonText: 'Enable'
      }
    }
    this.send('error.safari-compatibility', payload, payload)
  }
}
