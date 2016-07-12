/*
 *   File:       index.js (pdffiller)
 *   Project:    PDF Filler
 *   Date:       May 2015.
 *
 *   Description: This PDF filler module takes a data set and creates a filled out
 *                PDF file with the form fields populated.
 */
(function() {
    var child_process = require('child_process'),
        exec = require('child_process').exec,
        _ = require('lodash'),
        fs = require('fs');

    var pdffiller = {

        mapForm2PDF: function(formFields, convMap) {
            var tmpFDFData = this.convFieldJson2FDF(formFields);
            tmpFDFData = _.mapKeys(tmpFDFData, function(value, key) {
                try {
                    convMap[key];
                } catch (err) {

                    return key;
                }
                return convMap[key];
            });

            return tmpFDFData;
        },

        convFieldJson2FDF: function(fieldJson) {
            var _keys = _.pluck(fieldJson, 'title'),
                _values = _.pluck(fieldJson, 'fieldValue');

            _values = _.map(_values, function(val) {
                if (val === true) {
                    return 'Yes';
                } else if (val === false) {
                    return 'Off';
                }
                return val;
            });

            var jsonObj = _.zipObject(_keys, _values);

            return jsonObj;
        },

        generateFieldJson: function(sourceFile, nameRegex, callback) {
            var regName = /FieldName: ([^\n]*)/,
                regOptionsAll = /FieldStateOption: ([A-Za-z\t .]+)/g,
                regOptions = /FieldStateOption: ([A-Za-z\t .]+)/,
                regType = /FieldType: ([A-Za-z\t .]+)/,
                regFlags = /FieldFlags: ([0-9\t .]+)/,
                fieldArray = [],
                currField = {};

            if (nameRegex !== null && (typeof nameRegex) == 'object') regName = nameRegex;

            exec("pdftk " + sourceFile + " dump_data_fields_utf8 ", function(error, stdout, stderr) {
                if (error) {
                    console.log('exec error: ' + error);
                    return callback(error, null);
                }

                fields = stdout.toString().split("---").slice(1);
                fields.forEach(function(field) {

                    currField = {};

                    currField['title'] = field.match(regName)[1].trim() || '';

                    if (field.match(regType)) {
                        currField['fieldType'] = field.match(regType)[1].trim() || '';
                    } else {
                        currField['fieldType'] = '';
                    }

                    if (field.match(regFlags)) {
                        currField['fieldFlags'] = field.match(regFlags)[1].trim() || '';
                    } else {
                        currField['fieldFlags'] = '';
                    }

                    if (field.match(regOptionsAll)) {
                        var all_opts = field.match(regOptionsAll);
                        var options = [];
                        all_opts.forEach(function(value){
                            options.push(value.match(regOptions)[1].trim() || '');
                        });
                        currField['fieldOptions'] = options;
                    } else {
                    }

                    currField['fieldValue'] = '';

                    fieldArray.push(currField);
                });

                return callback(null, fieldArray);
            });
        },

        generateFDFTemplate: function(sourceFile, nameRegex, callback) {
            this.generateFieldJson(sourceFile, nameRegex, function(err, _form_fields) {
                if (err) {
                    console.log('exec error: ' + err);
                    return callback(err, null);
                }
                var _keys = _.pluck(_form_fields, 'title'),
                    _values = _.pluck(_form_fields, 'fieldValue'),
                    jsonObj = _.zipObject(_keys, _values);

                return callback(null, jsonObj);

            });
        }
    };

    module.exports = pdffiller;

}())
