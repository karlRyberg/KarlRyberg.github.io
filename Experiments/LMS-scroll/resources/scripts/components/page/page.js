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

NE.Plugin.page = function (i_params) {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _params = i_params;
    var _settings = {};
    var _myDOMContent;
    var _numComponents = 0;
    var _componentsLoaded = 0;
    var _scrollTimer;
    var _scrollPadd = 0;
    var _maxScrollPadd = 100;

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

    function _onCompnentsLoad(e) {

        _componentsLoaded++;

        if (_componentsLoaded == _numComponents) {
            _pageComplete();
        }

    }

    function _buildPage(i_html) {
 
        $('#' + NE.Constants.PAGE_ID_PREFIX + _settings.chapterIndex + '-' + _settings.index).html(i_html);
        _numComponents = $('.NE-plugin-container', _myDOMContent.first()).length;
   
        if (_numComponents > 0) {
            NE.Plugin.LoadAll(_myDOMContent.first(), _onCompnentsLoad);
        }
        else {
            _pageComplete();
        }
    }

    function _pageComplete() {

        _addScrollWatch();

        me.OnLoaded({
            chapter: _settings.chapterIndex,
            index: _settings.index,
            guid: _settings.guid,
        });
    }

    function _addScrollWatch() {
  
        _myDOMContent.first().on('scroll touchmove', function () {
         
            clearTimeout(_scrollTimer);

            if ($(this).scrollTop() <= 0) {

                _scrollPadd += (_maxScrollPadd - _scrollPadd) * 0.5
          
                $('#' + NE.Constants.CHAPTER_ID_PREFIX + _settings.chapterIndex).css('padding-top', _scrollPadd + 'px');
             
                $(this).scrollTop(1)
            }

            _scrollTimer = setTimeout(function () {
                _scrollPadd = 0;
                $('#' + NE.Constants.CHAPTER_ID_PREFIX + _settings.chapterIndex).animate({ 'padding-top': '0px' },200);
            }, 500);


        });

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

        Name: 'page',
        Dependencies: [
            'page.css'
        ],

        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////

        Init: function () {

            _settings = _params.settings;

            NE.Plugin.ApplyTemplate(this, function (data) {

                _myDOMContent = $(data);
                _addToDOM(_myDOMContent);

                if (_settings.datafile) {
                    NE.Net.LoadTxtFile(_settings.datafile, function (htmlData) {
                        _buildPage(htmlData);
                    });
                }
                else {
                    _pageComplete();
                }

            });

        },

        RenderPage: function (params) {
            var returnVal = '';
            returnVal += params[0].data.replace(/{pageID}/g, NE.Constants.PAGE_ID_PREFIX + _settings.chapterIndex + '-' + _settings.index);
            returnVal += params[1].data;
            return returnVal;
        },

        OnLoaded: function (e) { },

        eof: null
    };

    return me;

};

