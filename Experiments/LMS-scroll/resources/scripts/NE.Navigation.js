/// <reference path="NE.Events.js" />

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

NE.Navigation = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _onNavigationKey = '69133ac8-a5ec-4d67-a137-2916e629a0b1';
    var _eventOwnerKey = Math.random() + '' + Math.random();

    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {

        NE.Events.Register(_eventOwnerKey, _onNavigationKey);

    })();

    //////////////////////
    //
    //  Private functions 
    //
    /////////////////////

    function _onNavigation(e) {
        NE.Events.Execute(_eventOwnerKey, _onNavigationKey, e);
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

        ON_NAVIGATION: _onNavigationKey,
        CurrentChapterIndex: 0,
        CurrentPageIndex: 0,

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        ToPage: function (index) {
            if (index < 0 || index > 3) return;
            this.CurrentPageIndex = index;
            _onNavigation({
                index: this.CurrentPageIndex
            });
        },

        Next: function () {
            this.ToPage(this.CurrentPageIndex + 1);
        },

        Previous: function () {
            this.ToPage(this.CurrentPageIndex - 1);
        },

        eof: null
    };

})();



