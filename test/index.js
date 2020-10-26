import should from 'should'
import { PostMessageClient } from '../src'

describe('PostMessageCient', () => {
  it('should exist', () => {
    should.exist(PostMessageClient)
  })

  it('should create an instance', async () => {
    const client = new PostMessageClient()
    should.exist(client)
  })
})
