/// <reference path="NE.Events.js" />
/// <reference path="NE.Constants.js" />

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

        CurrentChapterDiv: function (i_chapterInc) {
            i_chapterInc = i_chapterInc || 0;
            return $('#' + NE.Constants.CHAPTER_ID_PREFIX + (this.CurrentChapterIndex + i_chapterInc));
        },

        CurrentPageDiv: function (i_chapterInc, i_pageInc) {
            i_chapterInc = i_chapterInc || 0;
            i_pageInc = i_pageInc || 0;
            return $('#' + NE.Constants.PAGE_ID_PREFIX + (this.CurrentChapterIndex + i_chapterInc) + '-' + (this.CurrentPageIndex + i_pageInc));
        },

        IsAtLast: function () {
            var isLastChapter = NE.Navigation.CurrentChapterIndex == NE.CourseTree.chapters.length - 1;
            var isLastPage = NE.Navigation.CurrentPageIndex == NE.CourseTree.chapters[NE.Navigation.CurrentChapterIndex].pages.length - 1;
            return isLastChapter && isLastPage;
        },

        ToChapter: function (index, preventNav) {
            if (index < 0 || index >= NE.CourseTree.chapters.length) return;
            this.CurrentChapterIndex = index;
            if (!preventNav) this.ToPage(0);
        },

        ToPage: function (index, chapter) {
            if (chapter) this.ToChapter(chapter, true);
            if (index < 0 || index >= NE.CourseTree.chapters[this.CurrentChapterIndex].pages.length) return;
            this.CurrentPageIndex = index;
            _onNavigation({
                page: this.CurrentPageIndex,
                chapter: this.CurrentChapterIndex
            });
        },

        Next: function () {
            var page = this.CurrentPageIndex + 1;
            if (page >= NE.CourseTree.chapters[this.CurrentChapterIndex].pages.length) {
                if (this.CurrentChapterIndex >= NE.CourseTree.chapters.length - 1) return;
                this.CurrentChapterIndex += 1;
                page = 0;
            }
            this.ToPage(page);
        },

        Previous: function () {
            var page = this.CurrentPageIndex - 1;
            if (page < 0) {
                if (this.CurrentChapterIndex < 1) return;
                this.CurrentChapterIndex -= 1;
                page = NE.CourseTree.chapters[this.CurrentChapterIndex].pages.length - 1;
            }
            this.ToPage(page);
        },

        eof: null
    };

})();



