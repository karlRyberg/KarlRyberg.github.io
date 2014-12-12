﻿/// <reference path="NE.API_1484_11.js" />
///
/// Contains the functions that are used by the SCO <-> LMS communication
/// 

var NE = NE || {};

NE.Infrastructure = (function () {

    var _api = null;
    var _nFindAPITries = 0;
    var _maxTries = 500;
        
    function _scanForAPI(win)
    {
        while ((win.API_1484_11 == null) && (win.parent != null) && (win.parent != win))
        {
            _nFindAPITries++;
            if (_nFindAPITries > _maxTries)
            {
                return null;
            }
            win = win.parent;
        }
        return win.API_1484_11;
    }
    
    function _getAPI(win) {

        var foundAPI = null;

        if ((win.parent != null) && (win.parent != win)) {
            foundAPI = _scanForAPI(win.parent);
        }
        if ((foundAPI == null) && (win.opener != null)) {
            foundAPI = _scanForAPI(win.opener);
        }

        if (!foundAPI && NE.API_1484_11) {
            foundAPI = NE.API_1484_11;
        }

        return foundAPI;
    }

    return {

        // Starts a communication session with the LMS
        Initialize: function () {

            if (!_api) _api = _getAPI(window);
            if (!_api) throw Error('LMS could not be found');

            var initResult = _api.Initialize("");
            if (!initResult) throw Error('LMS could not initialize');

        },

        // Saves a value to the LMS.
        SetValue: function (key, value) {
            return _api.SetValue(key, value);
        },

        // Retrieves a value from the LMS.
        GetValue: function (key) {
            return _api.GetValue(key);
        },

        // Indicates to the LMS that all data should be persisted (not required).
        Commit: function (str) {
            return _api.Commit(str);
        },

        // Ends a communication session with the LMS.
        Terminate: function (str) {
            return _api.Terminate(str);
        },

        // Returns the error code that resulted from the last API call.
        GetLastError: function() {
            return _api.GetLastError();
        },

        // Returns a short string describing the specified error code.
        GetErrorString: function(errorCode) {
            return _api.GetErrorString(errorCode);
        },

        // Returns detailed information about the last error that occurred.
        GetDiagnostic: function(errorCode) {
            return _api.GetDiagnostic(errorCode);
        }

    };

})();

/*

Error Codes
No Error (0) No error occurred, the previous API call was successful.

General Exception (101) 
No specific error code exists to describe the error. Use GetDiagnostic for more information.

General Initialization Failure (102) 
Call to Initialize failed for an unknown reason.

Already Initialized (103) 
Call to Initialize failed because Initialize was already called.

Content Instance Terminated (104) 
Call to Initialize failed because Terminate was already called.

General Termination Failure (111) 
Call to Terminate failed for an unknown reason.

Termination Before Initialization (112) 
Call to Terminate failed because it was made before the call to Initialize.

Termination After Termination (113) 
Call to Terminate failed because Terminate was already called.

Retrieve Data Before Initialization (122) 
Call to GetValue failed because it was made before the call to Initialize.

Retrieve Data After Termination (123) 
Call to GetValue failed because it was made after the call to Terminate.

Store Data Before Initialization (132) 
Call to SetValue failed because it was made before the call to Initialize.

Store Data After Termination (133) 
Call to SetValue failed because it was made after the call to Terminate.

Commit Before Initialization (142) 
Call to Commit failed because it was made before the call to Initialize.

Commit After Termination (143) 
Call to Commit failed because it was made after the call to Terminate.

General Argument Error (201) 
An invalid argument was passed to an API method (usually indicates that Initialize, Commit or Terminate did not receive the expected empty string argument.

General Get Failure (301) 
Indicates a failed GetValue call where no other specific error code is applicable. Use GetDiagnostic for more information.

General Set Failure (351) 
Indicates a failed SetValue call where no other specific error code is applicable. Use GetDiagnostic for more information.

General Commit Failure (391) 
Indicates a failed Commit call where no other specific error code is applicable. Use GetDiagnostic for more information.

Undefined Data Model Element (401) 
The data model element name passed to GetValue or SetValue is not a valid SCORM data model element.

Unimplemented Data Model Element (402) 
The data model element indicated in a call to GetValue or SetValue is valid, but was not implemented by this LMS. In SCORM 2004, this error would indicate an LMS that is not fully SCORM conformant.

Data Model Element Value Not Initialized (403) 
Attempt to read a data model element that has not been initialized by the LMS or through a SetValue call. This error condition is often reached during normal execution of a SCO.

Data Model Element Is Read Only (404) 
SetValue was called with a data model element that can only be read.

Data Model Element Is Write Only (405) 
GetValue was called on a data model element that can only be written to.

Data Model Element Type Mismatch (406) 
SetValue was called with a value that is not consistent with the data format of the supplied data model element.

Data Model Element Value Out Of Range (407) 
The numeric value supplied to a SetValue call is outside of the numeric range allowed for the supplied data model element.

Data Model Dependency Not Established (408) 
Some data model elements cannot be set until another data model element was set. This error condition indicates that the prerequisite element was not set before the dependent element.

*/