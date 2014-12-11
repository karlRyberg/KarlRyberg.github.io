/// <reference path="../../NE.Navigation.js" />
/// <reference path="../../NE.UI.js" />

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

    function _openChapterPanel(i_item) {

        var chapterMenuDiv = $('#NE-top-chapter-navigation');
        var menuHeight = 0;

        chapterMenuDiv.find('.NE-chapterlink-collection').each(function () {

            var itemHeight = $(this).outerHeight();

            if ($('#isXS').is(':visible')) {
                menuHeight += itemHeight;
            }
            else {
                menuHeight = itemHeight > menuHeight ? itemHeight : menuHeight;
            }

        });

        $('#NE-top-backdrop').fadeTo(0, 0).fadeTo(300, 0.65);
        i_item.parent().addClass('active');

        var max = parseInt(chapterMenuDiv.css('max-height'));
        var isScroll = 'hidden';
        if (max < menuHeight) {
            menuHeight = max;
            isScroll = 'auto';
        }

        chapterMenuDiv.css({
            'height': menuHeight + 'px',
            'overflow': isScroll
        }).toggleClass('open');

        NE.UI.ToggleBackNavButtons(false);
        NE.UI.ToggleForwardNavButtons(false);

    }

    function _closeChapterPanel(i_item) {
        $('#NE-top-backdrop').fadeTo(300, 0, function () {
            $(this).hide();
            i_item.parent().removeClass('active');
        });
        var chapterMenuDiv = $('#NE-top-chapter-navigation');
        chapterMenuDiv.css('height', '0px').toggleClass('open');
        NE.UI.ToggleBackNavButtons(true);
        NE.UI.ToggleForwardNavButtons(true);
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



        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        WindowResize: function () {
            if ($('#NE-top-chapter-navigation').hasClass('open')) {
                $('.NE-chapter-label').click();
            }
        },

        ChapterLabelClick: function (i_item) {
         
            if (!i_item.is(':visible')) return;
            alert('ChapterLabelClick: ' + i_item.attr('id'))
            var chapterMenuDiv = $('#NE-top-chapter-navigation');

            if (!chapterMenuDiv.hasClass('open')) {
                _openChapterPanel(i_item);

            }
            else {
                _closeChapterPanel(i_item);
            }

        },
        
        ChapterLinkClick: function (i_item) {
            if (i_item.hasClass('disable')) return;
            var chapterIndex = parseInt(i_item.data('chapter'), 10);
            NE.Navigation.ToChapter(chapterIndex);
            $('.NE-chapter-label').click();
        },

        OverlayClick: function () {
            alert('OverlayClick')
            $('.NE-chapter-label').click();
        },

        UpdateChapterMenu: function () {
            var menuIitem = $('.NE-chapterlink-' + NE.Navigation.CurrentChapterIndex).first();
            $('.NE-chapterlink').removeClass('disable');
            menuIitem.addClass('disable');
            if (menuIitem.length) $('#NE-chapter-label-big').html(menuIitem.html() + NE.Constants.HEADER_CHAPTER_NAV_ICON)
        },

        eof: null
    };

})();

