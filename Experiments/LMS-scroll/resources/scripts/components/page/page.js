/// <reference path="../../libraries/masala-ux/dist/js/jquery.min.js" />
/// <reference path="../../NE.Plugin.js" />
/// <reference path="../../../../content/structure/courseTree.js" />
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

    function _hideScrollNavHinter(i_obj) {
        i_obj.animate({
            'top': (-i_obj.outerHeight()) + 'px',
            'border-bottom-left-radius': '100%',
            'border-bottom-right-radius': '100%',
            'opacity': 0
        }, 200);
    }

    var _time;
    var _scrollExitTImer;
    var _navTimer;
    var _beenNegative = false;

    function _addScrollWatch() {

        _myDOMContent.first().on('scroll', function () {

            var mp = $(this);
            var sh = $('#NE-scroll-nav-hint');
            var newPos;

            if (
                _settings.chapterIndex != NE.Navigation.CurrentChapterIndex
                ||
                _settings.index != NE.Navigation.CurrentPageIndex
                ) return;


            if (mp.scrollTop() < 0) {
                _beenNegative = true;
                newPos = Math.min(-sh.outerHeight() - (mp.scrollTop() * 1), 0);
                sh.stop().css('top', newPos + 'px');

            }
            else if (mp.scrollTop() === 0 && !_beenNegative) {
                newPos = Math.min(sh.position().top - (sh.position().top * .50), 0);
                sh.stop().css('top', newPos + 'px');
                mp.scrollTop(1);

            }

            else if ((mp.scrollTop() === 1 && !_beenNegative) || (mp.scrollTop() === 0 && _beenNegative)) {
                _scrollExitTImer = setTimeout(function () {
                    _hideScrollNavHinter(sh);
                }, 250);
            }

            else if ((mp.scrollTop() > 1 && sh.position().top > -sh.outerHeight())) {
                _hideScrollNavHinter(sh);
            }

            if (sh.position().top > -40) {
                if (!_navTimer) {
                    _navTimer = setTimeout(function () {
                        if (sh.position().top > -30) {
                            _hideScrollNavHinter(sh);
                            NE.Navigation.Previous();
                        }
                        _navTimer = null;
                    }, 600);
                }
            }

            var rad = Math.max((-sh.position().top), 10);
          
            sh.css({
                'border-bottom-left-radius': rad + '%',
                'border-bottom-right-radius': rad + '%',
                'opacity': ((sh.outerHeight() + sh.position().top) / 100)
            });


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

