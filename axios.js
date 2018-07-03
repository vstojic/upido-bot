'use strict';

require('dotenv').config();

const axios = require('axios');
//const fs = require('fs');
//const pathDirName = require('path').dirname();
const faker = require('faker');
//const ocrSpaceApi = require('./ocr-space-api');
const ocrSpaceApi = require('./ocrSpaceApi');

const UPIDO_BOT_URL   = process.env.UPIDO_BOT_URL;
const UPIDO_BOT_TOKEN = process.env.UPIDO_BOT_TOKEN;

//class Axios {
//    constructor() {
//        this.fileUrl = null;
//    }

var exports = module.exports = {

sendMarkdownMessage : function 
sendMarkdownMessage(req, res, chat_id, text) {

  axios.post(UPIDO_BOT_URL + '/sendMessage', {
    chat_id              : chat_id,
    parse_mode           : 'Markdown',
    text                 : text,
    disable_notification : true
    //,reply_markup         : { inline_keyboard : [ 
    //  [ { text : 'Display Avatar', url : obj.shopper.avatar },
    //    { text : 'Display Image', url : obj.shopper.image } ] 
    //  ] }
    }).then(response => {
        //console.log(JSON.stringify( { response : response } ));
        res.end('ok');
    }).catch(err => {
        console.error(err);
        res.end('ERROR: ' + err);
    });
},
sendMessageReplyMarkup : function 
sendMessageReplyMarkup(req, res, chat_id, text, reply_markup) {

  axios.post(UPIDO_BOT_URL + '/sendMessage', {
    chat_id              : chat_id,
  //parse_mode           : 'Markdown',
    text                 : text,
    disable_notification : true,
    reply_markup         : reply_markup
    //{ inline_keyboard : [ 
    //  [ { text : 'Display Avatar', callback_data : '' },
    //    { text : 'Display Image',  callback_data : '' } ] 
    //  ] }
    }).then(response => {
        //console.log(JSON.stringify( { response : response } ));
        res.end('ok');
    }).catch(err => {
        console.error(err);
        res.end('ERROR: ' + err);
    });
},
buildFileUrl : function 
buildFileUrl(fileId, callback = (url, err) => { console.log((url) ? url : err) }) {
    axios.get(UPIDO_BOT_URL + '/getFile', { params : { file_id: fileId } } )
        .then(response => callback('https://api.telegram.org/file/bot' + UPIDO_BOT_TOKEN + '/' 
                + response.data.result.file_path, null)
        ).catch(err => callback(null, err));
},
fetchFileAsArrayBuffer : function 
fetchFileAsArrayBuffer(fileId, callback = (data, err)) {
    exports.buildFileUrl(fileId,
        (url, err) => axios({
                method: 'get',
                url: url,
                responseType: 'arraybuffer'
            }).then(response => {
                callback(response.data, null);
            }).catch(err => callback(null, err))
    );
},
parseImage : function 
parseImage(req, callback = (words, err)) {

    let {message} = req.body;

    if (message && message.document) {
        exports.fetchFileAsArrayBuffer(message.document.file_id,
            (data, err) => ocrSpaceApi.parseImageData(data
                ).then(result => {
                    callback(result.parsedWords, null);
                }).catch(error => callback(null, err))
        );
    } else if (message && message.photo) {
        exports.fetchFileAsArrayBuffer(message.photo[message.photo.length - 1].file_id, 
            (data, err) => ocrSpaceApi.parseImageData(data
                ).then(result => {
                    callback(result.parsedWords, null);
                }).catch(error => callback(null, err))
        );
    } else {
        callback = (null, null);
    }

}
};

//}
//module.exports = new Axios();

function test() {
    exports.buildFileUrl('BQADBAADFQUAAvFkuFGulu3cgX9_ugI',
        url => { console.log(url); }
    );
}

//test();