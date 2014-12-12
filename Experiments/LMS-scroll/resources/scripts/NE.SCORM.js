
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

NE.SCORM = (function () {

    //////////////////////
    //
    //  Private fields 
    //
    /////////////////////

    var _progress;
    var _success;
    var _completion;

    //////////////////////
    //
    //  Initiation
    //
    /////////////////////

    (function () {

      
        NE.LMS.AddEvent(NE.LMS.ON_COMPLETION_STATUS_CHANGED, function (e) {
            _completion = e.status;
            alert('_completion ' + _completion);
            if (_completion == 'completed') {
                NE.LMS.Objectives.Set([{
                    id: NE.CourseTree.SCO_name,
                    completion_status: _completion || 'incomplete',
                    success_status: _success || 'failed,',
                    progress_measure: _progress || 0
                }]);
            }
        }, this);

        
        NE.LMS.AddEvent(NE.LMS.ON_PROGRESS_MESSURE_CHANGED, function (e) {
            alert('_progress ' + _progress);
            _progress = e.progress;
        }, this);


        NE.LMS.AddEvent(NE.LMS.ON_SUCCESS_STATUS_CHANGED, function (e) {
            alert('_success ' +_success);
            _success = e.success;
        }, this);

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

        NavigateToBookmark: function () {

            var _initBookmark = NE.LMS.Bookmark.GetBookmark();
            if (_initBookmark) {
                var visitItem = $('#' + _initBookmark);

                NE.Navigation.CurrentChapterIndex = parseInt(visitItem.data('chapter'), 10);
                NE.Navigation.CurrentPageIndex = parseInt(visitItem.data('index'), 10);

                NE.Navigation.ToPage(NE.Navigation.CurrentPageIndex, NE.Navigation.CurrentChapterIndex);

                NE.UI.ScrollToPage(false)

                _initBookmark = null;
            }

        },


        RegisterSections: function () {
            var sections = [];
            for (var i = 0; i < NE.CourseTree.chapters.length; i++) {
                sections.push(NE.LMS.Section(NE.CourseTree.SCO_name + '_' + NE.CourseTree.chapters[i].index));
            }
            NE.LMS.Sections.RegisterSections(sections);
        },


        Unlockhistory: function () {
            var sections = NE.LMS.Sections.GetSections();
            var lastChapterIndex;
            for (var i = 0; i < sections.length; i++) {
                if (sections[i].State == 'completed') {
                    var index = sections[i].ID.split('_');
                    index = parseInt(index[index.length - 1], 10);
                    lastChapterIndex = index;
                }
            }

            if (lastChapterIndex) {
                NE.UI.Unlock(lastChapterIndex);
                NE.UI.HideVIsitedItems(lastChapterIndex);
            }

        },


        //////////////////////
        //
        //  Public functions 
        //
        /////////////////////



        eof: null
    };

})();

