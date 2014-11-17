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

        var fileReq = $.get(i_file)
            .done(function (i_data) {
                if (i_callback) i_callback(i_data);
            })
            .fail(function () {
                if (i_callback) i_callback("failed to load " + i_file);
            })

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

        LoadJsonFile: function (i_file) {

        },

        AddScriptFile: function (i_file) {
            var tag = document.createElement("script");
            tag.type = "text/javascript";
            tag.src = i_file;
            $("body").append(tag);
        },

        AddCssFile: function (i_file) {
            var tag = document.createElement("link");
            tag.rel = "stylesheet";
            tag.href = i_file;
            $("head").append(tag);
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

