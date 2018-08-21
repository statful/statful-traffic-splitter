'use strict'

const { expect } = require('chai')

const constants = require('../../lib/constants')

describe('Constants', function () {
  it('should export an object with specific keys', function () {
    expect(constants).to.be.an('object')
      .and.to.have.all.keys(['STATUS', 'SOCKETS_PROPERTIES'])
  })
})
