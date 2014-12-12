/// <reference path="NE.Constants.js" />
/// <reference path="NE.Navigation.js" />
/// <reference path="NE.UI.js" />
/// <reference path=//utb.ne.se/neutbshared/js/NE.LMS.js" />

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

    var _time;
    var _scrollExitTImer;
    var _negScroll = 0;
    var _navTimer;
    var _beenNegative = false;
    var _resizeTimer;
    var _initBookmark = null;

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
            NE.UI.AcceptScrollEvent = false;

            $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).css('visibility', 'hidden');
            clearTimeout(_resizeTimer);
            _resizeTimer = setTimeout(function () {
                $('#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID).css('visibility', 'visible');
                NE.UI.ScrollToPage(true);
            }, 500);
        },

        ChaptersLoaded: function () {

            NE.SCORM.RegisterSections();

            NE.UI.PreHide();
            NE.UI.Setup();

            NE.SCORM.Unlockhistory();

            NE.SCORM.NavigateToBookmark();


            $('.NE-page').on('sw-scrolled', function (e, scrollObj) {
                NE.EventHandlers.OnPageScroll($(this), scrollObj);
            });

            $('.NE-page').ScrollWatch({
                axis: 'y',
                prioritize: 'max',//'partofviewport'//'partofobject'
                swWindow: '#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID,
                swDocument: '#' + NE.Constants.SCROLL_CONTAINER_ID
            });

        },

        OnPageScroll: function (i_item, scrollObj) {

            if(!i_item.is(':visible')) return;
            
            var pageIndex = parseInt(i_item.data('index'), 10);
            var chapterIndex = parseInt(i_item.data('chapter'), 10);

            if (scrollObj.rect.bottom <= scrollObj.viewport.bottom && pageIndex == NE.CourseTree.chapters[chapterIndex].pages.length - 1) {
                var sectionID = NE.CourseTree.SCO_name + '_' + chapterIndex;
                if (NE.LMS.Sections.GetState(sectionID) != 'completed') NE.LMS.Sections.SetState(sectionID, 'completed');
                NE.LMS.Sections.SetState(sectionID, 'failed');
            }

            if (!NE.UI.AcceptScrollEvent) return;
      
            if (scrollObj.visibility > 0.8 && i_item.attr('id') != NE.Navigation.CurrentPageDiv().attr('id')) {

                NE.Navigation.CurrentChapterIndex = chapterIndex;
                NE.Navigation.CurrentPageIndex = pageIndex;

                NE.Navigation.ToPage(NE.Navigation.CurrentPageIndex, NE.Navigation.CurrentChapterIndex);

                NE.UI.SetNavigationButtons();

            }





        },

        NavBackBtnClick: function (i_item) {
            NE.Navigation.Previous();
            NE.UI.ScrollToPage();
            i_item.blur();
        },

        NavForwardBtnClick: function (i_item) {
            NE.Navigation.Next();
            NE.UI.ScrollToPage();
            i_item.blur();
        },

        Navigation: function (e) {

            NE.Navigation.CurrentPageDiv(0, -1).find('.NE-hidden-visited').slideUp(300, function () {
                $(this).addClass('hidden');
            });

            NE.UI.SwitchTopMenu();
            NE.UI.SetNavigationButtons();

            if (!_initBookmark) {
                NE.LMS.Bookmark.SetBookmark(NE.Navigation.CurrentPageDiv().attr('id'));
            }

        },

        ChapterLinkCLick: function (i_item, e) {
            if (i_item.hasClass('disable')) return;

            var chapterIndex = parseInt(i_item.data('chapter'), 10);
            NE.Navigation.ToChapter(chapterIndex);
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

