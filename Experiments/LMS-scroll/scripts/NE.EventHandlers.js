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
            NE.UI.ScrollToChapter(true);
        },

        NavBackBtnClick: function (i_item) {
            NE.Navigation.Previous();
            i_item.blur();
        },

        NavForwardBtnClick: function (i_item) {
            NE.Navigation.Next();
            i_item.blur();
        },

        ChapterLabelClick: function (i_item) {
            var chapterMenuDiv = $('#NE-chapter-menu');
            var menuHeight = 0;
            if (!chapterMenuDiv.hasClass('open')) {
                chapterMenuDiv.find('li').each(function () {
                    menuHeight += i_item.outerHeight();
                });
            }
            i_item.parent().toggleClass('active');
            chapterMenuDiv.css('height', menuHeight + 'px').toggleClass('open');
        },

        ChapterLinkClick: function (i_item) {
            if (i_item.hasClass('disable')) return;

            var chapterIndex = parseInt(i_item.data('chapter'), 10);
            NE.Navigation.ToChapter(chapterIndex);

            if (i_item.hasClass('NE-chapter-menu-link-xs')) {
                $('#NE-chapter-label-xs').click();
            }
            else if (i_item.hasClass('NE-chapter-menu-link')) {
                $('#NE-chapter-label').click();
            }
        },

        Navigation: function (e) {

            NE.UI.SetNavigationButtons();
            NE.UI.ResizeScrollContainer();
            NE.UI.ScrollToChapter();
            NE.UI.UpdateChapterMenu();

        },


        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

