
var NE = NE || {};

NE.API_1484_11 = (function() {

    // _apiData = [];
    _apiData = {};

    return {
        Initialize: function(str) {
            console.log('NE.API_1484_11.Initialize()');
            if (Modernizr && Modernizr.localstorage) {
                console.log('window.localStorage is available!');
                try {
                    _apiData = JSON.parse(localStorage["_apiData"]);
                }
                catch (ex) {
                    console.log('Failed to parse cmi.suspend_data: ' + ex.message);
                    _apiData = {};
                }
            }
            return true;
        },

        Terminate: function(str) {
            console.log('NE.API_1484_11.Terminate()');
            
            if (Modernizr && Modernizr.localstorage) {
                console.log('window.localStorage is available!');

                try {
                    localStorage["_apiData"] = JSON.stringify(_apiData);
                }
                catch (ex) {
                    console.log('Failed to stringify data: ' + ex.message);
                }
            }
            return true;
        },

        GetValue: function(key) {
            console.log('NE.API_1484_11.GetValue(\'' + key + '\') returned: ' + _apiData[key]);
            return _apiData[key];
        },

        SetValue: function(key, value) {
            console.log('NE.API_1484_11.SetValue(\'' + key + '\', \'' + value + '\')');
            _apiData[key] = value;
            return true;
        },

        Commit: function(str) {
            console.log('NE.API_1484_11.Commit()');
            if (Modernizr && Modernizr.localstorage) {
                console.log('window.localStorage is available!');

                try {
                    localStorage["_apiData"] = JSON.stringify(_apiData);
                }
                catch (ex) {
                    console.log('Failed to stringify data: ' + ex.message);
                }
            }
            return true;
        },

        // Returns the error code that resulted from the last API call.
        GetLastError: function() {
            return 0;
        },

        // Returns a short string describing the specified error code.
        GetErrorString: function(errorCode) {
            return "No error occurred, the previous API call was successful.";
        },

        // Returns detailed information about the last error that occurred.
        GetDiagnostic: function(errorCode) {
            return "No error occurred, the previous API call was successful.";
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