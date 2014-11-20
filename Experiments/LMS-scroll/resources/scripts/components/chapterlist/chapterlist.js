/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />
/// <reference path="../../NE.Events.js" />

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

NE.Plugin.chapterlist = function (i_params) {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _params = i_params;
    var _settings = {};
    var _myDOMContent;

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

    function _addToDOM(i_content) {
        _params.node.replaceWith(i_content);
    }

    function _pageOnLoad(e) {
        if (e.chapter == _settings.index) {
            me.LoadedPages++;

            if (me.LoadedPages == _settings.chapter.pages.length) {
                me.OnLoaded({
                    guid: NE.CourseTree.chapters[_settings.index].guid,
                    index: _settings.index
                });
            }

        }
    }

    //////////////////////
    //
    //  Return object
    //
    /////////////////////

    var me = {

        //////////////////////
        //
        //  Public fields 
        //
        /////////////////////

        Name: 'chapterlist',
        LoadedPages: 0,
        Dependencies: [
            'chapterlist.css'
        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function () {

            _settings = _params.settings;

            NE.Plugin.ApplyTemplate(this, function (data) {

                data = data.replace(/{panelID}/g, _settings.panelID).replace(/{panelClasses}/g, _settings.panelClasses)

                _myDOMContent = $(data);
                _addToDOM(_myDOMContent);
                me.OnLoaded();

            });

        },

        Render: function (params) {
      
            var numChapters = NE.CourseTree.chapters.length;
            var half = Math.ceil(numChapters / 2);
            var reps = 1;
            var colspan = 'col-xs-12';

            if (numChapters > 4) {
                colspan += ' col-sm-6';
                reps = 2;
            }

            var returnData = '';

            var isLast;

            for (var i = 0; i < reps ; i++) {

                isLast = i == reps - 1 ? ' last-item' : '';
                returnData += params[0].data.replace(/{colspan}/g, colspan).replace(/{isLastItem}/g, isLast);

                for (var j = half * i; j < (i == 0 && reps != 1 ? half : numChapters) ; j++) {

                    isLast = j == numChapters - 1 ? ' last-item' : '';
                    var chapter = NE.CourseTree.chapters[j];

                    var link = params[1].data.replace(/{cahpterIndex}/g, chapter.index);
                    link = link.replace(/{chapterTitle}/g, chapter.title);
                    link = link.replace(/{linkPrefix}/g, _settings.linkPrefix);
                    link = link.replace(/{isLastItem}/g, isLast);

                    returnData += link;
                }

                returnData += params[2].data;
            }

            return returnData;
        },

        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

