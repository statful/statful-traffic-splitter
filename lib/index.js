'use strict'

const { filterUndefinedProperties } = require('./utils')
const { SOCKETS_PROPERTIES, STATUS: { SUCCESS, ERROR } } = require('./constants')

module.exports = function StatfulTrafficSplitter (statful, splitter) {
  const { events } = splitter

  events.on('applicationStart', () => {
    statful.counter('application_start', 1)
  })

  events.on('serverStart', () => {
    statful.counter('server_start', 1)
  })

  events.on('rulesProcessing', (duration, selectedUpstream) => {
    statful.timer('rules_processing', duration, { tags: { selectedUpstream } })
  })

  events.on('noUpstreamFound', (req) => {
    statful.counter('no_upstream_found', 1)
  })

  events.on('resFinish', (req, res, duration) => {
    const { method, upstream } = req
    const { statusCode } = res
    const { name } = getUpstreamTags(upstream)

    const tags = { method, statusCode, name }

    statful.timer('response', duration, { tags })
  })

  const sendUpstreamMetric = (upstream, duration, customTags) => {
    const upstreamTags = getUpstreamTags(upstream)
    const tags = Object.assign({}, upstreamTags, customTags)

    statful.timer('upstream', duration, { tags })
  }

  // this event handles both serve and serveSecure upstream types
  events.on('serving', (statusCode, upstream, duration, host, upstreamReq, upstreamRes) => {
    const contentLength = upstreamRes.contentLength()
    const tags = getUpstreamTags(upstream)
    statful.counter('content_length', contentLength, { tags })

    sendUpstreamMetric(upstream, duration, { statusCode, status: SUCCESS })
  })

  events.on('servingError', (e, upstream, duration, upstreamReq) => {
    sendUpstreamMetric(upstream, duration, { status: ERROR })
  })

  events.on('servingFile', (upstream, duration) => {
    sendUpstreamMetric(upstream, duration, { status: SUCCESS })
  })

  events.on('servingFileError', (e, upstream, duration) => {
    sendUpstreamMetric(upstream, duration, { status: ERROR })
  })

  events.on('redirecting', (statusCode, upstream, duration) => {
    sendUpstreamMetric(upstream, duration, { statusCode, status: SUCCESS })
  })

  events.on('upstreamException', (e, upstream) => {
    const { name, type } = getUpstreamTags(upstream)

    statful.counter('upstream_exception', 1, { tags: { name, type } })
  })

  const emitAgentStatusMetrics = (agentStatus, type) => {
    statful.gauge('request', agentStatus.requestCount)

    SOCKETS_PROPERTIES.forEach(property => {
      const tags = { type, property }

      statful.gauge('sockets', agentStatus[property], { tags })
    })
  }

  events.on('httpSocketMetrics', (agentStatus) => {
    emitAgentStatusMetrics(agentStatus, 'http')
  })

  events.on('httpsSocketMetrics', (agentStatus) => {
    emitAgentStatusMetrics(agentStatus, 'https')
  })
}

function getUpstreamTags (upstream) {
  const { name, upstream: { type, options: { host, file } } } = upstream

  return filterUndefinedProperties({ name, type, host, file })
}
