// ==UserScript==
// @name        togetter-hide-user
// @namespace   togetter-hide-user
// @description togetterの特定ユーザを見えなくする
// @include     http://togetter.com/*
// @version     1
// @grant       none
// ==/UserScript==

var urlToIdPattern = /profile_images\/([^\/]+)/;

function urlToId(url) {
    if(url.match(urlToIdPattern)) {
        return RegExp.$1;
    } else {
        return null;
    }
}

function getCookieMap() {
    var ret = new Array();

    var allCookies = document.cookie;
    if( allCookies != '' ) {
        var cookies = allCookies.split('; ');
        for( var i = 0; i < cookies.length; i++ ) {
            var cookie = cookies[i].split('=');

            // クッキーの名前をキーとして 配列に追加する
            ret[cookie[0]] = decodeURIComponent(cookie[1]);
        }
    }

    return ret;
}

function getHiddenUserIds() {
    var cookieMap = getCookieMap();
    var joinedHiddenUserIds = cookieMap['hiddenUserIds'];
    if (joinedHiddenUserIds != null && joinedHiddenUserIds != '') {
        return joinedHiddenUserIds.split(' ');
    } else {
        return new Array();
    }
}

function setHiddenUserIds(ids) {
    var now = new Date();
    var maxAgeDay = 30;
    now.setTime(now.getTime() + maxAgeDay * 24 * 60 * 60 * 1000);
    var expires = now.toGMTString();
    var cookie = 'hiddenUserIds=' + encodeURIComponent(ids.join(' ')) + ";expires=" + expires;

    if (cookie.length > 4096) {
        return false;
    }

    document.cookie = cookie;
    hideUsers();
    return true;
}

function addHiddenUserId(id) {
    var ids = getHiddenUserIds();
    if ($.inArray(id, ids) == -1) {
        ids.push(id);
    }

    if (!setHiddenUserIds(ids)) {
        var deleted = 0;
        while (ids.length > 0) {
            ids.shift();
            deleted++;
            if (setHiddenUserIds(ids)) {
                alert("容量オーバーのため古いIDを" + deleted + "件削除しました。");
                return;
            }
        }
    }
}

function removeHiddenUserId(id) {
    var ids = getHiddenUserIds();
    var newIds = [];
    for (var i = 0; i < ids.length; i++) {
        if (id != ids[i]) {
            newIds.push(ids[i]);
        }
    }
    setHiddenUserIds(newIds);
}

function hideUsers() {
    var hiddenUserIds = getHiddenUserIds();
    $('.topics_box .icon_24').each(function() {
        var id = urlToId($(this).attr('data-lazy-src'));
        var parentLi = $(this).parents('li').filter(':not(.dummy)');
        var dummyParentLi = $(this).parents('li').next('li.dummy');

        if ($.inArray(id, hiddenUserIds) != -1) {
            parentLi.hide();
            if (dummyParentLi.size() == 0) {
                parentLi.after("<li class='clearfix dummy'></li>");
                dummyParentLi = parentLi.next('.dummy');

                dummyParentLi.attr('title', parentLi.find('h3').text());
                dummyParentLi.append("[削除済]");
                dummyParentLi.dblclick(function() {
                    if (confirm("このユーザを見えるようにしますか？")) {
                        removeHiddenUserId(id);
                    }
                });
            }

            dummyParentLi.show();
        } else {
            parentLi.show();
            dummyParentLi.hide();
        }
    });
}

$(function() {
    $('.topics_box .icon_24').dblclick(function() {
        var id = urlToId($(this).attr('data-lazy-src'));
        if (id == null || id == '') {
            return;
        }

        var hiddenUserIds = getHiddenUserIds();
        if ($.inArray(id, hiddenUserIds) == -1) {
            if (confirm("このユーザを見えなくしますか？")) {
                addHiddenUserId(id);
            }
        } else {
             if (confirm("このユーザを見えるようにしますか？")) {
                removeHiddenUserId(id);
            }
        }
    });

    hideUsers();
});
