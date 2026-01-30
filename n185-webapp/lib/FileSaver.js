/**
 * FileSaver.js - Simple file saving utility for offline use
 * Simplified version for n185 application
 */

(function (global) {
    'use strict';

    // Feature detection
    var saveAs = global.saveAs || (function () {
        if (typeof global === 'undefined' || typeof navigator !== 'undefined' && /MSIE [1-9]\./.test(navigator.userAgent)) {
            return;
        }

        var doc = global.document;
        var get_URL = function () {
            return global.URL || global.webkitURL || global;
        };
        var save_link = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        var can_use_save_link = 'download' in save_link;

        var click = function (node) {
            var event = new MouseEvent('click');
            node.dispatchEvent(event);
        };

        return function saveAs(blob, name, no_auto_bom) {
            name = name || 'download';

            if (!no_auto_bom) {
                blob = new Blob([blob], { type: blob.type });
            }

            var object_url = get_URL().createObjectURL(blob);

            if (can_use_save_link) {
                save_link.href = object_url;
                save_link.download = name;
                click(save_link);
                setTimeout(function () {
                    get_URL().revokeObjectURL(object_url);
                }, 4E4);
            } else {
                setTimeout(function () {
                    get_URL().revokeObjectURL(object_url);
                }, 4E4);

                if (/CriOS\/[\d]+/.test(navigator.userAgent)) {
                    location.href = object_url;
                } else {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        location.href = reader.result;
                    };
                    reader.readAsDataURL(blob);
                }
            }
        };
    }());

    // Export
    global.saveAs = saveAs;

}(typeof self !== 'undefined' && self || typeof window !== 'undefined' && window || this.content));
