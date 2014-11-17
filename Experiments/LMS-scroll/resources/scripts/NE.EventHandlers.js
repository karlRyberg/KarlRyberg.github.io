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

            NE.UI.ResizeScrollContainer();
            NE.UI.SetNavigationButtons();
            NE.UI.ScrollToPage();

        },

        KeyUp: function (e) {
            var k = e.which;
            if (k == 13 || k == 32 || k == 34 || k == 39) {
                NE.Navigation.Next();
            }
            else if (k == 8 || k == 33 || k == 37) {
                NE.Navigation.Previous();
            }
            e.preventDefault();
            return false;
        },

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

