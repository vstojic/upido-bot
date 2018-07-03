'use strict';

require('dotenv').config(); // load .env into process.env

const axios = require('axios');

const ocr   = require('./ocr-space-api');

const UPIDO_BOT_URL           = process.env.UPIDO_BOT_URL;
const UPIDO_BOT_TOKEN         = process.env.UPIDO_BOT_TOKEN;
const UPIDO_OCR_SPACE_API_KEY = process.env.UPIDO_OCR_SPACE_API_KEY;

const _ocr_space_options = { // See https://ocr.space/ocrapi#PostParameters
    apikey: UPIDO_OCR_SPACE_API_KEY //vladica.stojic@upido.it
};

//class Axios {
//    constructor() {
//        this.fileUrl = null;
//    }

var exports = module.exports = {

postMarkdownMessage : function 
postMarkdownMessage(chat_id, text) {

  return axios.post(UPIDO_BOT_URL + '/sendMessage', {
    chat_id              : chat_id,
    parse_mode           : 'Markdown',
    text                 : text,
    disable_notification : true
    //,reply_markup         : { inline_keyboard : [ 
    //  [ { text : 'Display Avatar', url : obj.shopper.avatar },
    //    { text : 'Display Image', url : obj.shopper.image } ] 
    //  ] }
    });
},
sendMarkdownMessage : function 
sendMarkdownMessage(req, res, chat_id, text) {

  this.postMarkdownMessage(chat_id, text)
    .then(response => {
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

    const {message} = req.body;

    if (message && message.document) {
        exports.fetchFileAsArrayBuffer(message.document.file_id,
            (data, err) => ocr.parseImageData(data, _ocr_space_options
                ).then(result => {
                    callback(result.parsedWords, null);
                }).catch(error => callback(null, err))
        );
    } else if (message && message.photo) {
        exports.fetchFileAsArrayBuffer(message.photo[message.photo.length - 1].file_id, 
            (data, err) => ocr.parseImageData(data, _ocr_space_options
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
