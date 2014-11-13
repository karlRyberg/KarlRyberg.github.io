/// <reference path="NE.Constants.js" />
/// <reference path="NE.Navigation.js" />
/// <reference path="NE.UI.js" />

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

NE.EventHandlers = (function () {

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

        WindowResize: function () {
            NE.UI.ResizeScrollContainer();
            NE.UI.ScrollToPage(true);
        },

        NavBackBtnClick: function (i_item) {
            NE.Navigation.Previous();
            i_item.blur();
        },

        NavForwardBtnClick: function (i_item) {
            NE.Navigation.Next();
            i_item.blur();
        },

        Navigation: function (e) {

            NE.UI.SetNavigationButtons();
            NE.UI.ResizeScrollContainer();
            NE.UI.ScrollToPage();

        },


        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

