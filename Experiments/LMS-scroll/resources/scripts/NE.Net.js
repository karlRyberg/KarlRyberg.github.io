/// <reference path="libraries/masala-ux/dist/js/jquery.min.js" />

/////////////////////////////////////////////////////////////////////
//
//  TYPE: 
//  NAME: 
//  NAMESPACE: 
//  
//  SUMMARY
//      
//  
//  PUBLIC FIELDS  
//      
//
//  PUBLIC FUNCTIONS
//      
//
//  DEPENDENCIES
//      
//
//////////////////////////////////////////////////////////////////////

// Ensure that the LOUISE namespace is avaiable
if (NE === null || NE === undefined) { var NE = {}; }

NE.Net = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _loadedFiles = {};

    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {



    })();

    //////////////////////
    //
    //  Private functions 
    //
    /////////////////////

    function _getFile(i_file, i_callback) {
        $.get(i_file)
            .done(function (i_data) {
                if (i_callback) i_callback(i_data);
            })
            .fail(function (ida) {
                console.log(ida);
                if (i_callback) i_callback("failed to load " + i_file);
            });
    }

    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    return {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////

        LoadTxtFile: function (i_file, i_callback) {
            _getFile(i_file, i_callback);
        },

        LoadJsonFile: function (i_file, i_callback) {
            _getFile(i_file, i_callback);
        },

        AddScriptFile: function (i_file) {
            if (_loadedFiles[i_file]) return;

            var tag = document.createElement("script");
            tag.type = "text/javascript";
            tag.src = i_file;
            $("body").append(tag);

            _loadedFiles[i_file] = true;
        },

        AddCssFile: function (i_file) {
            if (_loadedFiles[i_file]) return;

            var tag = document.createElement("link");
            tag.rel = "stylesheet";
            tag.href = i_file;
            $("head").append(tag);

            _loadedFiles[i_file] = true;
        },

        GetExtension: function(i_file){
            if(i_file.indexOf('.') == -1) return '';
            return i_file.split('.').slice(-1).toString().toLowerCase();
        },

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

