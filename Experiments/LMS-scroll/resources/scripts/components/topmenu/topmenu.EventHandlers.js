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
if (NE.Plugin.topmenu.EventHandlers === null || NE.Plugin.topmenu.EventHandlers === undefined) { NE.Plugin.topmenu.EventHandlers = {}; }

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

    function _updateChapterButton(jqItem, jqItemClass) {
        $('.' + jqItemClass).removeClass('disable');
        jqItem.addClass('disable');
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

        ChapterLabelClick: function (i_item) {
            var chapterMenuDiv = $('#NE-top-chapters');
            var menuHeight = 0;
            if (!chapterMenuDiv.hasClass('open')) {
                chapterMenuDiv.find('.NE-top-chapterlinks').each(function () {
                    var itemHeight = $(this).outerHeight();
                    menuHeight = itemHeight > menuHeight ? itemHeight : menuHeight;
                });
                $('#NE-top-backdrop').fadeTo(0, 0).fadeTo(300, 0.65);
            }
            else {
                $('#NE-top-backdrop').fadeTo(300, 0, function () {
                    $(this).hide();
                });
            }

            i_item.parent().toggleClass('active');
            chapterMenuDiv.css('height', menuHeight + 'px').toggleClass('open');
        },

        ChapterLabelXsClick: function (i_item) {
            if (i_item.hasClass('collapsed')) {
                $('#NE-top-backdrop').fadeTo(0, 0).fadeTo(300, 0.65);
            }
            else {
                $('#NE-top-backdrop').fadeTo(300, 0, function () {
                    $(this).hide();
                });
            }
            i_item.blur();
        },

        ChapterLinkClick: function (i_item) {
            if (i_item.hasClass('disable')) return;

            var chapterIndex = parseInt(i_item.data('chapter'), 10);
            NE.Navigation.ToChapter(chapterIndex);

            if (i_item.hasClass('NE-top-chapterlink-xs')) {
                $('#NE-chapter-label-xs').click();
            }
            else if (i_item.hasClass('NE-top-chapterlink')) {
                $('#NE-chapter-label').click();
            }
        },

        OverlayClick: function () {
            if ($('#NE-chapter-label').is(':visible')) {
                $('#NE-chapter-label').click();
            }
            else {
                $('#NE-chapter-label-xs').click();
            }
        },

        UpdateChapterMenu: function () {
            var menuIitem = $('#NE-top-chapterlink-' + NE.Navigation.CurrentChapterIndex);
            _updateChapterButton(menuIitem, 'NE-top-chapterlink');
            _updateChapterButton($('#NE-top-chapterlink-xs-' + NE.Navigation.CurrentChapterIndex), 'NE-top-chapterlink-xs');
            if (menuIitem.length) $('#NE-chapter-label').html(menuIitem.html() + NE.Constants.HEADER_CHAPTER_NAV_ICON)
        },

        eof: null
    };

})();

