function generateRandomId () {
  return (Math.floor(Math.random() * 100000000000000000)).toString()
}

export class PostMessageClient {
  constructor (window, targetOrigin = '*', groupId = '') {
    this.handlers = {}
    this.targetWindow = window
    this.targetOrigin = targetOrigin
    this.groupId = groupId
    this._pendingMessages = []
    this._deliverMessages = false
    this._replayQueue = {}
  }

  start = () => {
    window.addEventListener('message', this._onMessageReceived, false)
  }

  enableDeliver = () => {
    this._deliverMessages = true
    this._pendingMessages.forEach(message => this.targetWindow.postMessage(message, '*'))
    this._pendingMessages = []
  }

  finalize = () => {
    window.removeEventListener('message', this._onMessageReceived, false)
  }

  subscribe = (topic, handler) => {
    this.handlers[topic + this.groupId] = handler
  }

  unsuscribe = (topic) => {
    delete this.handlers[topic + this.groupId]
  }

  _onMessageReceived = async (event) => {
    if (!event.data || !event.data.v1) {
      return
    }
    const message = event.data.v1
    if (message.repliesTo && this._replayQueue[message.repliesTo]) {
      const { [message.repliesTo]: { resolve, reject }, ...rest } = this._replayQueue
      this._replayQueue = rest
      if (message.errorResponse) {
        await reject(message.payload, message.topic, message.messageId)
      } else {
        await resolve(message.payload, message.topic, message.messageId)
      }
      return
    }

    const handler = this.handlers[message.topic]
    if (handler) {
      try {
        const response = await handler(message.payload, message.topic, message.messageId)
        if (message.reply) {
          this.send(`${message.topic}:reply`, response, { repliesTo: message.messageId, errorResponse: false })
        }
      } catch (e) {
        console.error(e)
        if (message.reply) {
          this.send(`${message.topic}:reply`, { message: e.message }, { repliesTo: message.messageId, errorResponse: true })
        }
      }
    }
  }

  send = (topic, payload, metadata = {}) => {
    const messageId = generateRandomId()
    const message = {
      v1: {
        topic: topic + this.groupId,
        payload,
        messageId,
        ...metadata
      }
    }
    if (!this._deliverMessages) {
      this._pendingMessages = [...this._pendingMessages, message]
    } else {
      this.targetWindow.postMessage(message, this.targetOrigin)
    }
    return message
  }

  sendWithReply = async (topic, payload) => {
    return new Promise((resolve, reject) => {
      const { v1: { messageId } } = this.send(topic, payload, { reply: true })
      this._replayQueue = { ...this._replayQueue, [messageId]: { resolve, reject } }
    })
  }
}
