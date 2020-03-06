import config from './util/config'

const BASE_URL = config.get('MONEY_BUTTON_WEBAPP_PROXY_URI')

function generateRandomId () {
  return (Math.floor(Math.random() * 100000000000000000)).toString()
}

export class PostMessageClient {
  constructor (window) {
    this.handlers = {}
    this.targetWindow = window
    this._pendingMessages = []
    this._deliverMessages = false
    this._replayQueue = {}
  }

  start = () => {
    window.addEventListener('message', this._onMessageReceived, false)
  }

  enableDeliver = () => {
    this._deliverMessages = true
    this._pendingMessages.forEach(message => this.send(
      message.topic,
      message.payload,
      message.extraPayload
    ))
    this._pendingMessages = []
  }

  finalize = () => {
    window.removeEventListener('message', this._onMessageReceived, false)
  }

  subscribe = (topic, handler) => {
    this.handlers[topic] = handler
  }

  _onMessageReceived = async (event) => {
    if (event.source !== this.targetWindow) {
      return
    }
    if (!event.data || !event.data.v1) {
      return
    }
    const message = event.data.v1
    if (message.repliesTo) {
      const { [message.repliesTo]: handler, ...rest } = this._replayQueue
      this._replayQueue = rest
      await handler(message.payload, message.topic, message.messageId)
      return
    }

    const handler = this.handlers[message.topic]
    if (handler) {
      try {
        const response = await handler(message.payload, message.topic, message.messageId)
        if (message.reply) {
          this.send(`${message.topic}:reply`, response, { repliesTo: message.messageId })
        }
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  send = (topic, payload, metadata = {}) => {
    if (!this._deliverMessages) {
      this._pendingMessages = [...this._pendingMessages, {
        topic,
        payload
      }]
    } else {
      const messageId = generateRandomId()
      const message = {
        v1: {
          topic,
          payload,
          messageId,
          ...metadata
        }
      }
      this.targetWindow.postMessage(message, '*')
      return message
    }
  }

  sendWithReply = async (topic, payload) => {
    return new Promise((resolve) => {
      const { v1: { messageId } } = this.send(topic, payload, { reply: true })
      this._replayQueue = { ...this._replayQueue, [messageId]: resolve }
    })
  }

  sendInsufficientBalanceError = () => {
    const payload = {
      error: 'insufficient balance',
      popup: {
        title: 'Low balance',
        message: 'Your balance is too low to make this payment.',
        buttonText: 'Add Money',
        buttonUrl: `${BASE_URL}/money`
      }
    }
    this.send('error.insufficient-balance', payload)
  }

  sendUnexpectedError = (err) => {
    const payload = {
      error: 'unexpected error',
      popup: {
        title: 'Unexpected Error',
        message: err.message
        // buttonText: '',
        // buttonUrl: ''
      }
    }
    this.send('error.unexpected-error', payload)
  }

  sendCryptoOperationsError = (err) => {
    const payload = {
      error: 'crypto operations error',
      popup: {
        title: 'Crypto Operations error',
        message: err.message
        // buttonText: '',
        // buttonUrl: ''
      }
    }
    this.send('error.crypto-operations-error', payload)
  }

  sendPaymentSuccess = (payment) => {
    const payload = { payment }
    this.send('payment-success', payload)
  }

  sendCryptoOperationsSuccess = (cryptoOperations) => {
    const payload = { cryptoOperations }
    this.send('crypto-operations-success', payload)
  }

  sendNotLoggedInError = (_payment) => {
    const payload = {
      error: 'not logged in',
      popup: {
        title: 'Money Button',
        message: 'Money Button is a simple payment system. Join Money Button to make this payment.',
        buttonText: 'Sign up',
        buttonUrl: `${BASE_URL}/register`,
        buttonText2: 'Log in',
        buttonUrl2: `${BASE_URL}/login`
      }
    }
    this.send('error.not-logged-in', payload)
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
    this.send('error.compatibility', payload)
  }

  sendSafaryIssueHint = () => {
    const payload = {
      error: 'safari privacy',
      popup: {
        title: 'Money Button',
        message: 'Money Button is a simple payment system. Enable Money Button on Safari and log in to make this payment.',
        buttonUrl: 'https://blog.moneybutton.com/2018/09/24/how-to-enable-money-button-on-safari-and-ios/',
        buttonText: 'Enable'
      }
    }
    this.send('error.safari-compatibility', payload)
  }
}
