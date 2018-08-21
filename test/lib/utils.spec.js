'use strict'

const { expect } = require('chai')

const utils = require('../../lib/utils')

describe('Utils', function () {
  it('should export an object with specific keys', function () {
    expect(utils).to.be.an('object')
      .and.to.have.all.keys(['filterUndefinedProperties'])
  })

  describe('filterUndefinedProperties()', function () {
    it('should be a function', function () {
      expect(utils.filterUndefinedProperties).to.be.a('function')
    })

    it('should return an object without undefined properties', function () {
      const object = {
        a: 'a',
        b: undefined,
        c: {},
        d: undefined,
        e: true
      }

      const filteredObject = utils.filterUndefinedProperties(object)

      expect(filteredObject).to.not.equal(object)
      expect(filteredObject).to.be.an('object')
        .and.to.have.all.keys(['a', 'c', 'e'])
    })
  })
})
