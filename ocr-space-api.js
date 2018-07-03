'use strict';

const request = require('request');
const util = require('util');

// Default options (see https://ocr.space/ocrapi#PostParameters)
const _defaultOcrSpaceUrl = 'https://api.ocr.space/parse/image';
const _base64ImagePattern = 'data:%s;base64,%s';
const _defaultImageType = 'image/png';
const _defaultLanguage = 'eng';
//const _isOverlayRequired = false;

/**
 * Sends a request to OCR.SPACE and return the result.
 * 
 * @param {object} data representing an image containing text
 * @param {object} options object with the options
 * @throws {string} error
 */
var _sendImageDataToOcrSpace = function(data, options) {
    return new Promise(function(resolve, reject) { 
        try {
            
            if (!options || !options.apikey) {
                reject("API key required");
            }

            // Initialize options, to avoid errors.
            if (!options) {
                options = {};
            }

            const formOptions = {
                    language: options.language ? options.language : _defaultLanguage,
                    apikey: options.apikey,
                    isOverlayRequired: options.isOverlayRequired ? options.isOverlayRequired : false
                };
                
            formOptions.Base64Image = util.format(
                _base64ImagePattern, 
                (options.imageFormat) ? options.imageFormat : _defaultImageType, 
                new Buffer(data, 'binary').toString('base64'));

            const uri = {
                method: 'post',
                url: _defaultOcrSpaceUrl, 
                form: formOptions,
                headers: {  
                    'content-type': 'application/json',
                    //'Content-Type': 'application/x-www-form-urlencoded'
                }
                ,json: true
            };

            request(uri, function (error, response, ocrParsedResult) {  
                if (error) {
                    reject(error);
                } else {

                    //Get the parsed results, exit code and error message and details
                    var parsedResults = ocrParsedResult["ParsedResults"];
                    //var ocrExitCode = ocrParsedResult["OCRExitCode"];
                    //var isErroredOnProcessing = ocrParsedResult["IsErroredOnProcessing"];
                    //var errorMessage = ocrParsedResult["ErrorMessage"];
                    //var errorDetails = ocrParsedResult["ErrorDetails"];
                    //var processingTimeInMilliseconds = ocrParsedResult["ProcessingTimeInMilliseconds"];

                    if (parsedResults) {
                        var pageText = '';

                        parsedResults.forEach(function(value) {
                            var exitCode = value["FileParseExitCode"];
                            var parsedText = value["ParsedText"];
                            //var errorMessage = responseBody["ParsedTextFileName"];
                            //var errorDetails = responseBody["ErrorDetails"];

                            //var textOverlay = responseBody["TextOverlay"];
                            
                            switch (+exitCode) {
                                case 1:
                                    pageText = parsedText;
                                    break;
                                case 0:
                                case -10:
                                case -20:
                                case -30:
                                case -99:
                                default:
                                    pageText += "Error: " + errorMessage;
                                    break;
                            }
                            
                        }, this);

                        const result = {
                            parsedText: pageText,
                            parsedWords: pageText.replace(/[^0-9a-z \u0080-\uFFFF]/gi,'').replace(/\s{2,}/g,' ').trim().split(' '),
                            //parsedWords: pageText.replace(/[^0-9a-z ]/gi,'').split(' '),
                            ocrParsedResult: ocrParsedResult
                        }

                        resolve(result);
                    } else {
                        reject(ocrParsedResult);
                    }
                }
            });             
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Send an image data to parse to TEXT with the OCR.SPACE.API
 * @example
 * 
 *  Object {options}
 *
 *      { 
 *        apikey:            '<YOUR_API_KEY_HERE>',
 *        language:          'eng',
 *        isOverlayRequired: true,
 *        url:               'https://api.ocr.space/parse/image',
 *        imageFormat:       'image/png'
 *      }
 * 
 * @param {object} data representing an image containing text
 * @param {object} options object with the options
 * @throws {string} error
 */
exports.parseImageData = function(data, options) {
    return _sendImageDataToOcrSpace(data, options);
}

function test() {
    exports.parseImageData(require('fs').readFileSync(__dirname + 
        '/' + '750px-Blocksatz-Beispiel_deutsch,_German_text_sample_with_fully_justified_text.svg.png'))
    .then(result => console.log(result.parsedWords))
    .catch(error => console.error('ERROR: ' + error));
}
  
//test();
