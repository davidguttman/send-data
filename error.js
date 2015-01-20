'use strict';

var url = require('url');
var STATUS_CODES = require('http').STATUS_CODES;

var sendJson = require('./json.js');

module.exports = sendError;

function sendError(req, res, opts, callback) {
    var err = opts.body;
    var logger = opts.logger;
    var statsd = opts.statsd;

    var errOpts = {
        verbose: opts.verbose || false,
        bodyStatusCode: opts.bodyStatusCode,
        additionalParams: opts.additionalParams
    };

    var statsPrefix = opts.statsPrefix || 'clients.send-data';
    var parsedUrl = url.parse(req.url);
    var statsdKey = statsPrefix + '.error-handler.' +
        parsedUrl.pathname;

    var isExpected = err.expected ||
        (err.statusCode >= 400 && err.statusCode <= 499);

    if (!isExpected) {
        if (logger) {
            logger.error('unexpected error', err);
        }
        if (statsd) {
            statsd.increment(statsdKey + '.unexpected');
        }
    } else if (statsd) {
        statsd.increment(statsdKey + '.expected');
    }
    writeError(req, res, err, errOpts);
}

function writeError(req, res, err, opts) {
    var statusCode = err.statusCode || 500;
    var body = {
        message: err.message || STATUS_CODES[statusCode] ||
            STATUS_CODES[500]
    };

    if (typeof err.type === 'string') {
        body.type = err.type;
    }

    if (Array.isArray(err.messages)) {
        body.messages = err.messages;
    }

    // Toggle sending status code in the body
    if (opts.bodyStatusCode !== false) {
        body.statusCode = statusCode;
    }

    if (opts.verbose) {
        body.stack = err.stack;
        body.expected = err.expected;
        body.debug = err.debug;
    }

    // Append additional params
    if (opts.additionalParams) {
        opts.additionalParams.forEach(function appendKey(k) {
            body[k] = err[k];
        });
    }

    sendJson(req, res, {
        statusCode: statusCode,
        body: body
    });
}
