/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />

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
if (NE.Plugin === null || NE.Plugin === undefined) { NE.Plugin = {}; }

NE.Plugin.page = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _settings = {};

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

        Dependencies: [

        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function (i_initObj) {

            _settings = i_initObj.settings;

            NE.Plugin.ApplyTemplate(i_initObj.name, function (tmpData) {

                var newContent = $(tmpData);
                var pageDiv = newContent.first();
                i_initObj.node.replaceWith(newContent);

                NE.Net.LoadTxtFile(_settings.datafile, function (htmlData) {

                    $('#' + NE.Constants.PAGE_ID_PREFIX + _settings.chapterIndex + '-' + _settings.pageIndex).html(htmlData);

                });

            });

        },


        RenderPage: function (params) {

            var returnVal = '';

            returnVal += params[0].data.replace(/{pageID}/g, NE.Constants.PAGE_ID_PREFIX + _settings.chapterIndex + '-' + _settings.pageIndex);
            returnVal += '<hr style="border:2px solid #f2f2f2;"/>'

            return returnVal;
        },

        eof: null
    };

})();

