'use strict'

const EventEmitter = require('events')
const { expect } = require('chai')
const { spy } = require('sinon')

const StatfulTrafficSplitter = require('../../')
const { SOCKETS_PROPERTIES, STATUS: { SUCCESS, ERROR } } = require('../../lib/constants')

const statful = {
  counter: () => {},
  timer: () => {},
  gauge: () => {}
}

const spies = {
  counter: spy(statful, 'counter'),
  timer: spy(statful, 'timer'),
  gauge: spy(statful, 'gauge')
}

const splitter = {
  events: new EventEmitter()
}

const host = 'host'
const name = 'fake'
const type = 'serve'
const method = 'GET'
const duration = 1000
const statusCode = 200
const error = new Error()
const contentLength = 123
const selectedUpstream = name
const upstream = {
  name,
  criteria: {},
  upstream: { type, options: { host } }
}

const req = { method, upstream }
const res = { statusCode }

const upstreamReq = {}
const upstreamRes = {
  contentLength: () => contentLength
}

/* eslint-disable no-unused-expressions */
describe('StatfulTrafficSplitter', function () {
  before(function () {
    StatfulTrafficSplitter(statful, splitter)
  })

  it('should be a function', function () {
    expect(StatfulTrafficSplitter).to.be.a('function')
  })

  it('should return nothing', function () {
    const fakeStatful = {}
    const fakeSplitter = { events: new EventEmitter() }

    expect(StatfulTrafficSplitter(fakeStatful, fakeSplitter)).to.be.undefined
  })

  it('should send counter metrics when certain events are emitted', function () {
    splitter.events.emit('applicationStart')
    splitter.events.emit('serverStart')
    splitter.events.emit('noUpstreamFound', req)
    splitter.events.emit('upstreamException', error, upstream)

    expect(spies.counter.callCount).to.equal(4)

    expect(spies.counter.calledWithExactly('application_start', 1)).to.be.true
    expect(spies.counter.calledWithExactly('server_start', 1)).to.be.true
    expect(spies.counter.calledWithExactly('no_upstream_found', 1)).to.be.true
    expect(spies.counter.calledWithExactly('upstream_exception', 1, { tags: { name, type } })).to.be.true
  })

  it('should send timer metrics when certain events are emitted', function () {
    splitter.events.emit('rulesProcessing', duration, selectedUpstream)
    splitter.events.emit('resFinish', req, res, duration)

    splitter.events.emit('serving', statusCode, upstream, duration, host, upstreamReq, upstreamRes)
    splitter.events.emit('servingError', error, upstream, duration, upstreamReq)
    splitter.events.emit('servingFile', upstream, duration)
    splitter.events.emit('servingFileError', error, upstream, duration)
    splitter.events.emit('redirecting', statusCode, upstream, duration)

    expect(spies.timer.callCount).to.equal(7)

    expect(spies.timer.calledWithExactly('rules_processing', duration, { tags: { selectedUpstream } })).to.be.true
    expect(spies.timer.calledWithExactly('response', duration, { tags: { method, statusCode, name } })).to.be.true

    const upstreamTags = { name, type, host }
    const getFinalOptions = (customTags) => ({ tags: Object.assign({}, upstreamTags, customTags) })

    expect(spies.timer.calledWithExactly('upstream', duration, getFinalOptions({ statusCode, contentLength, status: SUCCESS }))).to.be.true
    expect(spies.timer.calledWithExactly('upstream', duration, getFinalOptions({ status: ERROR }))).to.be.true // servingError and servingFileError
    expect(spies.timer.calledWithExactly('upstream', duration, getFinalOptions({ status: SUCCESS }))).to.be.true
    expect(spies.timer.calledWithExactly('upstream', duration, getFinalOptions({ statusCode, status: SUCCESS }))).to.be.true
  })

  it('should send gauge metrics when certain events are emitted', function () {
    const httpValue = 10
    const httpsValue = 20

    const getAgentStatusWithStartValue = value =>
      SOCKETS_PROPERTIES.reduce((result, property, i) =>
        Object.assign(result, { [property]: value + i + 1 }), { requestCount: value })

    const httpAgentStatus = getAgentStatusWithStartValue(httpValue)
    const httpsAgentStatus = getAgentStatusWithStartValue(httpsValue)

    splitter.events.emit('httpSocketMetrics', httpAgentStatus)
    splitter.events.emit('httpsSocketMetrics', httpsAgentStatus)

    expect(spies.gauge.callCount).to.equal(12)

    expect(spies.gauge.calledWith('request', httpValue)).to.be.true
    expect(spies.gauge.calledWith('request', httpsValue)).to.be.true

    SOCKETS_PROPERTIES.forEach((property, i) => {
      expect(spies.gauge.calledWith('sockets', httpValue + i + 1, { tags: { type: 'http', property } })).to.be.true
      expect(spies.gauge.calledWith('sockets', httpsValue + i + 1, { tags: { type: 'https', property } })).to.be.true
    })
  })
})
