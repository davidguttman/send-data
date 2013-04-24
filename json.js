var send = require("./index")

module.exports = sendJson

/*  sendJson := (HttpRequest, HttpResponse, Value | {
        body: Value,
        headers?: Object<String, String>,
        statusCode?: Number
    })
*/
function sendJson(req, res, value) {
    if (!value.statusCode && !value.headers) {
        value = { body: value }
    }

    value.headers = value.headers || {}
    value.body = JSON.stringify(value.body)
    value.headers["Content-Type"] = "application/json"

    send(req, res, value)
}