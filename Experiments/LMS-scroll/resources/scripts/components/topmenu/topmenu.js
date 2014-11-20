/// <reference path="topmenu.EventHandlers.js" />
/// <reference path="../../NE.Plugin.js" />

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

NE.Plugin.topmenu = function (i_params) {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _params = i_params;
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

        Name: 'topmenu',

        Dependencies: [
            'topmenu.css',
            'topmenu.EventHandlers.js'
        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function () {

            NE.Plugin.ApplyTemplate(this, function (data) {

                _params.node.replaceWith(data);

                $(window).on('resize', function () {
                    NE.Plugin.topmenu.EventHandlers.WindowResize();
                });

                $('.NE-chapter-label').on('click', function () {
                    NE.Plugin.topmenu.EventHandlers.ChapterLabelClick($(this));
                });


                $('.NE-top-chapterlink').on('click', function () {
                    NE.Plugin.topmenu.EventHandlers.ChapterLinkClick($(this));
                });

                $('#NE-top-backdrop').on('click', function () {
                    NE.Plugin.topmenu.EventHandlers.OverlayClick($(this));
                });

                NE.Events.Add(NE.Navigation.ON_NAVIGATION, NE.Plugin.topmenu.EventHandlers.UpdateChapterMenu);

            });

        },

        SetTitle: function (params) {
            return params[0].data.replace(/{courseTitle}/g, NE.CourseTree.name);
        },

        MenuXs: function (params) {
            var returnData = '';
            for (var uid in NE.CourseTree.chapters) {
                var chapter = NE.CourseTree.chapters[uid];
                if (chapter.properties.displayInMenu !== false) {
                    returnData += params[0].data.replace(/{cahpterIndex}/g, chapter.index).replace(/{chapterTitle}/g, chapter.title);
                }
            }

            return returnData;
        },

        HeaderMenu: function (params) {

            var returnData = params[0].data;

            for (var uid in NE.CourseTree.chapters) {
                var chapter = NE.CourseTree.chapters[uid];
                if (chapter.properties.displayInMenu !== false) {
                    returnData += params[1].data.replace(/{cahpterIndex}/g, chapter.index).replace(/{chapterTitle}/g, chapter.title);
                }
            }

            returnData += params[2].data;

            return returnData;
        },

        eof: null
    };

};

