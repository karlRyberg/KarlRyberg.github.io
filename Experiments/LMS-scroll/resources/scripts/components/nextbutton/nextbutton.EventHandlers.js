/// <reference path="../../NE.Navigation.js" />

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
if (NE.Plugin.nextbutton === null || NE.Plugin.nextbutton === undefined) { NE.Plugin.nextbutton = {}; }

NE.Plugin.nextbutton.EventHandlers = (function () {

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



        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////


        OnClick: function (sender, e) {

            var that = sender;

            that.addClass('active');
            var parentToHide = that.parents('.NE-hidden-visited').first();
            if (parentToHide.length > 0) {
                parentToHide.slideUp(300, function () {
                    parentToHide.addClass('hidden');
                });
            }

            NE.Navigation.Next();

            e.preventDefault();
            return false;

        },

        eof: null
    };

})();

