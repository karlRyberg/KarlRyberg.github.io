/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />

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

NE.Plugin.chapter = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _settings = {};

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

        Dependencies: [
            'chapter.css'
        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function (i_initObj) {

            _settings = i_initObj.settings;
            console.log(_settings);
            NE.Plugin.ApplyTemplate(i_initObj.name, function (data) {

                var newContent = $(data);
                var chapterDiv = newContent.first();

                i_initObj.node.replaceWith(newContent);

                chapterDiv.attr('id', NE.Constants.CHAPTER_ID_PREFIX + _settings.index);

                $('.NE-plugin-container', chapterDiv).each(function () {
                    NE.Plugin.Load({
                        name: $(this).data('plugin'),
                        node: $(this),
                        settings: JSON.parse(unescape($(this).data('settings')))
                    });
                });

            });

        },

        AddPages: function (params) {
            var returnVal = '';

            for (var i = 0; i < _settings.chapter.pages.length; i++) {

                var pageID = NE.Constants.PAGE_ID_PREFIX + _settings.index + '-' + i;
                var page = NE.CourseTree.chapters[_settings.index].pages[i];
                var contentFile = '/content/data/' + page.datafile + '.html';

                var pageSettings = {
                    chapterIndex: _settings.index,
                    pageIndex: i,
                    datafile: NE.Constants.APPLICATION_BASE_PATH + contentFile
                }

                returnVal += '<div class="NE-plugin-container" data-plugin="page" data-settings="' + escape(JSON.stringify(pageSettings)) + '"></div>';

            }

            return returnVal;

        },

        eof: null
    };

})();

