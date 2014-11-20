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
if (NE.Plugin.topmenu === null || NE.Plugin.topmenu === undefined) { NE.Plugin.topmenu = {}; }

NE.Plugin.topmenu.EventHandlers = (function () {

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

        WindowResize: function(){
            var chapterMenuDiv = $('#NE-top-chapter-navigation');
            if (chapterMenuDiv.hasClass('open')) {
                $('.NE-chapter-label').click();
            }
        },

        ChapterLabelClick: function (i_item) {

            if (!i_item.is(':visible')) return;

            var chapterMenuDiv = $('#NE-top-chapter-navigation');
            var menuHeight = 0;

            if (!chapterMenuDiv.hasClass('open')) {

                chapterMenuDiv.find('.NE-top-chapterlinks').each(function () {
                    var itemHeight = $(this).outerHeight();
                    menuHeight = itemHeight > menuHeight ? itemHeight : menuHeight;
                });

                $('#NE-top-backdrop').fadeTo(0, 0).fadeTo(300, 0.65);
                i_item.parent().addClass('active');

            }
            else {

                $('#NE-top-backdrop').fadeTo(300, 0, function () {
                    $(this).hide();
                    i_item.parent().removeClass('active');
                });

            }

            chapterMenuDiv.css('height', menuHeight + 'px').toggleClass('open');
        },


        ChapterLinkClick: function (i_item) {
            if (i_item.hasClass('disable')) return;
            var chapterIndex = parseInt(i_item.data('chapter'), 10);
            NE.Navigation.ToChapter(chapterIndex);
            $('.NE-chapter-label').click();
        },

        OverlayClick: function () {
            $('.NE-chapter-label').click();
        },

        UpdateChapterMenu: function () {
            var menuIitem = $('#NE-top-chapterlink-' + NE.Navigation.CurrentChapterIndex);
            $('.NE-top-chapterlink').removeClass('disable');
            menuIitem.addClass('disable');
            if (menuIitem.length) $('#NE-chapter-label-big').html(menuIitem.html() + NE.Constants.HEADER_CHAPTER_NAV_ICON)
        },

        eof: null
    };

})();

