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

    var _time;
    var _scrollExitTImer;
    var _negScroll = 0;
    var _navTimer;
    var _beenNegative = false;
    var _resizeTimer;

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
            $('.NE-page').on('sw-scrolled', function (e, scrollObj) {
                if (!NE.UI.AcceptScrollEvent) return;
                if (scrollObj.visibility > 0.8 && $(this).attr('id') != NE.Navigation.CurrentPageDiv().attr('id')) {

                    NE.Navigation.CurrentChapterIndex = parseInt($(this).data('chapter'), 10);
                    NE.Navigation.CurrentPageIndex = parseInt($(this).data('index'), 10);

                    NE.Navigation.ToChapter(NE.Navigation.CurrentChapterIndex);
                    NE.Navigation.ToPage(NE.Navigation.CurrentPageIndex);

                    console.log('Chapter: ' + NE.Navigation.CurrentChapterIndex + ' Page:' + NE.Navigation.CurrentPageIndex);
                    NE.UI.SetNavigationButtons();
                }

            });;

            $('.NE-page').ScrollWatch({
                axis: 'y',
                prioritize: 'max',//'partofviewport'//'partofobject'
                swWindow: '#' + NE.Constants.MAIN_CONTENT_CONTAINER_ID,
                swDocument: '#' + NE.Constants.SCROLL_CONTAINER_ID
            });
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

            NE.Navigation.CurrentPageDiv(0, -1).find('.NE-hidden-visited').slideUp(300, function () {
                $(this).addClass('hidden');
            });

            NE.UI.SwitchTopMenu();

            NE.UI.SetNavigationButtons();
          //  NE.UI.RevealPage();

        },

        ChapterLinkCLick: function (i_item, e) {
            if (i_item.hasClass('disable')) return;

            var chapterIndex = parseInt(i_item.data('chapter'), 10);
            NE.Navigation.ToChapter(chapterIndex);
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

