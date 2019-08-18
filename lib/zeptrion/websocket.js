'use strict';

const webso = require('ws');

var websockets = {}
/*
{
    id = {
        addr:'192.168.86.11',
        port:80,
        callback: callback
        ws: ws
    }
}
*/

module.exports = class Websocket{
    constructor() {}

    static add_websocket(channel_id, channel_addr, channel_port, callback){
        if(channel_id in websockets){
            Websocket.stop_websocket(channel_id)
        }
        websockets[channel_id] = {
            addr: channel_addr,
            port: channel_port,
            callback: callback
        }
        let ws = new webso("ws://" + channel_addr + ':' + channel_port);
        websockets[channel_id].ws = ws
        ws.on('open', function open(e) {
            log('open websocket: ' + this.url,"debug")
        });
        ws.on('close', function close() {
            log('disconnected: ' + this.url,"debug");
        });
        ws.on('message', function incoming(data) {
            log('change: ' + this.url,"debug");
            const ip = this.url.substring(5)
            Object.keys(websockets).map(function(key, index) {
                if(websockets[key].addr + ':' + websockets[key].port === ip){
                    callback(key, data)
                }
            });
        });
    }

    static stop_websocket(channel_id){
        log('stop_websocket: ' + this.url,"debug");
        if(channel_id in websockets){
            websockets[channel_id].ws.close()
            websockets[channel_id].ws.terminate()
            delete websockets[channel_id]
        }
    }
}
