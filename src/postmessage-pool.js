import { PostMessageClient } from './postmessage-client'

export class PostMessagePool {
  constructor (targets = [], targetOrigin) {
    this.clients = []
    for (let i = 0; i < targets.length; i++) {
      const client = new PostMessageClient(targets[i], targetOrigin)
      client.enableDeliver()
      this.clients.push(client)
    }
  }

  execute (method, ...params) {
    return Promise.all(this.clients.map(client => {
      return client[method](...params)
    }))
  }
}
