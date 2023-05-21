/**
 * Developer Name: Arindam Roy
 * arindam.roy.developer@gmail.com
 * https://github.com/dev-arindam-roy
 */
const allBtn = document.querySelector('#allBtn');
const searchBtn = document.querySelector('#searchBtn');
const recentBtn = document.querySelector('#recentBtn');
const result = document.querySelector('#result');
const downloadBtn = document.querySelector('#downloadBookmarkCsv');

const searchKeyword = document.querySelector('#searchTxtb');
const infoText = document.querySelector('#infoHolder');

const removeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f10101" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

var bookmarObject = new Array();

/** All Event Listeners, each listners call a Promise */
recentBtn.addEventListener('click', recentBookmarks);
allBtn.addEventListener('click', allBookmarks);
searchBtn.addEventListener('click', searchBookmarks);
searchKeyword.addEventListener('keyup', searchBoxAction);
downloadBtn.addEventListener('click', downloadAsCsv);

window.addEventListener('DOMContentLoaded', async () => {
    result.innerHTML = initLoading();
    onLoadInit();
    recentBookmarks();
});

/** onLoadInit */
function onLoadInit() {
    searchKeyword.value = '';
    searchKeyword.style.borderColor = '#ddd';
    searchBtn.setAttribute('disabled', 'disabled');
    searchBtn.classList.add('btn-disabled');
}

/** Search textbox onKeyup eventlistener */
function searchBoxAction(event) {
    if (event.target.value != null && event.target.value != '') {
        searchKeyword.style.borderColor = '#ddd';
        searchBtn.removeAttribute('disabled');
        searchBtn.classList.remove('btn-disabled');
    } else {
        searchBtn.setAttribute('disabled', 'disabled');
        searchBtn.classList.add('btn-disabled');
    }
}

/** search bookmarks eventlistner call -> getSearchBookmarks() Promise */
async function searchBookmarks() {
    let searchKeywordText = searchKeyword.value.trim();
    if (searchKeywordText != null && searchKeywordText != '') { 
        result.innerHTML = initLoading();
        await getSearchBookmarks(searchKeywordText).then((bookmarkJsonString) => {
            infoText.innerHTML = "Getting your search bookmarks....";
            loadBookmarks(bookmarkJsonString, 'search');
        }).catch((error) => {
            loadErrors(error);
        });
    } else {
        searchKeyword.focus();
        searchKeyword.style.borderColor = "red";
    }
}

/** recent bookmarks eventlistner call -> getRecentBookmarks() Promise */
async function recentBookmarks() {
    result.innerHTML = initLoading();
    onLoadInit();
    await getRecentBookmarks().then((bookmarkJsonString) => {
        infoText.innerHTML = "Getting your recent bookmarks....";
        loadBookmarks(bookmarkJsonString, 'recent');
    }).catch((error) => {
        loadErrors(error);
    });
}

/** all bookmarks eventlistner call -> getAllBookmarks() Promise */
async function allBookmarks() {
    result.innerHTML = initLoading();
    onLoadInit();
    await getAllBookmarks().then((bookmarkJsonString) => {
        infoText.innerHTML = "Getting your all bookmarks....";
        loadBookmarks(bookmarkJsonString, 'all');
    }).catch((error) => {
        loadErrors(error);
    });
}

/** recursively call within promise */
function fetchBookmarks(parentNode) {
    parentNode.forEach(function(bookmark) {
        if(!(bookmark.url === undefined || bookmark.url === null)) {
            bookmarObject.push({id: bookmark.id, title: bookmark.title, url: bookmark.url, createdAt: formatDate(bookmark.dateAdded)});
        }
        if (bookmark.children) {
            fetchBookmarks(bookmark.children);
        }
    });
}

/** Promise for fetch all bookmarks */
function getAllBookmarks() {
    return new Promise((resolve, reject) => {
        try {
            bookmarObject = new Array();
            chrome.bookmarks.getTree(function(rootNode) {
                fetchBookmarks(rootNode);
                resolve(JSON.stringify(bookmarObject));
            });
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Promise for fetch recent bookmarks */
function getRecentBookmarks() {
    return new Promise((resolve, reject) => {
        try {
            let recentBookmarObject = new Array();
            chrome.bookmarks.getRecent(100, (results) => {
                results.forEach(function(bookmark) {
                    if(!(bookmark.url === undefined || bookmark.url === null)) {
                        recentBookmarObject.push({id: bookmark.id, title: bookmark.title, url: bookmark.url, createdAt: formatDate(bookmark.dateAdded)});
                    }
                });
                resolve(JSON.stringify(recentBookmarObject));
            });
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Promise for search keyword bookmarks */
function getSearchBookmarks(searchKeywordText) {
    return new Promise((resolve, reject) => {
        try {
            let searchBookmarObject = new Array();
            chrome.bookmarks.search(searchKeywordText, (results) => {
                results.forEach(function(bookmark) {
                    if(!(bookmark.url === undefined || bookmark.url === null)) {
                        searchBookmarObject.push({id: bookmark.id, title: bookmark.title, url: bookmark.url, createdAt: formatDate(bookmark.dateAdded)});
                    }
                });
                resolve(JSON.stringify(searchBookmarObject));
            });
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Promise for remove bookmark */
function removeBookmarkById(bookmarkId) {
    return new Promise((resolve, reject) => {
        try {
            chrome.bookmarks.remove(bookmarkId);
            resolve(bookmarkId);
        } catch(error) {
            reject('Something Went Wrong!! Please Try Again...');
        }
    });
}

/** Display date format */
function formatDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10).replace(/-/g,"/");
}

/** Rendering bookmarks - UI */
function loadBookmarks(jsonString, actionType = null) {
    result.innerHTML = initLoading();
    if (jsonString) {
        setTimeout(() => {
            let obj = JSON.parse(jsonString);
            if (actionType == 'search') {
                obj = obj.reverse();
            }
            if (obj.length && Object.keys(obj)) {
                let renderHtml = '';
                obj.map((item, index) => {
                    renderHtml += `<tr class="bookmark-row" id="bookmarkRow${index}">
                        <td>
                            <span class="bookmark-title">${item.title}</span><br/>
                            <a href="${item.url}" class="bookmark-link" target="_blank">${item.url}</a>
                            <a href="#" class="remove-btn remove-bookmark-btn" id="removeBookmark_${index}" data-bookmark-id="${item.id}">${removeSvg}</a>
                        </td>
                        <td><span class="bookmark-date">${item.createdAt}</span></td>
                    </tr>`;
                });
                result.innerHTML = renderHtml;
                infoText.innerHTML = '';
                if (actionType == 'recent') {
                    infoText.innerHTML = `Recent ${obj.length} Bookmarks`;
                }
                if (actionType == 'all') {
                    infoText.innerHTML = `Your all Bookmarks - ${obj.length}`;
                }
                if (actionType == 'search') {
                    infoText.innerHTML = `Found - ${obj.length} Bookmarks`;
                }
            } else {
                noRecordsFound();
                infoText.innerHTML = `Found - ${obj.length} Bookmarks`;
            }
        }, 3000);
    }
}

/** Rendering error - UI */
function loadErrors(errorString) {
    result.innerHTML = initLoading();
    if (errorString) {
        setTimeout(() => {
            result.innerHTML = `<tr><td colspan="2"><span class="error-msg">${errorString}</span></td></tr>`;
        }, 2000);
    }
}

/** No records rendering - UI */
function noRecordsFound() {
    result.innerHTML = `<tr><td colspan="2">Oops! I'm very Sorry, No Bookmarks Found.</td></tr>`;
}

/** Get remove bookmark btn event dynamically */
document.querySelector('body').addEventListener('click', function(event) {
    const tagName = event.target.tagName.toLowerCase();
    const parentElement = event.target.parentNode;
    const parentElementTagName = parentElement.tagName.toLowerCase();
    if (tagName === 'svg' && parentElementTagName === 'a') {
        const parentElementClassLsit = parentElement.classList.value.split(' ');
        if (parentElementClassLsit.includes('remove-bookmark-btn')) {
            if (confirm('Are you want to delete?')) {
                const removeBtnId = parentElement.id;
                if (removeBtnId) {
                    const rowIndex = removeBtnId.split('_')[1];
                    const bookmarkId = parentElement.getAttribute('data-bookmark-id');
                    if (rowIndex && bookmarkId) {
                        infoText.innerHTML = 'Bookmark deleting...';
                        removeLoading(rowIndex);
                        setTimeout(() => {
                            removeBookmark(rowIndex, bookmarkId);
                        }, 2000);
                    }
                }
            }
        }
    }
});

/** Remove the bookmark */
async function removeBookmark(rowIndex, bookmarkId) {
    await removeBookmarkById(bookmarkId).then((resolveResp) => {
        if (bookmarkId == resolveResp) {
            document.getElementById('bookmarkRow' + rowIndex).remove();
            infoText.innerHTML = `<span style="color: red;">Bookmark Id - ${resolveResp} has been deleted</span>`;
        }
    }).catch((rejectResp) => {
        loadErrors(rejectResp);
    });
}

/** display remove loading placeholder */
function removeLoading(rowIndex) {
    document.getElementById('bookmarkRow' + rowIndex).innerHTML = `<td colspan="2">${rowLoadingPlaceholder()}</td>`;
}

/** Download as CSV - json object */
async function downloadAsCsv(e) {
    e.preventDefault();
    infoText.innerHTML = 'Start downloading...';
    await getAllBookmarks().then((bookmarkJsonString) => {
        createCsv(bookmarkJsonString);
    }).catch((error) => {
        loadErrors(error);
    });
}

/** create CSV from Json Object */
function createCsv(jsonString) {
    const jsonObj = JSON.parse(jsonString);
    if (jsonObj.length) {
        const csvHeaders = Object.keys(jsonObj[0]).toString();
        const csvDatas = jsonObj.map((item) => {
            return Object.values(item).toString();
        });
        const csvReady = [csvHeaders, ...csvDatas].join('\n');
        startCsvDownload(csvReady, jsonObj.length);
    }
}

/** start csv download */
function startCsvDownload(csvFormatString, dataCount = 0) {
    const blob = new Blob([csvFormatString], { 'type': 'application/csv'});
    const blobUrl = URL.createObjectURL(blob);
    const aElem = document.createElement('a');
    aElem.download = 'onex-bookmark-export-' + Date.now() + '.csv';
    aElem.href = blobUrl;
    aElem.style.display = 'none';
    document.body.appendChild(aElem);
    aElem.click();
    aElem.remove();
    URL.revokeObjectURL(blobUrl);
    infoText.innerHTML = `${dataCount} - Bookmarks exported as CSV`;
}

/** Loading placeholder */
function displayPlaceholder() {
    return `<div class="ph-item">
        <div class="ph-col-12">
            <div class="ph-row">
                <div class="ph-col-6"></div>
                <div class="ph-col-6 empty"></div>
                <div class="ph-col-4"></div>
                <div class="ph-col-8 empty"></div>
                <div class="ph-col-6"></div>
                <div class="ph-col-6 empty"></div>
                <div class="ph-col-12"></div>
            </div>
        </div>
    </div>`;
}

/** row loading placeholder */
function rowLoadingPlaceholder() {
    return `<div class="ph-item tr-loading-placeholder">
        <div class="ph-col-12">
            <div class="ph-row">
                <div class="ph-col-6"></div>
                <div class="ph-col-6 empty"></div>
                <div class="ph-col-12"></div>
            </div>
        </div>
    </div>`;
}

/** Rendering placeholder */
function initLoading() {
    return `<tr><td colspan="2">${displayPlaceholder()}</td></tr>
        <tr><td colspan="2">${displayPlaceholder()}</td></tr>`;
}