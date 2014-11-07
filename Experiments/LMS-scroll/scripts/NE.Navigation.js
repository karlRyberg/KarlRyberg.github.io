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

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        ToChapter: function (index) {
            if (index < 0 || index > 3) return;
            this.CurrentChapterIndex = index;
            _onNavigation({
                index: this.CurrentChapterIndex
            });
        },

        Next: function () {
            this.ToChapter(this.CurrentChapterIndex + 1);
        },

        Previous: function () {
            this.ToChapter(this.CurrentChapterIndex - 1);
        },

        eof: null
    };

})();



