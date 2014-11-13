/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />

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

NE.Plugin.chapter = (function () {

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

            NE.Plugin.ApplyTemplate(i_initObj.name, function (data) {

                i_initObj.node.replaceWith(data);
                console.log(i_initObj.settings.index)
                $('.NE-page').last().attr('id', 'NE-page-' + i_initObj.settings.index);

            });

        },

        eof: null
    };

})();

